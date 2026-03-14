const MYDTU_TIMETABLE_URL =
  "https://mydtu.duytan.edu.vn/sites/index.aspx?p=home_timetable&functionid=13";

const PDOATAO_EXAM_LIST_URL =
  "https://pdaotao.duytan.edu.vn/EXAM_LIST/?page=1&lang=VN";

const EXAM_ADAPTER_KEY = "pdaotao_exam_v1";
const EXAM_ADAPTER_VERSION = "1.0.0";
const ADAPTER_KEY = "mydtu_timetable_v1";
const ADAPTER_VERSION = "1.4.0";

const DEFAULT_LOOK_AHEAD_WEEKS = 8;
const MAX_LOOK_AHEAD_WEEKS = 16;
const DEFAULT_LOOK_BACK_WEEKS = 0;

const SESSION_CHECK_TIMEOUT_MS = 15000;
const TAB_LOAD_TIMEOUT_MS = 30000;
const EXECUTE_TIMEOUT_MS = 180000;
const SCRAPE_RENDER_WAIT_MS = 2500;

function log(...args) {
  console.log("[MYDTU EXT]", ...args);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.min(max, Math.max(min, i));
}

function hasTimetableMarkers(html) {
  const text = String(html || "");
  return (
    text.includes("Lịch học") ||
    text.includes("L&#7883;ch h&#7885;c") ||
    text.includes("rsContentTable") ||
    text.includes("rsApt") ||
    text.includes("RadScheduler")
  );
}

async function withTimeout(promise, timeoutMs, label) {
  let timer = null;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkSession() {
  try {
    const res = await withTimeout(
      fetch(MYDTU_TIMETABLE_URL, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }),
      SESSION_CHECK_TIMEOUT_MS,
      "checkSession fetch",
    );

    const html = await withTimeout(res.text(), 8000, "checkSession read html");
    const ok = res.ok && hasTimetableMarkers(html);

    return {
      connected: ok,
      status: res.status,
    };
  } catch (e) {
    return {
      connected: false,
      status: 0,
      error: String(e?.message || e),
    };
  }
}

async function openOrFocusMydtuLogin() {
  const tabs = await chrome.tabs.query({
    url: ["https://mydtu.duytan.edu.vn/*"],
  });

  const exact = tabs.find((t) =>
    String(t.url || "").includes("p=home_timetable"),
  );

  if (exact?.id) {
    await chrome.tabs.update(exact.id, {
      active: true,
      url: MYDTU_TIMETABLE_URL,
    });

    if (exact.windowId) {
      await chrome.windows.update(exact.windowId, { focused: true });
    }

    return { tabId: exact.id, reused: true };
  }

  if (tabs[0]?.id) {
    await chrome.tabs.update(tabs[0].id, {
      active: true,
      url: MYDTU_TIMETABLE_URL,
    });

    if (tabs[0].windowId) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }

    return { tabId: tabs[0].id, reused: true };
  }

  const created = await chrome.tabs.create({
    url: MYDTU_TIMETABLE_URL,
    active: true,
  });

  return { tabId: created.id, reused: false };
}

async function ensureTimetableTab() {
  const tabs = await chrome.tabs.query({
    url: ["https://mydtu.duytan.edu.vn/*"],
  });

  const exact = tabs.find((t) =>
    String(t.url || "").includes("p=home_timetable"),
  );

  if (exact?.id) {
    if (exact.url !== MYDTU_TIMETABLE_URL) {
      await chrome.tabs.update(exact.id, {
        url: MYDTU_TIMETABLE_URL,
        active: false,
      });
    }
    return exact.id;
  }

  if (tabs[0]?.id) {
    await chrome.tabs.update(tabs[0].id, {
      url: MYDTU_TIMETABLE_URL,
      active: false,
    });
    return tabs[0].id;
  }

  const created = await chrome.tabs.create({
    url: MYDTU_TIMETABLE_URL,
    active: false,
  });

  if (!created.id) {
    throw new Error("Không tạo được tab MYDTU.");
  }

  return created.id;
}

