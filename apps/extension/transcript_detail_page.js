(() => {
  function log(...args) {
    console.log("[MYDTU TRANSCRIPT DETAIL]", ...args);
  }

  // ═══════════════════════════════════════════════════════════════
  // PERFORMANCE TUNING — Điều chỉnh tốc độ đồng bộ
  // ═══════════════════════════════════════════════════════════════
  const DETAIL_FETCH_CONCURRENCY = 4;   // Giảm xuống 4 để tránh quá tải MYDTU
  const FETCH_TIMEOUT_MS = 15000;        // 15s — server MYDTU đôi khi chậm
  const FETCH_RETRY = 1;                 // Thử lại 1 lần nếu timeout
  const POLL_INTERVAL_MS = 120;          // Polling nhanh hơn (120ms thay vì 250ms)
  const TABLE_SETTLE_MS = 150;           // Chờ table ổn định sau khi detect thay đổi
  const POST_YEAR_CHANGE_MS = 300;       // Chờ sau khi đổi năm (tăng để ổn định)
  const POST_TERM_CHANGE_MS = 150;       // Chờ sau khi đổi học kỳ
  const SAME_VALUE_SKIP_MS = 50;         // Micro-wait khi select đã đúng giá trị
  const EMPTY_SEMESTER_DELAY_MS = 100;   // Delay tối thiểu khi gặp HK rỗng
  const AUTO_STOP_THRESHOLD = 6;         // Dừng sau 6 HK rỗng liên tiếp (tăng để không bỏ sót HK Hè)
  const YEAR_CHANGE_TIMEOUT_MS = 8000;   // Timeout chờ đổi năm
  const TERM_CHANGE_TIMEOUT_MS = 8000;   // Timeout chờ đổi học kỳ

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

  // ═══════════════════════════════════════════════════════════════
  // OPTIMIZED WAIT FUNCTIONS — Polling nhanh, timeout ngắn
  // ═══════════════════════════════════════════════════════════════

  async function waitForTableChange(previousSignature, timeoutMs = TERM_CHANGE_TIMEOUT_MS) {
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
      const currentSignature = getClassTableSignature(document);
      if (currentSignature && currentSignature !== previousSignature) {
        await wait(TABLE_SETTLE_MS);
        return true;
      }
      await wait(POLL_INTERVAL_MS);
    }

    return false;
  }

  async function waitForSelectOptionsStable(getter, timeoutMs = 3000) {
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
      await wait(POLL_INTERVAL_MS);
    }

    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  // OPTIMIZED SELECT CHANGE — Bỏ qua nếu giá trị đã đúng
  // ═══════════════════════════════════════════════════════════════

  async function changeSelectValue(select, value, opts = {}) {
    if (!select) return false;

    const {
      waitForTermRefresh = false,
      waitForTableRefresh = false,
      timeoutMs = TERM_CHANGE_TIMEOUT_MS,
    } = opts;

    const previousTableSignature = getClassTableSignature(document);
    const previousValue = String(select.value || "");

    // ★ TỐI ƯU QUAN TRỌNG: Nếu giá trị đã đúng → bỏ qua hoàn toàn
    if (previousValue === String(value)) {
      await wait(SAME_VALUE_SKIP_MS);
      return true;
    }

    select.value = String(value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    select.dispatchEvent(new Event("input", { bubbles: true }));

    if (waitForTermRefresh) {
      await waitForSelectOptionsStable(getTermSelect, timeoutMs);
      await wait(POST_YEAR_CHANGE_MS);
    }

    if (waitForTableRefresh) {
      await waitForTableChange(previousTableSignature, timeoutMs);
      await wait(POST_TERM_CHANGE_MS);
    } else if (!waitForTermRefresh) {
      await wait(200);
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
      if (!classCode) continue;

      if (seen.has(classCode)) continue;
      seen.add(classCode);

      const courseName = extractCourseNameFromCell(cells[1]);
      const method = normalizeSpace(cells[2]?.textContent || "");
      const level = normalizeSpace(cells[3]?.textContent || "");

      const bestLink = getBestDetailLink(cells[cells.length - 1]);
      const detailUrl = bestLink
        ? buildAbsoluteUrl(bestLink.getAttribute("href") || "")
        : null;

      out.push({
        classCode,
        courseName,
        method,
        level,
        detailUrl,
      });
    }

    return out;
  }

  // ═══════════════════════════════════════════════════════════════
  // OPTIMIZED FETCH — Timeout ngắn, abort nhanh
  // ═══════════════════════════════════════════════════════════════

  async function fetchDetailDocument(url, retriesLeft = FETCH_RETRY) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Fetch detail failed with status ${res.status}`);
      }

      const html = await res.text();
      return new DOMParser().parseFromString(html, "text/html");
    } catch (e) {
      clearTimeout(timeoutId);
      // Retry on abort (timeout) or network error
      if (retriesLeft > 0) {
        log(`Retrying detail fetch (${retriesLeft} left):`, url);
        await wait(1500);
        return fetchDetailDocument(url, retriesLeft - 1);
      }
      throw e;
    }
  }

  function extractCourseCodeFromClassCode(classCode) {
    const raw = normalizeSpace(classCode);
    if (!raw) return "";
    const first = raw.split(/\s+/)[0] || "";
    return first.replace(/[^A-Za-z0-9-]/g, "");
  }

  function findDetailTable(doc) {
    const direct =
      doc.querySelector("table.tb-chinhsualich") ||
      doc.querySelector("table[id*='grd']") ||
      doc.querySelector("table[id*='Grid']");

    if (direct) return direct;

    return (
      getAllTables(doc).find((table) => {
        const text = normalizeLower(table.textContent || "");
        return (
          (text.includes("thành phần") || text.includes("thanh phan")) &&
          (text.includes("lần 1") ||
            text.includes("lan 1") ||
            text.includes("thang điểm") ||
            text.includes("thang diem"))
        );
      }) || null
    );
  }

  function parseDetailPage(doc, context) {
    if (!doc) {
      log("parseDetailPage: null doc for", context.classCode);
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

  // ═══════════════════════════════════════════════════════════════
  // OPTIMIZED SEMESTER INDEX — Không postback, xây dựng tức thì
  // ═══════════════════════════════════════════════════════════════

  // ★ buildSemesterIndex là ĐỒNG BỘ (sync) — nhanh, không postback
  // Học Kỳ Hè luôn được thêm vào danh sách với giá trị placeholder.
  // Trong vòng lặp chính, dynamic lookup sẽ xác nhận năm nào thực sự có Hè;
  // nếu không có → skip ngay lập tức, không cần chờ timeout.
  function buildSemesterIndex(maxYears) {
    const yearSelect = getYearSelect();
    if (!yearSelect) return new Map();

    const allYearOptions = Array.from(yearSelect.options)
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

    const yearOptions =
      maxYears > 0 ? allYearOptions.slice(0, maxYears) : allYearOptions;

    // Đọc term options từ dropdown hiện tại
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
      // Sắp xếp tăng dần: Kỳ I (1) → Kỳ II (2) → Hè (3)
      .sort((a, b) => termOrder(a.label) - termOrder(b.label));

    if (termOptions.length === 0) {
      termOptions.push(
        { value: "48", label: "Học Kỳ I" },
        { value: "49", label: "Học Kỳ II" },
      );
    }

    // ★ Luôn thêm Học Kỳ Hè vào danh sách nếu chưa có.
    // Dynamic lookup trong scrape loop sẽ xác minh và bỏ qua nếu năm đó không có Hè.
    const hasHe = termOptions.some((opt) => termOrder(opt.label) === 3);
    if (!hasHe) {
      termOptions.push({ value: "__he_placeholder__", label: "Học Kỳ Hè" });
    }

    const semesterMap = new Map();

    for (const year of yearOptions) {
      for (const term of termOptions) {
        const semester = normalizeSpace(`${year.label} - ${term.label}`);
        const key = normalizeLower(semester);
        if (!semesterMap.has(key)) {
          semesterMap.set(key, {
            yearValue: year.value,
            yearLabel: year.label,
            termValue: term.value,
            termLabel: term.label,
            semester,
          });
        }
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
    if (!validClasses.length) {
      return {
        rows: [],
        classesWithDetailLink: 0,
        detailFailures: 0,
      };
    }

    let detailFailures = 0;

    const rows = await mapWithConcurrency(
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
          detailFailures += 1;
          return [];
        }
      },
    );

    return {
      rows,
      classesWithDetailLink: validClasses.length,
      detailFailures,
    };
  }

  function buildTranscriptDetailPayload({
    requestedSemesters,
    scannedSemesters,
    skippedSemesters,
    semesterSummaries,
    items,
    totalClasses,
    totalDetailFailures,
  }) {
    return {
      adapterKey: "mydtu_transcript_detail_v1",
      adapterVersion: "4.0.0",
      sourcePage: location.href,
      scrapedAt: new Date().toISOString(),
      items,
      meta: {
        totalItems: items.length,
        totalClasses,
        totalSemesters: scannedSemesters.length,
        requestedSemesters,
        scannedSemesters,
        skippedSemesters,
        totalDetailFailures,
        semesterSummaries,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN SCRAPE LOOP — Tối ưu tốc độ tuyệt đối
  // ═══════════════════════════════════════════════════════════════

  async function scrapeAllTranscriptDetails(payload) {
    const yearSelect = getYearSelect();
    const termSelect = getTermSelect();

    if (!yearSelect || !termSelect) {
      return {
        ok: false,
        error: "Khong tim thay bo loc nam hoc / hoc ky cua bang diem chi tiet.",
      };
    }

    const targetSemesters = Array.isArray(payload?.targetSemesters)
      ? payload.targetSemesters.map((x) => normalizeSpace(x)).filter(Boolean)
      : [];

    const maxYears = Number(payload?.maxYears) || 0;
    const jobId = payload?.jobId || null;

    // Gửi progress về SW — async, throw nếu extension invalidated
    async function sendSwProgress(progress, message) {
      if (!jobId) return;
      try {
        await chrome.runtime.sendMessage({
          type: "TRANSCRIPT_DETAIL_PROGRESS",
          jobId,
          progress,
          message,
        });
      } catch (e) {
        const errStr = String(e?.message || e || "");
        if (errStr.includes("Extension context invalidated")) {
          throw new Error(
            "Extension đã bị reload. Vui lòng làm mới trang MYDTU (F5) và thử lại.",
          );
        }
      }
    }

    // buildSemesterIndex là SYNC — nhanh, không postback nào hết
    const semesterIndex = buildSemesterIndex(maxYears);
    const requestedSemesters = (
      targetSemesters.length
        ? targetSemesters
        : Array.from(semesterIndex.values()).map((item) => item.semester)
    ).filter(Boolean);

    const allItems = [];
    const scannedSemesters = [];
    const skippedSemesters = [];
    const semesterSummaries = [];
    const classKeys = new Set();
    let totalDetailFailures = 0;
    
    let consecutiveEmptySemesters = 0;
    let hasFoundData = false;

    // ★ Track năm hiện tại để tránh postback thừa
    let currentYearValue = String(yearSelect.value || "");

    const totalSem = requestedSemesters.length;
    const startTime = Date.now();

    for (let sIdx = 0; sIdx < totalSem; sIdx++) {
      const requestedSemester = requestedSemesters[sIdx];

      // Progress %
      const pct =
        30 + Math.round((sIdx / Math.max(totalSem, 1)) * 60);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      await sendSwProgress(
        pct,
        `Đang quét học kỳ ${sIdx + 1}/${totalSem}: ${requestedSemester} (${elapsed}s)`,
      );

      const selection = semesterIndex.get(normalizeLower(requestedSemester));

      if (!selection) {
        skippedSemesters.push(requestedSemester);
        semesterSummaries.push({
          semester: requestedSemester,
          status: "missing",
          totalItems: 0,
          totalClasses: 0,
          classesWithDetailLink: 0,
          detailFailures: 0,
          message: "Khong tim thay hoc ky tren trang MYDTU.",
        });
        continue;
      }

      // ★ CHỈ đổi năm khi thực sự cần — tiết kiệm 1-3s mỗi lần
      if (currentYearValue !== selection.yearValue) {
        await changeSelectValue(getYearSelect(), selection.yearValue, {
          waitForTermRefresh: true,
          timeoutMs: YEAR_CHANGE_TIMEOUT_MS,
        });
        currentYearValue = selection.yearValue;
      }

      // ★ ĐẶC BIỆT QUAN TRỌNG: MYDTU thay đổi VALUE của Học Kỳ theo từng năm học (VD: HK1 năm nay là 82, nhưng năm ngoái là 79).
      // Do đó KHÔNG THỂ dùng `selection.termValue` cố định đã parse từ ban đầu.
      // Phải tra cứu lại (Dynamic Lookup) VALUE thực tế dựa trên Tên Học Kỳ (termLabel).
      const currentTermOptions = Array.from(getTermSelect()?.options || []);
      const matchedTerm = currentTermOptions.find((opt) =>
        normalizeLower(opt.textContent || "").includes(normalizeLower(selection.termLabel))
      );

      // ★ Nếu học kỳ này là Học Kỳ Hè (placeholder) nhưng năm hiện tại không có Hè → skip ngay, không chờ timeout
      if (!matchedTerm && selection.termValue === "__he_placeholder__") {
        skippedSemesters.push(selection.semester);
        semesterSummaries.push({
          semester: selection.semester,
          status: "skipped",
          totalItems: 0,
          totalClasses: 0,
          classesWithDetailLink: 0,
          detailFailures: 0,
          message: "Nam hoc nay khong co Hoc Ky He.",
        });
        continue;
      }

      const actualTermValue = matchedTerm ? String(matchedTerm.value || "") : selection.termValue;

      // Luôn phải đổi học kỳ để load bảng lớp
      await changeSelectValue(getTermSelect(), actualTermValue, {
        waitForTableRefresh: true,
        timeoutMs: TERM_CHANGE_TIMEOUT_MS,
      });

      if (pageShowsNoClass()) {
        skippedSemesters.push(selection.semester);
        semesterSummaries.push({
          semester: selection.semester,
          status: "empty",
          totalItems: 0,
          totalClasses: 0,
          classesWithDetailLink: 0,
          detailFailures: 0,
          message: "Hoc ky nay khong co lop hoc phan de quet.",
        });

        if (hasFoundData) {
          consecutiveEmptySemesters++;
          if (consecutiveEmptySemesters >= AUTO_STOP_THRESHOLD) {
            await sendSwProgress(
              pct + 5,
              `Đã gặp ${AUTO_STOP_THRESHOLD} học kỳ rỗng liên tiếp — dừng quét sớm.`,
            );
            break;
          }
        }

        await wait(EMPTY_SEMESTER_DELAY_MS);
        continue;
      }

      // Có dữ liệu → bật cờ, reset bộ đếm
      hasFoundData = true;
      consecutiveEmptySemesters = 0;

      const classes = parseClassRows();
      if (!classes.length) {
        skippedSemesters.push(selection.semester);
        semesterSummaries.push({
          semester: selection.semester,
          status: "empty",
          totalItems: 0,
          totalClasses: 0,
          classesWithDetailLink: 0,
          detailFailures: 0,
          message: "Khong parse duoc danh sach lop hoc phan.",
        });
        continue;
      }

      const uniqueClassKeys = new Set();
      for (const classItem of classes) {
        const courseCode = extractCourseCodeFromClassCode(classItem.classCode);
        const classKey = `${selection.semester}||${classItem.classCode}||${courseCode}`;
        uniqueClassKeys.add(classKey);
        classKeys.add(classKey);
      }

      const detailResult = await scrapeSemesterDetails({
        semester: selection.semester,
        academicYear: selection.yearLabel,
        term: selection.termLabel,
        classes,
      });

      totalDetailFailures += detailResult.detailFailures;
      allItems.push(...detailResult.rows);
      scannedSemesters.push(selection.semester);

      const status =
        detailResult.rows.length > 0
          ? detailResult.detailFailures > 0
            ? "partial"
            : "success"
          : "empty";

      if (status === "empty") {
        skippedSemesters.push(selection.semester);
      }

      semesterSummaries.push({
        semester: selection.semester,
        status,
        totalItems: detailResult.rows.length,
        totalClasses: uniqueClassKeys.size,
        classesWithDetailLink: detailResult.classesWithDetailLink,
        detailFailures: detailResult.detailFailures,
        message:
          status === "success"
            ? "Dong bo thanh cong."
            : status === "partial"
              ? "Mot so lop khong lay duoc trang chi tiet."
              : "Khong lay duoc dong diem chi tiet nao tu hoc ky nay.",
      });
    }

    return {
      ok: true,
      data: buildTranscriptDetailPayload({
        requestedSemesters,
        scannedSemesters,
        skippedSemesters,
        semesterSummaries,
        items: allItems,
        totalClasses: classKeys.size,
        totalDetailFailures,
      }),
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
