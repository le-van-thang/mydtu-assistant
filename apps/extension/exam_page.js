// path: apps/extension/exam_page.js
(() => {
  const EXAM_LIST_BASE = "https://pdaotao.duytan.edu.vn/EXAM_LIST/";
  const ADAPTER_KEY = "pdaotao_exam_v1";
  const ADAPTER_VERSION = "1.1.0";

  function normalizeSpace(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toAbsoluteUrl(url) {
    try {
      return new URL(url, EXAM_LIST_BASE).toString();
    } catch {
      return "";
    }
  }

  function parsePublishedAtFromText(text) {
    const raw = normalizeSpace(text);
    const match = raw.match(/(\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/);

    if (!match) return null;

    const [, time, date] = match;
    return {
      raw: `${time} ${date}`,
      time,
      date,
    };
  }

  function detectPlanType(text) {
    const s = normalizeSpace(text).toLowerCase();

    if (
      s.includes("dự kiến") ||
      s.includes("du kien") ||
      s.includes("tentative")
    ) {
      return "tentative";
    }

    if (
      s.includes("chính thức") ||
      s.includes("chinh thuc") ||
      s.includes("official")
    ) {
      return "official";
    }

    return "official";
  }

  function extractCourseCode(text) {
    const raw = normalizeSpace(text);

    const patterns = [
      /\b([A-Z]{2,}[A-Z0-9]*\s?\d{2,}[A-Z0-9-]*)\b/,
      /\b([A-Z]{2,}-[A-Z0-9-]+)\b/,
    ];

    for (const pattern of patterns) {
      const match = raw.match(pattern);
      if (match) return normalizeSpace(match[1]);
    }

    return "";
  }

  function stripPublishedAtTail(text) {
    return normalizeSpace(
      text.replace(/\(\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}\)\s*$/, ""),
    );
  }

  function detectAttachmentTypeFromUrl(url) {
    const lower = String(url || "").toLowerCase();

    if (lower.endsWith(".xlsx")) {
      return {
        kind: "excel",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }

    if (lower.endsWith(".xls")) {
      return {
        kind: "excel",
        mimeType: "application/vnd.ms-excel",
      };
    }

    if (lower.endsWith(".pdf")) {
      return {
        kind: "pdf",
        mimeType: "application/pdf",
      };
    }

    return {
      kind: "unknown",
      mimeType: null,
    };
  }

  function parseListDocument(doc) {
    const anchors = Array.from(
      doc.querySelectorAll("a[href*='EXAM_LIST_Detail']"),
    );

    const items = [];
    const seen = new Set();

    for (const anchor of anchors) {
      const href = toAbsoluteUrl(anchor.getAttribute("href") || "");
      if (!href || seen.has(href)) continue;
      seen.add(href);

      const text = normalizeSpace(anchor.textContent || "");
      const liText = normalizeSpace(anchor.closest("li")?.textContent || text);
      const sourceText = liText || text;

      items.push({
        detailUrl: href,
        title: stripPublishedAtTail(sourceText),
        courseCode: extractCourseCode(sourceText),
        publishedAt: parsePublishedAtFromText(sourceText),
        isNew:
          !!anchor.closest("li")?.innerHTML?.toLowerCase().includes("new") ||
          sourceText.toLowerCase().includes("new"),
        planType: detectPlanType(sourceText),
        sourceText,
      });
    }

    return items;
  }

  function parseDetailDocument(doc, detailUrl) {
    const attachmentAnchors = Array.from(doc.querySelectorAll("a[href]"))
      .map((a) => {
        const href = toAbsoluteUrl(a.getAttribute("href") || "");
        const text = normalizeSpace(a.textContent || "");
        const detected = detectAttachmentTypeFromUrl(href);

        return {
          href,
          text,
          kind: detected.kind,
          mimeType: detected.mimeType,
        };
      })
      .filter((a) => a.href && (a.kind === "excel" || a.kind === "pdf"));

    const detailText = normalizeSpace(doc.body?.textContent || "");

    const preferred =
      attachmentAnchors.find((x) => x.kind === "excel") ||
      attachmentAnchors.find((x) => x.kind === "pdf") ||
      null;

    return {
      detailUrl,
      attachmentUrl: preferred?.href || null,
      attachmentName: preferred?.text || null,
      attachmentKind: preferred?.kind || null,
      attachmentMimeType: preferred?.mimeType || null,
      detailText,
    };
  }

  async function fetchHtml(url) {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Fetch failed ${res.status} for ${url}`);
    }

    return await res.text();
  }

  function htmlToDocument(html) {
    return new DOMParser().parseFromString(html, "text/html");
  }

  async function blobToBase64(blob) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = String(reader.result || "");
        const commaIndex = result.indexOf(",");
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };

      reader.onerror = () => reject(new Error("Cannot convert blob to base64"));
      reader.readAsDataURL(blob);
    });
  }

  async function fetchAttachmentPayload(url) {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Attachment fetch failed ${res.status}`);
    }

    const blob = await res.blob();
    const base64 = await blobToBase64(blob);

    return {
      base64,
      mimeType: blob.type || detectAttachmentTypeFromUrl(url).mimeType || null,
      size: blob.size || null,
    };
  }

  async function scrapeExamNotices(options = {}) {
    const maxPages = Math.max(1, Math.min(Number(options.maxPages || 2), 10));
    const maxItems = Math.max(1, Math.min(Number(options.maxItems || 24), 60));

    const collected = [];
    const seenDetailUrls = new Set();

    for (let page = 1; page <= maxPages; page += 1) {
      const url = `${EXAM_LIST_BASE}?page=${page}&lang=VN`;
      const html = await fetchHtml(url);
      const doc = htmlToDocument(html);
      const listItems = parseListDocument(doc);

      if (!listItems.length) break;

      for (const item of listItems) {
        if (seenDetailUrls.has(item.detailUrl)) continue;
        seenDetailUrls.add(item.detailUrl);
        collected.push(item);

        if (collected.length >= maxItems) break;
      }

      if (collected.length >= maxItems) break;
    }

    const enriched = [];

    for (const item of collected) {
      try {
        const detailHtml = await fetchHtml(item.detailUrl);
        const detailDoc = htmlToDocument(detailHtml);
        const detail = parseDetailDocument(detailDoc, item.detailUrl);

        let attachmentBase64 = null;
        let attachmentMimeType = detail.attachmentMimeType || null;

        if (detail.attachmentUrl) {
          try {
            const attachment = await fetchAttachmentPayload(
              detail.attachmentUrl,
            );
            attachmentBase64 = attachment.base64;
            attachmentMimeType = attachment.mimeType || attachmentMimeType;
          } catch (attachmentError) {
            enriched.push({
              ...item,
              ...detail,
              attachmentBase64: null,
              attachmentMimeType,
              attachmentError: String(
                attachmentError?.message || attachmentError,
              ),
            });
            continue;
          }
        }

        enriched.push({
          ...item,
          ...detail,
          attachmentBase64,
          attachmentMimeType,
        });
      } catch (error) {
        enriched.push({
          ...item,
          attachmentUrl: null,
          attachmentName: null,
          attachmentKind: null,
          attachmentMimeType: null,
          attachmentBase64: null,
          detailText: "",
          detailError: String(error?.message || error),
        });
      }
    }

    return {
      adapterKey: ADAPTER_KEY,
      adapterVersion: ADAPTER_VERSION,
      sourcePage: `${EXAM_LIST_BASE}?page=1&lang=VN`,
      scrapedAt: new Date().toISOString(),
      notices: enriched,
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== "SCRAPE_EXAMS") return;

    (async () => {
      try {
        const data = await scrapeExamNotices(msg.payload || {});
        sendResponse({ ok: true, data });
      } catch (error) {
        sendResponse({
          ok: false,
          error: String(error?.message || error),
        });
      }
    })();

    return true;
  });
})();