async function openOrFocusExamPage() {
  const tabs = await chrome.tabs.query({
    url: ["https://pdaotao.duytan.edu.vn/*"],
  });

  const exact = tabs.find((t) =>
    String(t.url || "").includes("/EXAM_LIST/"),
  );

  if (exact?.id) {
    await chrome.tabs.update(exact.id, {
      active: true,
      url: PDOATAO_EXAM_LIST_URL,
    });

    if (exact.windowId) {
      await chrome.windows.update(exact.windowId, { focused: true });
    }

    return { tabId: exact.id, reused: true };
  }

  if (tabs[0]?.id) {
    await chrome.tabs.update(tabs[0].id, {
      active: true,
      url: PDOATAO_EXAM_LIST_URL,
    });

    if (tabs[0].windowId) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }

    return { tabId: tabs[0].id, reused: true };
  }

  const created = await chrome.tabs.create({
    url: PDOATAO_EXAM_LIST_URL,
    active: true,
  });

  return { tabId: created.id, reused: false };
}

async function ensureExamTab() {
  const tabs = await chrome.tabs.query({
    url: ["https://pdaotao.duytan.edu.vn/*"],
  });

  const exact = tabs.find((t) =>
    String(t.url || "").includes("/EXAM_LIST/"),
  );

  if (exact?.id) {
    if (exact.url !== PDOATAO_EXAM_LIST_URL) {
      await chrome.tabs.update(exact.id, {
        url: PDOATAO_EXAM_LIST_URL,
        active: false,
      });
    }
    return exact.id;
  }

  if (tabs[0]?.id) {
    await chrome.tabs.update(tabs[0].id, {
      url: PDOATAO_EXAM_LIST_URL,
      active: false,
    });
    return tabs[0].id;
  }

  const created = await chrome.tabs.create({
    url: PDOATAO_EXAM_LIST_URL,
    active: false,
  });

  if (!created.id) {
    throw new Error("Không tạo được tab danh sách thi.");
  }

  return created.id;
}

function waitForTabComplete(tabId, timeoutMs = TAB_LOAD_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const timer = setInterval(async () => {
      try {
        const tab = await chrome.tabs.get(tabId);

        if (tab.status === "complete") {
          clearInterval(timer);
          resolve(true);
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          clearInterval(timer);
          reject(new Error(`Tab load timeout after ${timeoutMs}ms`));
        }
      } catch (e) {
        clearInterval(timer);
        reject(e);
      }
    }, 400);
  });
}

async function executeInTab(tabId, func, args = [], label = "executeScript") {
  const results = await withTimeout(
    chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func,
      args,
    }),
    EXECUTE_TIMEOUT_MS,
    label,
  );

  return results?.[0]?.result;
}

async function reloadTabAndWait(tabId) {
  await chrome.tabs.reload(tabId);
  await waitForTabComplete(tabId, TAB_LOAD_TIMEOUT_MS);
  await sleep(1600);
}

async function sendMessageToTabWithRetry(tabId, message, retries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await withTimeout(
        chrome.tabs.sendMessage(tabId, message),
        EXECUTE_TIMEOUT_MS,
        `tabs.sendMessage attempt ${attempt}`,
      );

      return response;
    } catch (error) {
      lastError = error;
      const text = String(error?.message || error || "");

      const shouldRetry =
        text.includes("Receiving end does not exist") ||
        text.includes("Could not establish connection") ||
        text.includes("No tab with id");

      if (!shouldRetry || attempt >= retries) {
        throw error;
      }

      log("sendMessage retry", { attempt, text });
      await reloadTabAndWait(tabId);
    }
  }

  throw lastError || new Error("sendMessage failed");
}

