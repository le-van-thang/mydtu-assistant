(() => {
  function log(...args) {
    console.log("[MYDTU TRANSCRIPT DETAIL]", ...args);
  }

  const DETAIL_FETCH_CONCURRENCY = 2;

  function normalizeSpace(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeLower(value) {
    return normalizeSpace(value).toLowerCase();
  }

  function toNumber(value) {
    const raw = normalizeSpace(value).replace(/\./g, "").replace(",", ".");
    if (!raw || raw === "-" || raw === "--") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getYearSelect() {
    return (
      document.querySelector("select[id*='cboNamHoc']") ||
      document.querySelector("select[name*='cboNamHoc']") ||
      document.querySelector("select[id*='NamHoc']") ||
      document.querySelector("select[name*='NamHoc']") ||
      null
    );
  }

  function getTermSelect() {
    return (
      document.querySelector("select[id*='cboHocKy']") ||
      document.querySelector("select[name*='cboHocKy']") ||
      document.querySelector("select[id*='HocKy']") ||
      document.querySelector("select[name*='HocKy']") ||
      null
    );
  }

  function getAllTables(root = document) {
    return Array.from(root.querySelectorAll("table"));
  }

  function getClassTable(root = document) {
    const direct =
      root.querySelector("table.tb-chinhsualich") ||
      root.querySelector("table[id*='grd']") ||
      root.querySelector("table[id*='Grid']");

    if (direct) return direct;

    return (
      getAllTables(root).find((table) => {
        const text = normalizeLower(table.textContent || "");
        return (
          text.includes("mã lớp") &&
          text.includes("tên môn") &&
          (text.includes("hình thức") || text.includes("xem điểm"))
        );
      }) || null
    );
  }

  function getClassTableSignature(root = document) {
    const table = getClassTable(root);
    if (!table) return "";
    return normalizeSpace(table.textContent || "").slice(0, 3000);
  }

  function pageShowsNoClass() {
    const table = getClassTable(document);
    const text = normalizeLower(
      table?.textContent || document.body?.innerText || "",
    );
    return (
      text.includes("không có lớp nào") || text.includes("khong co lop nao")
    );
  }

  async function waitForTableChange(previousSignature, timeoutMs = 10000) {
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
      const currentSignature = getClassTableSignature(document);
      if (
        (currentSignature && currentSignature !== previousSignature) ||
        pageShowsNoClass()
      ) {
        await wait(200);
        return true;
      }
      await wait(250);
    }

    return false;
  }

  async function waitForSelectOptionsStable(getter, timeoutMs = 6000) {
    const started = Date.now();
    let lastCount = -1;
    let stableRounds = 0;

    while (Date.now() - started < timeoutMs) {
      const select = getter();
      const count = select?.options?.length || 0;

      if (count > 0 && count === lastCount) stableRounds += 1;
      else stableRounds = 0;

      if (count > 0 && stableRounds >= 2) {
        return true;
      }

      lastCount = count;
      await wait(250);
    }

    return false;
  }

  async function changeSelectValue(select, value, opts = {}) {
    if (!select) return false;

    const {
      waitForTermRefresh = false,
      waitForTableRefresh = false,
      timeoutMs = 10000,
    } = opts;

    const previousTableSignature = getClassTableSignature(document);
    const previousValue = String(select.value || "");

    if (previousValue === String(value)) {
      if (waitForTermRefresh) {
        await waitForSelectOptionsStable(getTermSelect, 3000);
      }
      return true;
    }

    select.value = String(value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    select.dispatchEvent(new Event("input", { bubbles: true }));

    if (waitForTermRefresh) {
      await waitForSelectOptionsStable(getTermSelect, timeoutMs);
      await wait(300);
    }

    if (waitForTableRefresh) {
      await waitForTableChange(previousTableSignature, timeoutMs);
      await wait(250);
    } else {
      await wait(600);
    }

    return true;
  }

  function buildAbsoluteUrl(rawHref) {
    if (!rawHref) return null;
    try {
      return new URL(rawHref, location.href).toString();
    } catch {
      return null;
    }
  }

  function extractCourseNameFromCell(courseCell) {
    const strong = courseCell.querySelector("strong");
    if (strong) return normalizeSpace(strong.textContent || "");

    const lines = normalizeSpace(courseCell.textContent || "")
      .split(/\s{2,}|\n+/)
      .map((x) => normalizeSpace(x))
      .filter(Boolean);

    return lines[0] || "";
  }

  function getBestDetailLink(actionCell) {
    const links = Array.from(actionCell?.querySelectorAll("a") || []);

    const personalLink =
      links.find((a) => {
        const text = normalizeLower(a.textContent || "");
        return (
          text.includes("xem điểm cá nhân") || text.includes("xem diem ca nhan")
        );
      }) || null;

    if (personalLink) return personalLink;

    return (
      links.find((a) => {
        const text = normalizeLower(a.textContent || "");
        const href = normalizeLower(a.getAttribute("href") || "");

        const looksLikeHomework =
          text.includes("bài tập") ||
          text.includes("bai tap") ||
          href.includes("baitap");

        if (looksLikeHomework) return false;

        return (
          text.includes("chi tiết") ||
          text.includes("chi tiet") ||
          text.includes("xem điểm") ||
          text.includes("xem diem") ||
          href.includes("gradingresult") ||
          href.includes("xemdiem") ||
          href.includes("ketqua")
        );
      }) || null
    );
  }

  function parseClassRows() {
    const table = getClassTable(document);
    if (!table) return [];

    const tableText = normalizeLower(table.textContent || "");
    if (
      tableText.includes("không có lớp nào") ||
      tableText.includes("khong co lop nao")
    ) {
      return [];
    }

    const bodyRows = Array.from(table.querySelectorAll("tr")).filter((row) => {
      const cells = row.querySelectorAll("td");
      return cells.length >= 4;
    });

    const out = [];
    const seen = new Set();

    for (const row of bodyRows) {
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 4) continue;

      const classCode = normalizeSpace(cells[0]?.textContent || "");
      const courseCell = cells[1] || null;
      const method = normalizeSpace(cells[2]?.textContent || "") || null;
      const level = normalizeSpace(cells[3]?.textContent || "") || null;
      const actionCell = cells[cells.length - 1] || null;

      if (!classCode || !courseCell) continue;

      const courseName = extractCourseNameFromCell(courseCell);
      const detailLink = getBestDetailLink(actionCell);
      const detailUrl = buildAbsoluteUrl(detailLink?.getAttribute("href"));

      const key = [
        classCode,
        courseName,
        method || "",
        level || "",
        detailUrl || "",
      ].join("||");

      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        classCode,
        courseName: courseName || null,
        method,
        level,
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

  function findDetailTable(doc) {
    return (
      doc.querySelector("table.tb-chinhsualich") ||
      getAllTables(doc).find((table) => {
        const text = normalizeLower(table.textContent || "");
        return (
          (text.includes("điểm lần 1") || text.includes("diem lan 1")) &&
          (text.includes("% điểm") || text.includes("% diem")) &&
          (text.includes("thang điểm") ||
            text.includes("thang diem") ||
            text.includes("tên bài giáo") ||
            text.includes("ten bai giao"))
        );
      }) ||
      null
    );
  }

  function parseDetailPage(doc, context) {
    const bodyText = normalizeLower(doc.body?.innerText || "");

    if (
      bodyText.includes(
        "bạn không thể xem điểm vì bạn chưa đánh giá giảng viên",
      ) ||
      bodyText.includes(
        "ban khong the xem diem vi ban chua danh gia giang vien",
      )
    ) {
      return [];
    }

    const titleNode =
      doc.querySelector("span[id*='lblClassName']") ||
      doc.querySelector(".class-title") ||
      doc.querySelector("h1") ||
      doc.querySelector("h2") ||
      null;

    const titleText = normalizeSpace(titleNode?.textContent || "");
    const inferredCourseName =
      normalizeSpace(context.courseName) ||
      normalizeSpace(titleText.split("-").slice(1).join("-")) ||
      normalizeSpace(titleText);

    const table = findDetailTable(doc);
    if (!table) return [];

    const rows = Array.from(table.querySelectorAll("tr"));
    const items = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 5) continue;

      const label =
        normalizeSpace(cells[1]?.textContent || "") ||
        normalizeSpace(cells[0]?.textContent || "");

      if (!label) continue;

      const lowerLabel = normalizeLower(label);
      if (lowerLabel.includes("tổng")) continue;
      if (lowerLabel.includes("total")) continue;
      if (lowerLabel.includes("thành phần") && lowerLabel.includes("điểm"))
        continue;

      const score1 = toNumber(cells[2]?.textContent || "");
      const score2 = toNumber(cells[3]?.textContent || "");
      const scaleScore = toNumber(cells[4]?.textContent || "");
      const weightPercent =
        cells.length >= 6
          ? toNumber(
              normalizeSpace(cells[5]?.textContent || "").replace("%", ""),
            )
          : null;

      const contributionMax =
        cells.length >= 7
          ? toNumber(
              normalizeSpace(cells[6]?.textContent || "").replace("%", ""),
            )
          : null;

      const primaryScore = typeof score1 === "number" ? score1 : score2;
      let contributionScore = null;

      if (
        typeof primaryScore === "number" &&
        typeof scaleScore === "number" &&
        typeof weightPercent === "number" &&
        scaleScore > 0
      ) {
        contributionScore = Number(
          ((primaryScore / scaleScore) * weightPercent).toFixed(2),
        );
      }

      items.push({
        semester: context.semester,
        academicYear: context.academicYear,
        term: context.term,
        classCode: context.classCode,
        courseCode: context.courseCode,
        courseName:
          inferredCourseName || context.courseName || context.classCode,
        method: context.method || null,
        level: context.level || null,
        detailUrl: context.detailUrl || null,
        componentKey: normalizeLower(label).replace(/\s+/g, "_"),
        componentLabel: label,
        score1,
        score2,
        scaleScore,
        weightPercent,
        contributionMax,
        contributionScore,
        displayOrder: i,
        rawText: normalizeSpace(row.textContent || ""),
      });
    }

    return items;
  }

  async function mapWithConcurrency(items, limit, worker) {
    const out = [];
    let index = 0;

    async function runner() {
      while (index < items.length) {
        const currentIndex = index++;
        const item = items[currentIndex];

        try {
          const result = await worker(item, currentIndex);
          if (Array.isArray(result)) out.push(...result);
          else if (result) out.push(result);
        } catch (error) {
          log("worker failed:", item, error);
        }
      }
    }

    const workers = Array.from({ length: Math.max(1, limit) }, () => runner());
    await Promise.all(workers);
    return out;
  }

  function parseAcademicYearStart(label) {
    const m = normalizeSpace(label).match(/(\d{4})\s*-\s*(\d{4})/);
    return m ? Number(m[1]) : -1;
  }

  function termOrder(label) {
    const v = normalizeLower(label);

    if (
      v.includes("học kỳ i") ||
      v.includes("hoc ky i") ||
      v.includes("học kỳ 1") ||
      v.includes("hoc ky 1")
    ) {
      return 1;
    }

    if (
      v.includes("học kỳ ii") ||
      v.includes("hoc ky ii") ||
      v.includes("học kỳ 2") ||
      v.includes("hoc ky 2")
    ) {
      return 2;
    }

    if (v.includes("hè") || v.includes("he")) {
      return 3;
    }

    return 99;
  }

  async function buildSemesterIndex() {
    const yearSelect = getYearSelect();
    if (!yearSelect) return new Map();

    const yearOptions = Array.from(yearSelect.options)
      .map((opt) => ({
        value: String(opt.value || ""),
        label: normalizeSpace(opt.textContent || ""),
      }))
      .filter(
        (opt) =>
          opt.value &&
          opt.label &&
          !normalizeLower(opt.label).includes("chọn") &&
          !normalizeLower(opt.label).includes("chon"),
      )
      .sort(
        (a, b) =>
          parseAcademicYearStart(b.label) - parseAcademicYearStart(a.label),
      );

    const semesterMap = new Map();

    for (const year of yearOptions) {
      await changeSelectValue(getYearSelect(), year.value, {
        waitForTermRefresh: true,
        timeoutMs: 10000,
      });

      const termOptions = Array.from(getTermSelect()?.options || [])
        .map((opt) => ({
          value: String(opt.value || ""),
          label: normalizeSpace(opt.textContent || ""),
        }))
        .filter(
          (opt) =>
            opt.value &&
            opt.label &&
            !normalizeLower(opt.label).includes("chọn") &&
            !normalizeLower(opt.label).includes("chon"),
        )
        .sort((a, b) => termOrder(a.label) - termOrder(b.label));

      for (const term of termOptions) {
        const semester = normalizeSpace(`${year.label} - ${term.label}`);
        semesterMap.set(normalizeLower(semester), {
          yearValue: year.value,
          yearLabel: year.label,
          termValue: term.value,
          termLabel: term.label,
          semester,
        });
      }
    }

    return semesterMap;
  }

  async function scrapeSemesterDetails({
    semester,
    academicYear,
    term,
    classes,
  }) {
    const validClasses = classes.filter((x) => x.detailUrl);
    if (!validClasses.length) return [];

    return mapWithConcurrency(
      validClasses,
      DETAIL_FETCH_CONCURRENCY,
      async (classItem) => {
        const courseCode = extractCourseCodeFromClassCode(classItem.classCode);

        try {
          const doc = await fetchDetailDocument(classItem.detailUrl);
          return parseDetailPage(doc, {
            semester,
            academicYear,
            term,
            classCode: classItem.classCode,
            courseCode,
            courseName: classItem.courseName,
            method: classItem.method,
            level: classItem.level,
            detailUrl: classItem.detailUrl,
          });
        } catch (error) {
          log("detail fetch failed", classItem.detailUrl, error);
          return [];
        }
      },
    );
  }

  async function scrapeAllTranscriptDetails(payload) {
    const yearSelect = getYearSelect();
    const termSelect = getTermSelect();

    if (!yearSelect || !termSelect) {
      return {
        ok: false,
        error: "Không tìm thấy bộ lọc năm học / học kỳ của bảng điểm chi tiết.",
      };
    }

    const targetSemesters = Array.isArray(payload?.targetSemesters)
      ? payload.targetSemesters.map((x) => normalizeSpace(x)).filter(Boolean)
      : [];

    if (targetSemesters.length !== 1) {
      return {
        ok: false,
        error: "Batch sync mode yêu cầu đúng 1 học kỳ cho mỗi lần quét.",
      };
    }

    const semesterIndex = await buildSemesterIndex();
    const targetSemester = targetSemesters[0];
    const selection = semesterIndex.get(normalizeLower(targetSemester));

    if (!selection) {
      return {
        ok: true,
        data: {
          adapterKey: "mydtu_transcript_detail_v1",
          adapterVersion: "3.0.0",
          sourcePage: location.href,
          scrapedAt: new Date().toISOString(),
          items: [],
          meta: {
            totalItems: 0,
            totalClasses: 0,
            totalSemesters: 0,
            requestedSemesters: [targetSemester],
            scannedSemesters: [],
            skippedSemesters: [targetSemester],
          },
        },
      };
    }

    await changeSelectValue(getYearSelect(), selection.yearValue, {
      waitForTermRefresh: true,
      timeoutMs: 10000,
    });

    await changeSelectValue(getTermSelect(), selection.termValue, {
      waitForTableRefresh: true,
      timeoutMs: 10000,
    });

    if (pageShowsNoClass()) {
      return {
        ok: true,
        data: {
          adapterKey: "mydtu_transcript_detail_v1",
          adapterVersion: "3.0.0",
          sourcePage: location.href,
          scrapedAt: new Date().toISOString(),
          items: [],
          meta: {
            totalItems: 0,
            totalClasses: 0,
            totalSemesters: 0,
            requestedSemesters: [targetSemester],
            scannedSemesters: [],
            skippedSemesters: [targetSemester],
          },
        },
      };
    }

    const classes = parseClassRows();
    if (!classes.length) {
      return {
        ok: true,
        data: {
          adapterKey: "mydtu_transcript_detail_v1",
          adapterVersion: "3.0.0",
          sourcePage: location.href,
          scrapedAt: new Date().toISOString(),
          items: [],
          meta: {
            totalItems: 0,
            totalClasses: 0,
            totalSemesters: 0,
            requestedSemesters: [targetSemester],
            scannedSemesters: [],
            skippedSemesters: [targetSemester],
          },
        },
      };
    }

    const classKeys = new Set();
    for (const classItem of classes) {
      const courseCode = extractCourseCodeFromClassCode(classItem.classCode);
      classKeys.add(
        `${selection.semester}||${classItem.classCode}||${courseCode}`,
      );
    }

    const semesterRows = await scrapeSemesterDetails({
      semester: selection.semester,
      academicYear: selection.yearLabel,
      term: selection.termLabel,
      classes,
    });

    return {
      ok: true,
      data: {
        adapterKey: "mydtu_transcript_detail_v1",
        adapterVersion: "3.0.0",
        sourcePage: location.href,
        scrapedAt: new Date().toISOString(),
        items: semesterRows,
        meta: {
          totalItems: semesterRows.length,
          totalClasses: classKeys.size,
          totalSemesters: semesterRows.length ? 1 : 0,
          requestedSemesters: [targetSemester],
          scannedSemesters: semesterRows.length ? [selection.semester] : [],
          skippedSemesters: semesterRows.length ? [] : [targetSemester],
        },
      },
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "SCRAPE_TRANSCRIPT_DETAIL") return;

    scrapeAllTranscriptDetails(message.payload || null)
      .then((result) => {
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
