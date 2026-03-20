// path: apps/extension/transcript_page.js
(() => {
  function log(...args) {
    console.log("[MYDTU TRANSCRIPT]", ...args);
  }

  function normalizeSpace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeLoose(value) {
    return normalizeSpace(value).toLowerCase();
  }

  function getCellText(cell) {
    if (!cell) return "";
    return normalizeSpace(cell.textContent || "");
  }

  function toNumber(value) {
    const raw = normalizeSpace(value).replace(",", ".");
    if (!raw || raw === "--" || raw === "-") return null;

    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function extractStudentInfo() {
    const text = normalizeSpace(document.body?.innerText || "");

    const match = text.match(
      /Sinh viên:\s*([^(]+)\(Mã Sinh viên:\s*([^)]+)\)/i,
    );

    if (match) {
      return {
        fullName: normalizeSpace(match[1]),
        studentId: normalizeSpace(match[2]),
      };
    }

    return {
      fullName: null,
      studentId: null,
    };
  }

  function parseStatus(score10, letter) {
    if (typeof score10 === "number") {
      return score10 < 4 ? "failed" : "passed";
    }

    const L = normalizeSpace(letter).toUpperCase();
    if (!L) return "unknown";
    if (L === "F") return "failed";
    if (L === "P" || L === "P/F" || L === "I" || L === "X" || L === "R") {
      return "unknown";
    }

    if (
      ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D"].includes(L)
    ) {
      return "passed";
    }

    return "unknown";
  }

  function hasRealGrade(item) {
    return (
      typeof item.score10 === "number" ||
      !!normalizeSpace(item.letter) ||
      typeof item.gpa4 === "number"
    );
  }

  function looksLikeSemesterRow(text) {
    const t = normalizeLoose(text);
    return t.includes("học kỳ") || t.includes("hoc ky");
  }

  function isSummaryRowText(text) {
    const t = normalizeLoose(text);

    return (
      t.includes("tổng số") ||
      t.includes("tổng kết") ||
      t.includes("trung bình") ||
      t.includes("điểm tích lũy") ||
      t.includes("điểm gốc") ||
      t.includes("điểm chữ:") ||
      t.includes("đvht") ||
      t.includes("toàn khóa học")
    );
  }

  function looksLikeHeaderTable(table) {
    const text = normalizeLoose(table.textContent || "");
    return (
      text.includes("mã môn") &&
      text.includes("mã lớp") &&
      text.includes("tên môn") &&
      text.includes("điểm chữ")
    );
  }

  function findTranscriptTables() {
    return Array.from(document.querySelectorAll("table")).filter(looksLikeHeaderTable);
  }

  function buildItemFromRow(tds, semester) {
    if (!tds || tds.length < 9) return null;

    const courseCode = getCellText(tds[0]);
    const classCode = getCellText(tds[1]);
    const method = getCellText(tds[2]);
    const courseName = getCellText(tds[3]);
    const creditsText = getCellText(tds[4]);
    const unitType = getCellText(tds[5]);
    const score10Text = getCellText(tds[6]);
    const letterText = getCellText(tds[7]);
    const gpa4Text = getCellText(tds[8]);
    const cumulativeText = tds[9] ? getCellText(tds[9]) : "";

    if (!courseCode || !courseName) return null;
    if (!semester) return null;

    const credits = Number.parseInt(creditsText, 10);
    const score10 = toNumber(score10Text);
    const letter = normalizeSpace(letterText) || null;
    const gpa4 = toNumber(gpa4Text);
    const cumulative = toNumber(cumulativeText);

    return {
      semester,
      courseCode,
      classCode: classCode || "",
      courseName,
      credits: Number.isFinite(credits) ? credits : 0,
      score10,
      letter,
      gpa4,
      status: parseStatus(score10, letter),
      componentsBreakdown: {
        classCode: classCode || "",
        method: method || null,
        unitType: unitType || null,
        cumulative,
      },
    };
  }

  function scrapeRowsFromTable(table, output) {
    const rows = Array.from(table.querySelectorAll("tr"));
    let currentSemester = null;

    for (const row of rows) {
      const text = normalizeSpace(row.textContent || "");
      if (!text) continue;

      if (looksLikeSemesterRow(text)) {
        currentSemester = text;
        continue;
      }

      if (isSummaryRowText(text)) continue;

      const tds = Array.from(row.querySelectorAll("td"));
      if (tds.length < 9) continue;

      const item = buildItemFromRow(tds, currentSemester);
      if (!item) continue;

      output.push(item);
    }
  }

  function compareItemsForBest(a, b) {
    const aHasGrade = hasRealGrade(a);
    const bHasGrade = hasRealGrade(b);

    if (aHasGrade !== bHasGrade) {
      return aHasGrade ? 1 : -1;
    }

    if ((a.credits || 0) !== (b.credits || 0)) {
      return (a.credits || 0) > (b.credits || 0) ? 1 : -1;
    }

    const aScoreCount =
      (typeof a.score10 === "number" ? 1 : 0) +
      (a.letter ? 1 : 0) +
      (typeof a.gpa4 === "number" ? 1 : 0);

    const bScoreCount =
      (typeof b.score10 === "number" ? 1 : 0) +
      (b.letter ? 1 : 0) +
      (typeof b.gpa4 === "number" ? 1 : 0);

    if (aScoreCount !== bScoreCount) {
      return aScoreCount > bScoreCount ? 1 : -1;
    }

    return 0;
  }

  function mergeItems(existing, incoming) {
    const better =
      compareItemsForBest(incoming, existing) > 0 ? incoming : existing;
    const weaker = better === incoming ? existing : incoming;

    return {
      ...better,
      credits: Math.max(Number(existing.credits || 0), Number(incoming.credits || 0)),
      score10:
        better.score10 ?? weaker.score10 ?? null,
      letter:
        better.letter ?? weaker.letter ?? null,
      gpa4:
        better.gpa4 ?? weaker.gpa4 ?? null,
      status:
        better.status && better.status !== "unknown"
          ? better.status
          : weaker.status || "unknown",
      componentsBreakdown: {
        ...(weaker.componentsBreakdown || {}),
        ...(better.componentsBreakdown || {}),
      },
    };
  }

  function dedupeItems(items) {
    const map = new Map();

    for (const item of items) {
      const key = [
        normalizeLoose(item.semester),
        normalizeLoose(item.courseCode),
        normalizeLoose(item.classCode),
      ].join("||");

      const current = map.get(key);
      if (!current) {
        map.set(key, item);
        continue;
      }

      map.set(key, mergeItems(current, item));
    }

    return Array.from(map.values());
  }

  function scrapeOverallTranscript() {
    const transcriptTables = findTranscriptTables();

    if (!transcriptTables.length) {
      return {
        ok: false,
        error: "Không tìm thấy bảng điểm",
      };
    }

    const items = [];
    for (const table of transcriptTables) {
      scrapeRowsFromTable(table, items);
    }

    const deduped = dedupeItems(items);

    if (!deduped.length) {
      return {
        ok: false,
        error: "Có tìm thấy bảng điểm nhưng không parse được môn học nào.",
      };
    }

    const student = extractStudentInfo();
    const semesterCount = new Set(deduped.map((item) => item.semester)).size;

    return {
      ok: true,
      data: {
        adapterKey: "mydtu_transcript_v1",
        adapterVersion: "4.0.0",
        sourcePage: location.href,
        scrapedAt: new Date().toISOString(),
        student,
        items: deduped,
        meta: {
          totalSemesters: semesterCount,
          totalItems: deduped.length,
          includesDetailedTranscript: false,
        },
      },
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "SCRAPE_TRANSCRIPT") return;

    try {
      const result = scrapeOverallTranscript();
      log("parsed rows:", result?.data?.items?.length || 0);
      sendResponse(result);
    } catch (error) {
      sendResponse({
        ok: false,
        error: String(error?.message || error),
      });
    }

    return true;
  });

  log("transcript_page injected:", location.href);
})();