function buildSwitchToWeekViewFunction() {
  return async () => {
    function norm(s) {
      return String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
    }

    function isWeekView() {
      const content = document.querySelector(".rsContent");
      if (content && content.classList.contains("rsWeekView")) return true;

      const selected = document.querySelector(".rsHeader ul li.rsSelected");
      const selectedText = norm(selected?.textContent || "");
      return selectedText.includes("tuần");
    }

    if (isWeekView()) {
      return { ok: true, alreadyWeek: true };
    }

    const weekBtn =
      document.querySelector(".rsHeaderWeek") ||
      Array.from(document.querySelectorAll("a, em, span")).find((el) =>
        norm(el.textContent || "").includes("tuần"),
      );

    if (!weekBtn) {
      return { ok: false, error: "Không tìm thấy nút chuyển sang chế độ tuần." };
    }

    try {
      if (typeof weekBtn.click === "function") {
        weekBtn.click();
      } else {
        weekBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }

    const started = Date.now();
    while (Date.now() - started < 8000) {
      if (isWeekView()) {
        return { ok: true };
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return { ok: false, error: "Không chuyển được sang chế độ tuần." };
  };
}

function buildNavigateWeekFunction() {
  return async (dir) => {
    function norm(s) {
      return String(s || "").replace(/\s+/g, " ").trim();
    }

    function getHeaderText() {
      const h2 = document.querySelector(".rsHeader h2");
      return norm(h2?.textContent || "");
    }

    function getAppointmentsSignature() {
      return Array.from(
        document.querySelectorAll(".rsContentTable .rsApt[title]"),
      )
        .slice(0, 20)
        .map((el) => norm(el.getAttribute("title") || ""))
        .join("||");
    }

    function getSignature() {
      const header = getHeaderText();
      const apt = getAppointmentsSignature();
      return `${header}__${apt}`;
    }

    function getLoadingPanel() {
      return document.querySelector("[id*='RadAjaxLoadingPanel']");
    }

    function isLoadingVisible() {
      const el = getLoadingPanel();
      if (!el) return false;

      const style = window.getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity || "1") !== 0
      );
    }

    async function waitLoadingDone(maxMs) {
      const started = Date.now();

      while (Date.now() - started < maxMs) {
        if (!isLoadingVisible()) return;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    async function waitUntilChanged(before, maxMs) {
      const started = Date.now();

      while (Date.now() - started < maxMs) {
        await waitLoadingDone(1500);
        await new Promise((resolve) => setTimeout(resolve, 350));

        const after = getSignature();
        if (after && after !== before) {
          return { ok: true, after };
        }
      }

      return { ok: false, after: getSignature() };
    }

    const before = getSignature();
    if (!before) {
      return { ok: false, error: "Không đọc được trạng thái lịch hiện tại." };
    }

    const selector = dir === "next" ? ".rsNextDay" : ".rsPrevDay";
    const btn = document.querySelector(selector);

    if (!btn) {
      return {
        ok: false,
        error: `Không tìm thấy nút ${dir === "next" ? "rsNextDay" : "rsPrevDay"}.`,
      };
    }

    try {
      if (typeof btn.click === "function") {
        btn.click();
      } else {
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }

    const waited = await waitUntilChanged(before, 12000);
    if (waited.ok) {
      return {
        ok: true,
        method: selector,
        before,
        after: waited.after,
      };
    }

    return {
      ok: false,
      error: `MYDTU không đổi sang ${dir === "next" ? "tuần sau" : "tuần trước"} kịp thời.`,
      debug: {
        selector,
        before,
        after: waited.after,
      },
    };
  };
}

function buildScrapeFunction() {
  return ({ adapterKey, adapterVersion }) => {
    function normalizeSpace(s) {
      return String(s || "").replace(/\s+/g, " ").trim();
    }

    function textOf(selector) {
      const el = document.querySelector(selector);
      return normalizeSpace(el?.textContent || "");
    }

    function getWeekLabel() {
      return (
        textOf("#tuanthu") ||
        textOf(".rsHeader h2") ||
        textOf(".functionname") ||
        textOf(".title") ||
        "MYDTU_TIMETABLE"
      );
    }

    function parseTitle(rawTitle) {
      const raw = normalizeSpace(rawTitle);
      const parts = raw.split("|").map((x) => normalizeSpace(x));

      const courseCode = parts[0] || "";
      const courseName = parts[1] || "";
      const location = parts[2] || "";
      const timeRange = parts[3] || "";

      const timeMatch = timeRange.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      const startTime = timeMatch?.[1] || "";
      const endTime = timeMatch?.[2] || "";

      let room = location;
      let campus = null;

      const commaIdx = location.indexOf(",");
      if (commaIdx >= 0) {
        room = normalizeSpace(location.slice(0, commaIdx));
        campus = normalizeSpace(location.slice(commaIdx + 1)) || null;
      }

      return {
        courseCode,
        courseName,
        room,
        campus,
        startTime,
        endTime,
      };
    }

    function getDayOfWeekFromAppointment(aptEl) {
      const td = aptEl.closest("td");
      if (!td || !td.parentElement) return null;

      const row = td.parentElement;
      const cells = Array.from(row.children).filter((el) => el.tagName === "TD");
      const idx = cells.indexOf(td);
      if (idx < 0 || idx > 6) return null;

      return idx + 1;
    }

    const aptEls = Array.from(
      document.querySelectorAll(
        ".rsContentTable .rsApt[title], .rsApt div[title], div[title*='|']",
      ),
    ).filter((el) => {
      const title = normalizeSpace(el.getAttribute("title") || "");
      return !!title && /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/.test(title);
    });

    const weekLabel = getWeekLabel();
    const semester = weekLabel || "MYDTU_TIMETABLE";
    const sourcePage = location.href;

    const items = [];
    const seen = new Set();

    for (const el of aptEls) {
      const title = normalizeSpace(el.getAttribute("title") || "");
      const parsed = parseTitle(title);
      const dayOfWeek = getDayOfWeekFromAppointment(el);

      if (!parsed.courseCode || !parsed.startTime || !parsed.endTime || !dayOfWeek) {
        continue;
      }

      const key = [
        semester,
        parsed.courseCode,
        parsed.courseName,
        dayOfWeek,
        parsed.startTime,
        parsed.endTime,
        parsed.room,
        parsed.campus || "",
      ].join("|");

      if (seen.has(key)) continue;
      seen.add(key);

      items.push({
        semester,
        courseCode: parsed.courseCode,
        courseName: parsed.courseName || null,
        dayOfWeek,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        room: parsed.room || "",
        campus: parsed.campus || null,
        weeksIncluded: weekLabel || null,
        weeksCanceled: null,
        rawTitle: title,
      });
    }

    return {
      ok: true,
      payload: {
        adapterKey,
        adapterVersion,
        semester,
        sourcePage,
        items,
      },
      meta: {
        weekLabel,
        empty: items.length === 0,
      },
    };
  };
}

async function switchToWeekView(tabId) {
  const result = await executeInTab(
    tabId,
    buildSwitchToWeekViewFunction(),
    [],
    "switchToWeekView",
  );

  if (!result?.ok) {
    throw new Error(result?.error || "Không chuyển được sang chế độ tuần.");
  }

  await sleep(1000);
}

async function navigateWeek(tabId, direction) {
  const result = await executeInTab(
    tabId,
    buildNavigateWeekFunction(),
    [direction],
    `navigateWeek:${direction}`,
  );

  if (!result?.ok) {
    throw new Error(result?.error || `Không điều hướng được ${direction}.`);
  }

  await sleep(1000);
}

async function scrapeCurrentWeek(tabId) {
  const result = await executeInTab(
    tabId,
    buildScrapeFunction(),
    [
      {
        adapterKey: ADAPTER_KEY,
        adapterVersion: ADAPTER_VERSION,
      },
    ],
    "scrapeCurrentWeek",
  );

  if (!result?.ok) {
    throw new Error(result?.error || "Scrape tuần hiện tại thất bại.");
  }

  return result;
}

function dedupeItems(items) {
  const seen = new Set();
  const out = [];

  for (const item of items) {
    const key = [
      item.semester || "",
      item.courseCode || "",
      item.courseName || "",
      item.dayOfWeek || "",
      item.startTime || "",
      item.endTime || "",
      item.room || "",
      item.campus || "",
      item.weeksIncluded || "",
    ].join("||");

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

async function syncTimetableFromTab(options = {}) {
  log("syncTimetableFromTab:start", options);

  const lookAheadWeeks = clampNumber(
    options?.lookAheadWeeks,
    0,
    MAX_LOOK_AHEAD_WEEKS,
    DEFAULT_LOOK_AHEAD_WEEKS,
  );
  const lookBackWeeks = clampNumber(
    options?.lookBackWeeks,
    0,
    8,
    DEFAULT_LOOK_BACK_WEEKS,
  );

  const session = await checkSession();
  if (!session.connected) {
    return {
      ok: false,
      error: "Bạn chưa đăng nhập MYDTU hoặc phiên đăng nhập đã hết hạn.",
    };
  }

  const tabId = await ensureTimetableTab();

  await waitForTabComplete(tabId, TAB_LOAD_TIMEOUT_MS);
  await sleep(SCRAPE_RENDER_WAIT_MS);
  await switchToWeekView(tabId);

  const allItems = [];
  const visitedWeekLabels = new Set();

  const currentWeek = await scrapeCurrentWeek(tabId);
  const currentWeekLabel =
    currentWeek?.meta?.weekLabel ||
    currentWeek?.payload?.semester ||
    "CURRENT";

  visitedWeekLabels.add(currentWeekLabel);

  if (Array.isArray(currentWeek?.payload?.items)) {
    allItems.push(...currentWeek.payload.items);
  }

  for (let i = 0; i < lookAheadWeeks; i++) {
    await navigateWeek(tabId, "next");

    const week = await scrapeCurrentWeek(tabId);
    const weekLabel =
      week?.meta?.weekLabel ||
      week?.payload?.semester ||
      `NEXT_${i + 1}`;

    if (visitedWeekLabels.has(weekLabel)) {
      log("duplicate week detected, stop forward sync at", weekLabel);
      break;
    }

    visitedWeekLabels.add(weekLabel);

    if (Array.isArray(week?.payload?.items)) {
      allItems.push(...week.payload.items);
    }
  }

  for (let i = 0; i < lookAheadWeeks; i++) {
    try {
      await navigateWeek(tabId, "prev");
    } catch {
      break;
    }
  }

  for (let i = 0; i < lookBackWeeks; i++) {
    await navigateWeek(tabId, "prev");

    const week = await scrapeCurrentWeek(tabId);
    const weekLabel =
      week?.meta?.weekLabel ||
      week?.payload?.semester ||
      `PREV_${i + 1}`;

    if (visitedWeekLabels.has(weekLabel)) {
      log("duplicate week detected, stop backward sync at", weekLabel);
      break;
    }

    visitedWeekLabels.add(weekLabel);

    if (Array.isArray(week?.payload?.items)) {
      allItems.push(...week.payload.items);
    }
  }

  for (let i = 0; i < lookBackWeeks; i++) {
    try {
      await navigateWeek(tabId, "next");
    } catch {
      break;
    }
  }

  const items = dedupeItems(allItems);

  if (!items.length) {
    return {
      ok: false,
      error: "Đã kết nối MYDTU nhưng không scrape được môn học nào từ các tuần đã quét.",
    };
  }

  return {
    ok: true,
    data: {
      adapterKey: ADAPTER_KEY,
      adapterVersion: ADAPTER_VERSION,
      semester: items[0]?.semester || "MYDTU_TIMETABLE",
      sourcePage: MYDTU_TIMETABLE_URL,
      items,
      meta: {
        weeksSynced: Array.from(visitedWeekLabels),
        totalWeeks: visitedWeekLabels.size,
        totalItems: items.length,
      },
    },
  };
}

async function syncExamsFromPdaotao(options = {}) {
  log("syncExamsFromPdaotao:start", options);

  const tabId = await ensureExamTab();

  await waitForTabComplete(tabId, TAB_LOAD_TIMEOUT_MS);
  await sleep(1600);

  const response = await sendMessageToTabWithRetry(
    tabId,
    {
      type: "SCRAPE_EXAMS",
      payload: {
        maxPages: clampNumber(options?.maxPages, 1, 10, 2),
        maxItems: clampNumber(options?.maxItems, 1, 60, 24),
      },
    },
    3,
  );

  if (!response?.ok) {
    return {
      ok: false,
      error: response?.error || "Không scrape được danh sách thi từ pdaotao.",
    };
  }

  return {
    ok: true,
    data: {
      adapterKey: EXAM_ADAPTER_KEY,
      adapterVersion: EXAM_ADAPTER_VERSION,
      sourcePage: PDOATAO_EXAM_LIST_URL,
      ...response.data,
    },
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  let responded = false;

  const reply = (payload) => {
    if (responded) return;
    responded = true;
    sendResponse(payload);
  };

  (async () => {
    try {
      if (!msg || msg.type !== "WEB_TO_EXTENSION") {
        reply({ ok: false, error: "Unknown message" });
        return;
      }

      log("message", {
        action: msg.action,
        requestId: msg.requestId,
        senderTabId: sender?.tab?.id ?? null,
      });

      if (msg.action === "MYDTU_OPEN_LOGIN") {
        const r = await openOrFocusMydtuLogin();
        reply({ ok: true, data: r });
        return;
      }

      if (msg.action === "MYDTU_CHECK_SESSION") {
        const r = await checkSession();
        reply({ ok: true, data: r });
        return;
      }

      if (msg.action === "MYDTU_SYNC_TIMETABLE") {
        const r = await syncTimetableFromTab(msg.payload || {});
        reply(r);
        return;
      }

      if (msg.action === "MYDTU_OPEN_EXAM_PAGE") {
        const r = await openOrFocusExamPage();
        reply({ ok: true, data: r });
        return;
      }

      if (msg.action === "MYDTU_SYNC_EXAMS") {
        const r = await syncExamsFromPdaotao(msg.payload || {});
        reply(r);
        return;
      }

      reply({ ok: false, error: `Unknown action: ${msg.action}` });
    } catch (e) {
      log("message:error", e);
      reply({ ok: false, error: String(e?.message || e) });
    }
  })();

  return true;
});