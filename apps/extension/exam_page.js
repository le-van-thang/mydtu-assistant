(() => {
  const EXAM_LIST_BASE = "https://pdaotao.duytan.edu.vn/EXAM_LIST/";
  const ADAPTER_KEY = "pdaotao_exam_v1";
  const ADAPTER_VERSION = "1.0.0";

  function normalizeSpace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function absoluteUrl(url) {
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
      date
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
      /\b([A-Z]{2,}-[A-Z0-9-]+)\b/
    ];

    for (const pattern of patterns) {
      const match = raw.match(pattern);
      if (match) return normalizeSpace(match[1]);
    }

    return "";
  }

  function extractTitleWithoutPublishedAt(text) {
    return normalizeSpace(text.replace(/\(\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}\)\s*$/, ""));
  }

  function parseListDocument(doc) {
    const anchors = Array.from(doc.querySelectorAll("a[href*='EXAM_LIST_Detail']"));
    const items = [];

    for (const anchor of anchors) {
      const text = normalizeSpace(anchor.textContent || "");
      if (!text) continue;

      const href = absoluteUrl(anchor.getAttribute("href") || "");
      if (!href) continue;

      const liText = normalizeSpace(anchor.closest("li")?.textContent || text);
      const sourceText = liText || text;

      const publishedAt = parsePublishedAtFromText(sourceText);
      const title = extractTitleWithoutPublishedAt(sourceText);
      const courseCode = extractCourseCode(sourceText);
      const isNew =
        !!anchor.closest("li")?.innerHTML?.toLowerCase().includes("new") ||
        !!sourceText.toLowerCase().includes("new");

      items.push({
        detailUrl: href,
        title,
        publishedAt,
        courseCode,
        isNew,
        planType: detectPlanType(sourceText),
        sourceText
      });
    }

    const deduped = [];
    const seen = new Set();

    for (const item of items) {
      if (seen.has(item.detailUrl)) continue;
      seen.add(item.detailUrl);
      deduped.push(item);
    }

    return deduped;
  }

  function parseDetailDocument(doc, detailUrl) {
    const attachmentAnchors = Array.from(doc.querySelectorAll("a[href]"))
      .map((a) => ({
        href: absoluteUrl(a.getAttribute("href") || ""),
        text: normalizeSpace(a.textContent || "")
      }))
      .filter((a) => a.href && /\.(xlsx|xls)$/i.test(a.href));

    const detailText = normalizeSpace(doc.body?.textContent || "");

    return {
      detailUrl,
      attachmentUrl: attachmentAnchors[0]?.href || null,
      attachmentName: attachmentAnchors[0]?.text || null,
      detailText
    };
  }

  async function fetchHtml(url) {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`Fetch failed ${res.status} for ${url}`);
    }

    return await res.text();
  }

  function htmlToDocument(html) {
    return new DOMParser().parseFromString(html, "text/html");
  }

  async function scrapeExamNotices(options = {}) {
    const maxPages = Math.max(1, Math.min(Number(options.maxPages || 2), 10));
    const maxItems = Math.max(1, Math.min(Number(options.maxItems || 30), 100));

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

        enriched.push({
          ...item,
          ...detail
        });
      } catch (error) {
        enriched.push({
          ...item,
          attachmentUrl: null,
          attachmentName: null,
          detailText: "",
          detailError: String(error?.message || error)
        });
      }
    }

    return {
      adapterKey: ADAPTER_KEY,
      adapterVersion: ADAPTER_VERSION,
      sourcePage: `${EXAM_LIST_BASE}?page=1&lang=VN`,
      scrapedAt: new Date().toISOString(),
      notices: enriched
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.type !== "SCRAPE_EXAMS") return;

    (async () => {
      try {
        const data = await scrapeExamNotices(msg.payload || {});
        sendResponse({ ok: true, data });
      } catch (error) {
        sendResponse({
          ok: false,
          error: String(error?.message || error)
        });
      }
    })();

    return true;
  });
})();