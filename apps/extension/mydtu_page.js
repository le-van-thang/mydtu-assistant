function parseTitleParts(rawTitle) {
  const parts = String(rawTitle || "")
    .split("|")
    .map((s) => s.trim());

  const courseCode = parts[0] || "";
  const courseName = parts[1] || "";
  const locationRaw = parts[2] || "";
  const timeRaw = parts[3] || "";

  let room = "";
  let campus = "";

  if (locationRaw) {
    const locationParts = locationRaw.split(",").map((s) => s.trim());
    room = locationParts[0] || "";
    campus = locationParts.slice(1).join(", ") || "";
  }

  let startTime = "";
  let endTime = "";
  const timeMatch = timeRaw.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
  if (timeMatch) {
    startTime = timeMatch[1];
    endTime = timeMatch[2];
  }

  return {
    courseCode,
    courseName,
    room,
    campus,
    startTime,
    endTime
  };
}

function getWeekLabel() {
  const el =
    document.querySelector("#tuanthu") ||
    document.querySelector(".functionname #tuanthu") ||
    document.querySelector(".rsHeader h2");

  return el?.textContent?.trim() || "";
}

function scrapeTimetable() {
  const scheduler = document.querySelector(".RadScheduler");
  if (!scheduler) {
    return {
      ok: false,
      error: "Không tìm thấy RadScheduler trên trang MYDTU."
    };
  }

  const weekLabel = getWeekLabel();

  const items = [];
  const seen = new Set();

  const appointments = Array.from(document.querySelectorAll(".rsContentTable .rsApt"));

  for (const apt of appointments) {
    const title = apt.getAttribute("title") || apt.textContent || "";
    const parsed = parseTitleParts(title);

    const td = apt.closest("td");
    const tr = td?.parentElement;

    if (!td || !tr) continue;

    const cells = Array.from(tr.children);
    const colIndex = cells.indexOf(td);

    if (colIndex < 0 || colIndex > 6) continue;

    const dayOfWeek = colIndex + 1; // 1..7 => T2..CN

    const id = [
      parsed.courseCode,
      parsed.courseName,
      dayOfWeek,
      parsed.startTime,
      parsed.endTime,
      parsed.room,
      weekLabel
    ].join("__");

    if (seen.has(id)) continue;
    seen.add(id);

    items.push({
      id,
      semester: weekLabel || "MYDTU",
      courseCode: parsed.courseCode,
      courseName: parsed.courseName || null,
      dayOfWeek,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      room: parsed.room,
      campus: parsed.campus || null,
      weeksIncluded: weekLabel || null
    });
  }

  return {
    ok: true,
    data: {
      items,
      meta: {
        weekLabel,
        sourceUrl: location.href,
        extractedAt: new Date().toISOString()
      }
    }
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "SCRAPE_TIMETABLE") return;

  try {
    const result = scrapeTimetable();
    sendResponse(result);
  } catch (e) {
    sendResponse({
      ok: false,
      error: String(e?.message || e)
    });
  }

  return true;
});