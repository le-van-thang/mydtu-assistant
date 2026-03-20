// path: apps/extension/transcript_detail_page.js
(() => {
  function log(...args) {
    console.log("[MYDTU TRANSCRIPT DETAIL]", ...args);
  }

  function normalizeSpace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function toNumber(value) {
    const raw = normalizeSpace(value).replace(",", ".");
    if (!raw || raw === "-" || raw === "--") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function getYearSelect() {
    return (
      document.querySelector(
        "select[id*='cboNamHoc'], select[name*='cboNamHoc']",
      ) || null
    );
  }

  function getTermSelect() {
    return (
      document.querySelector(
        "select[id*='cboHocKy'], select[name*='cboHocKy']",
      ) || null
    );
  }

  function getClassTable() {
    return (
      document.querySelector("table.tb-chinhsualich") ||
      Array.from(document.querySelectorAll("table")).find((table) => {
        const text = normalizeSpace(table.textContent || "").toLowerCase();
        return (
          text.includes("mã lớp") &&
          text.includes("tên môn") &&
          text.includes("hình thức")
        );
      }) ||
      null
    );
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function changeSelectValue(select, value) {
    if (!select) return false;
    if (String(select.value) === String(value)) return true;

    select.value = String(value);
    select.dispatchEvent(new Event("change", { bubbles: true }));

    await wait(2200);
    return true;
  }

  function extractSelectedLabel(select) {
    if (!select) return "";
    const option = select.options[select.selectedIndex];
    return normalizeSpace(option?.textContent || option?.label || "");
  }

  function parseClassRows() {
    const table = getClassTable();
    if (!table) return [];

    const rows = Array.from(table.querySelectorAll("tbody tr")).filter((row) => {
      const cells = row.querySelectorAll("td");
      return cells.length >= 5;
    });

    const out = [];

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 5) continue;

      const classCode = normalizeSpace(cells[0]?.textContent || "");
      const courseCell = cells[1];
      const method = normalizeSpace(cells[2]?.textContent || "");
      const level = normalizeSpace(cells[3]?.textContent || "");
      const actionCell = cells[4];

      if (!classCode || !courseCell) continue;

      const strong = courseCell.querySelector("strong");
      const rawCourseText = normalizeSpace(courseCell.textContent || "");
      const courseName = normalizeSpace(strong?.textContent || rawCourseText.split("Giảng viên")[0] || "");

      const detailLink =
        Array.from(actionCell.querySelectorAll("a")).find((a) =>
          normalizeSpace(a.textContent || "").toLowerCase().includes("xem điểm"),
        ) || null;

      const detailUrl = detailLink
        ? new URL(detailLink.getAttribute("href"), location.href).toString()
        : null;

      out.push({
        classCode,
        courseName,
        method: method || null,
        level: level || null,
        detailUrl,
      });
    }

    return out;
  }

  async function fetchDetailDocument(url) {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Fetch detail failed with status ${res.status}`);
    }

    const html = await res.text();
    return new DOMParser().parseFromString(html, "text/html");
  }

  function extractCourseCodeFromClassCode(classCode) {
    const raw = normalizeSpace(classCode);
    if (!raw) return "";

    const first = raw.split(/\s+/)[0] || "";
    return first.replace(/[^A-Za-z0-9-]/g, "");
  }

  function parseDetailPage(doc, context) {
    const titleNode =
      doc.querySelector("span[id*='lblClassName']") ||
      doc.querySelector(".class-title") ||
      null;

    const titleText = normalizeSpace(titleNode?.textContent || "");
    const inferredCourseName =
      normalizeSpace(context.courseName) ||
      normalizeSpace(titleText.split("-").slice(1).join("-")) ||
      normalizeSpace(titleText);

    const table =
      doc.querySelector("table.tb-chinhsualich") ||
      Array.from(doc.querySelectorAll("table")).find((candidate) => {
        const text = normalizeSpace(candidate.textContent || "").toLowerCase();
        return (
          text.includes("tên bài giáo") &&
          text.includes("điểm lần 1") &&
          text.includes("% điểm")
        );
      }) ||
      null;

    if (!table) {
      return [];
    }

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const items = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 6) continue;

      const firstText = normalizeSpace(cells[0]?.textContent || "");
      const label = normalizeSpace(cells[1]?.textContent || "");

      if (!label) continue;

      const isTotal = label.toLowerCase().includes("tổng");
      if (isTotal) continue;

      items.push({
        semester: context.semester,
        academicYear: context.academicYear,
        term: context.term,

        classCode: context.classCode,
        courseCode: context.courseCode,
        courseName: inferredCourseName,

        method: context.method || null,
        level: context.level || null,
        detailUrl: context.detailUrl || null,

        componentKey: label.toLowerCase().replace(/\s+/g, "_"),
        componentLabel: label,

        score1: toNumber(cells[2]?.textContent || ""),
        score2: toNumber(cells[3]?.textContent || ""),
        scaleScore: toNumber(cells[4]?.textContent || ""),
        weightPercent: toNumber(
          normalizeSpace(cells[5]?.textContent || "").replace("%", ""),
        ),
        contributionMax: toNumber(
          normalizeSpace(cells[6]?.textContent || "").replace("%", ""),
        ),
        contributionScore:
          cells[2] && cells[4] && cells[5]
            ? (() => {
                const score1 = toNumber(cells[2]?.textContent || "");
                const scale = toNumber(cells[4]?.textContent || "");
                const weight = toNumber(
                  normalizeSpace(cells[5]?.textContent || "").replace("%", ""),
                );

                if (
                  typeof score1 === "number" &&
                  typeof scale === "number" &&
                  typeof weight === "number" &&
                  scale > 0
                ) {
                  return Number(((score1 / scale) * weight).toFixed(2));
                }

                return null;
              })()
            : null,

        displayOrder: i,
        rawText: normalizeSpace(row.textContent || ""),
      });
    }

    return items;
  }

  async function scrapeAllTranscriptDetails() {
    const yearSelect = getYearSelect();
    const termSelect = getTermSelect();

    if (!yearSelect || !termSelect) {
      return {
        ok: false,
        error: "Không tìm thấy bộ lọc năm học / học kỳ của bảng điểm chi tiết.",
      };
    }

    const yearOptions = Array.from(yearSelect.options)
      .map((opt) => ({
        value: String(opt.value || ""),
        label: normalizeSpace(opt.textContent || ""),
      }))
      .filter((opt) => opt.value);

    const allRows = [];
    const visitedKeys = new Set();
    const classKeys = new Set();
    const semesterKeys = new Set();

    for (const year of yearOptions) {
      await changeSelectValue(yearSelect, year.value);

      const currentTermSelect = getTermSelect();
      const termOptions = Array.from(currentTermSelect?.options || [])
        .map((opt) => ({
          value: String(opt.value || ""),
          label: normalizeSpace(opt.textContent || ""),
        }))
        .filter((opt) => opt.value && !opt.label.toLowerCase().includes("chọn"));

      for (const term of termOptions) {
        await changeSelectValue(currentTermSelect, term.value);

        const semester = `${year.label} - ${term.label}`;
        const classes = parseClassRows();

        for (const classItem of classes) {
          if (!classItem.detailUrl) continue;

          const courseCode = extractCourseCodeFromClassCode(classItem.classCode);
          const classKey = `${semester}||${classItem.classCode}||${courseCode}`;

          classKeys.add(classKey);
          semesterKeys.add(semester);

          try {
            const doc = await fetchDetailDocument(classItem.detailUrl);
            const detailRows = parseDetailPage(doc, {
              semester,
              academicYear: year.label,
              term: term.label,
              classCode: classItem.classCode,
              courseCode,
              courseName: classItem.courseName,
              method: classItem.method,
              level: classItem.level,
              detailUrl: classItem.detailUrl,
            });

            for (const row of detailRows) {
              const rowKey = [
                row.semester,
                row.classCode,
                row.courseCode,
                row.componentLabel,
                row.displayOrder,
              ].join("||");

              if (visitedKeys.has(rowKey)) continue;
              visitedKeys.add(rowKey);
              allRows.push(row);
            }
          } catch (error) {
            log("detail fetch failed", classItem.detailUrl, error);
          }
        }
      }
    }

    if (!allRows.length) {
      return {
        ok: false,
        error: "Không parse được dữ liệu bảng điểm chi tiết nào.",
      };
    }

    return {
      ok: true,
      data: {
        adapterKey: "mydtu_transcript_detail_v1",
        adapterVersion: "1.0.0",
        sourcePage: location.href,
        scrapedAt: new Date().toISOString(),
        items: allRows,
        meta: {
          totalItems: allRows.length,
          totalClasses: classKeys.size,
          totalSemesters: semesterKeys.size,
        },
      },
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "SCRAPE_TRANSCRIPT_DETAIL") return;

    scrapeAllTranscriptDetails()
      .then((result) => {
        log("detail parsed rows:", result?.data?.items?.length || 0);
        sendResponse(result);
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          error: String(error?.message || error),
        });
      });

    return true;
  });

  log("transcript_detail_page injected:", location.href);
})();