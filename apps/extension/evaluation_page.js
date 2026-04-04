// path: apps/extension/evaluation_page.js
// RateFlow v2 — Content script cho trang Đánh giá Giảng viên MYDTU
// Covers: home_ratingchoicesemester (danh sách GV) & home_ratingform (form đánh giá)

(() => {
  function log(...args) { console.log("[RATEFLOW]", ...args); }
  function err(...args) { console.error("[RATEFLOW]", ...args); }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const normSpace = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
  const normLow = (v) => normSpace(v).toLowerCase();

  // ─── Page detection ──────────────────────────────────────────────
  const isListPage = () =>
    location.search.includes("ratingchoicesemester") ||
    location.search.includes("functionid=15");
  const isFormPage = () =>
    location.search.includes("home_ratingform") ||
    location.search.includes("ratingform");

  // ─── Auto Recover Dropdowns ───────────────────────────────────────
  function autoRecoverSelection() {
    const isList = location.search.includes("ratingchoicesemester") || location.search.includes("functionid=15");
    if (!isList) return;

    const cboNam = document.querySelector("select[id*='cboNam']");
    const cboHocKy = document.querySelector("select[id*='cboHocKy']");
    if (!cboNam || !cboHocKy) return;

    // Save if user has selected valid options
    if (cboNam.value !== "0" && cboHocKy.value !== "0") {
      sessionStorage.setItem("rateflow_auto_nam", cboNam.value);
      sessionStorage.setItem("rateflow_auto_hocky", cboHocKy.value);
      return;
    }

    // Recover if dropdowns are reset (e.g. after a hard redirect)
    const savedNam = sessionStorage.getItem("rateflow_auto_nam");
    const savedHocky = sessionStorage.getItem("rateflow_auto_hocky");

    if (savedNam && savedHocky && (cboNam.value === "0" || cboHocKy.value === "0")) {
      cboNam.value = savedNam;
      cboHocKy.value = savedHocky;
      log("Auto-recovered dropdown state! Triggering POSTBACK...");
      // Trigger the page to fetch the grid
      setTimeout(() => {
         const script = document.createElement("script");
         script.textContent = `if(typeof __doPostBack === 'function') __doPostBack('${cboHocKy.name}', '');`;
         document.body.appendChild(script);
      }, 200);
    }
  }

  // Chạy ngay khi file được inject load!
  autoRecoverSelection();

  // ─── Scrape teacher rows strictly from the CURRENT view ─────────
  function scrapeTeachers() {
    const isLogin = location.href.toLowerCase().includes("login.aspx") || 
                    location.href.toLowerCase().includes("default.aspx") || 
                    document.querySelector("input[type='password']");
    
    if (isLogin) {
      return { _isError: true, error: "Bạn chưa đăng nhập hoặc phiên MYDTU đã hết hạn. Hệ thống thường tự thoát sau 10p hoặc đóng cửa lúc 23h. Vui lòng trở lại MYDTU để đăng nhập lại nhé." };
    }

    const results = [];

    // User is on a Single Teacher Form Page - scrape just this teacher
    if (isFormPage()) {
      let name = "Giảng viên";
      let courseName = "";
      
      // Try to extract name from "GIẢNG VIÊN: TRẦN VĂN A"
      const allTextNodes = Array.from(document.querySelectorAll("td, span, div, b"));
      for (const node of allTextNodes) {
        const text = normSpace(node.textContent || "");
        const match = text.match(/giảng viên:\s*([A-ZÀ-Ỹa-zà-ỹ\s]+)/i);
        if (match && match[1]) {
          name = match[1].trim();
          break;
        }
      }

      // Try to extract course name
      for (const node of allTextNodes) {
        const text = normSpace(node.textContent || "");
        const match = text.match(/môn:\s*([A-ZÀ-Ỹa-zà-ỹ\s()]+)/i);
        if (match && match[1]) {
          courseName = match[1].trim();
          break;
        }
      }

      results.push({
        index: 0,
        name: name,
        courseName: courseName,
        classCode: "",
        isDone: false,
        formUrl: location.href,
        instructorId: new URLSearchParams(location.search).get("intructorid") || new URLSearchParams(location.search).get("instructorid") || "",
        classId: new URLSearchParams(location.search).get("classid") || "",
      });

      return results;
    }

    // Phase 2: User is on the typical List Page
    // Strategy 1: Standard ASP.NET GridView with ID pattern
    const gridView =
      document.querySelector("#ctl00_ContentPlaceHolder1_gvRating") ||
      document.querySelector("table[id*='gvRating']") ||
      document.querySelector("table[id*='Rating']") ||
      document.querySelector("table[id*='Teacher']") ||
      document.querySelector("table[id*='tb-danhgia']") ||
      document.querySelector("table[id*='GiangVien']");

    const tableToScan = gridView
      ? gridView.querySelector("tbody") || gridView
      : null;

    // Strategy 2: Find table by header content
    let fallbackTable = null;
    if (!tableToScan) {
      const allTables = document.querySelectorAll("table");
      for (const t of allTables) {
        const headers = normLow(t.querySelector("thead,tr")?.textContent || "");
        if (
          headers.includes("giảng viên") ||
          headers.includes("giang vien") ||
          headers.includes("teacher") ||
          headers.includes("môn học")
        ) {
          fallbackTable = t;
          break;
        }
      }
    }

    if (!tableToScan && !fallbackTable) {
      log("No valid rating table found. Returning empty to avoid scraping layout tables.");
      return [];
    }

    const rows = Array.from(
      (tableToScan || fallbackTable)
        .querySelectorAll("tr")
    ).filter((r) => r.querySelectorAll("td").length >= 2);

    log(`Found ${rows.length} candidate rows`);

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 2) continue;

      // Detect teacher name (usually col 1 or 2)
      let name = "";
      let courseName = "";
      let classCode = "";

      // Heuristic: look for the cell that has a long Vietnamese name
      for (let ci = 0; ci < Math.min(cells.length, 4); ci++) {
        const txt = normSpace(cells[ci]?.textContent || "");
        if (txt.length > 3 && /[a-zA-ZÀ-ỹ]/.test(txt) && ci === 1) {
          name = txt;
        } else if (txt.length > 3 && /[a-zA-ZÀ-ỹ]/.test(txt) && ci === 2) {
          courseName = txt;
        } else if (txt.length > 2 && ci === 3) {
          classCode = txt;
        }
      }

      // Fallback name detection
      if (!name && cells[0]) name = normSpace(cells[0].textContent);
      if (!name || name.length < 2) continue;

      // Check status
      const lastCell = cells[cells.length - 1];
      const statusText = normLow(lastCell?.textContent || "");
      const isDone =
        statusText.includes("đã đánh giá") ||
        statusText.includes("hoàn thành") ||
        statusText.includes("completed") ||
        statusText.includes("done");

      // Find rating link
      const rateLink =
        row.querySelector("a[href*='ratingform']") ||
        row.querySelector("a[href*='home_rating']") ||
        row.querySelector("a[onclick*='rating']") ||
        row.querySelector("a");

      let formUrl = "";
      if (rateLink) {
        const href = rateLink.getAttribute("href") || "";
        const onclick = rateLink.getAttribute("onclick") || "";
        if (href.includes("ratingform") || href.includes("home_rating")) {
          // Robustly resolve link relative to the current MYDTU page URL
          try { formUrl = new URL(href, location.href).href; } catch(e) { }
        } else if (onclick) {
          // Extract URL from onclick="location.href='...'"
          const m = onclick.match(/['"]([^'"]*ratingform[^'"]*)['"]/);
          if (m) {
             try { formUrl = new URL(m[1], location.href).href; } catch(e) { }
          }
        }
      }

      // Also check for submit buttons
      if (!formUrl) {
        const submitInput = row.querySelector("input[type='button'], input[type='submit']");
        if (submitInput) {
          const onclick = submitInput.getAttribute("onclick") || "";
          const m = onclick.match(/['"]([^'"]*ratingform[^'"]*)['"]/);
          if (m) {
             try { formUrl = new URL(m[1], location.href).href; } catch(e) { }
          }
        }
      }

      const instructorMatch = formUrl.match(/instructorid=([^&]+)/i);
      const classIdMatch = formUrl.match(/classid=([^&]+)/i);

      results.push({
        index: idx,
        name,
        courseName,
        classCode,
        isDone: isDone || !formUrl,
        formUrl,
        instructorId: instructorMatch?.[1] || "",
        classId: classIdMatch?.[1] || "",
      });
    }

    // Strategy 3: Direct link hunt (last resort)
    if (results.length === 0) {
      log("No teacher rows from table scan, trying link hunt...");
      const links = document.querySelectorAll("a[href*='ratingform'], a[href*='home_ratingform']");
      links.forEach((link, idx) => {
        const row = link.closest("tr");
        const cells = row ? Array.from(row.querySelectorAll("td")) : [];
        const name = normSpace(cells[1]?.textContent || cells[0]?.textContent || `GV ${idx+1}`);
        const courseName = normSpace(cells[2]?.textContent || "");
        const href = link.getAttribute("href") || "";
        const fullUrl = href.startsWith("/") ? `${location.origin}${href}` : href;
        const instructorMatch = fullUrl.match(/instructorid=([^&]+)/i);
        const classIdMatch = fullUrl.match(/classid=([^&]+)/i);
        results.push({
          index: idx,
          name,
          courseName,
          classCode: normSpace(cells[3]?.textContent || ""),
          isDone: false,
          formUrl: fullUrl,
          instructorId: instructorMatch?.[1] || "",
          classId: classIdMatch?.[1] || "",
        });
      });
    }

    const unique = results.filter((t, i, arr) =>
      t.name.length > 1 && arr.findIndex((x) => x.formUrl === t.formUrl && x.name === t.name) === i
    );

    log(`Scraped ${unique.length} unique teachers`);
    return unique;
  }

  // ─── Fill rating form ────────────────────────────────────────────
  function fillForm({ policy = "random_4_5", texts = {} }) {
    const defaults = {
      q49: "Thầy/cô giảng dạy nhiệt tình, kiến thức chuyên môn vững vàng và luôn hỗ trợ sinh viên tốt.",
      q50: "Học liệu đầy đủ, tài liệu tham khảo rõ ràng, dễ tiếp cận.",
      q51: "Cơ sở vật chất phòng học đáp ứng tốt nhu cầu học tập.",
      q52: "Môn học có nội dung thực tiễn và bổ ích, cần được duy trì và phát triển thêm.",
    };
    const finalTexts = { ...defaults, ...texts };

    function getScore() {
      switch (policy) {
        case "all_5": return 5;
        case "all_4": return 4;
        case "all_3": return 3;
        case "random_4_5": return Math.random() < 0.65 ? 5 : 4;
        case "random_3_5": { const r = Math.random(); return r < 0.5 ? 5 : r < 0.8 ? 4 : 3; }
        default: return 5;
      }
    }

    // Radio buttons
    const radioGroups = new Map();
    document.querySelectorAll("input[type='radio']").forEach((r) => {
      const name = r.getAttribute("name") || "";
      if (!radioGroups.has(name)) radioGroups.set(name, []);
      radioGroups.get(name).push(r);
    });

    let filled = 0;
    for (const [name, radios] of radioGroups) {
      if (normLow(name).includes("captcha")) continue;
      const score = getScore();
      let best = null, bestDiff = Infinity;
      for (let idx = 0; idx < radios.length; idx++) {
        const r = radios[idx];
        const text = String(r.parentElement?.textContent || "").toLowerCase();
        let val = null;
        if (text.includes("tốt") || text.includes("rất hài lòng") || text.includes("rất hiệu quả")) val = 5;
        else if (text.includes("khá") || text.includes("hài lòng") || text.includes("hiệu quả")) val = 4;
        else if (text.includes("trung bình khá")) val = 3.5;
        else if (text.includes("trung bình") || text.includes("đạt")) val = 3;
        else if (text.includes("yếu") || text.includes("kém") || text.includes("không")) val = 1;

        if (val === null) {
          // fallback visual index
          if (idx === 0) val = 5;
          else if (idx === 1) val = 4;
          else if (idx === radios.length - 1 || idx === radios.length - 2) val = 1;
          else val = 3;
        }

        const d = Math.abs(val - score);
        if (d < bestDiff) { bestDiff = d; best = r; }
      }
      if (!best) best = radios[0]; // fallback to best
      if (best && !best.checked) {
        best.checked = true;
        best.dispatchEvent(new Event("change", { bubbles: true }));
        filled++;
      }
    }

    // Textareas
    const textareas = document.querySelectorAll("textarea");
    const keys = ["q49", "q50", "q51", "q52"];
    textareas.forEach((ta, i) => {
      if (i >= keys.length) return;
      ta.value = finalTexts[keys[i]] || defaults[keys[i]];
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      ta.dispatchEvent(new Event("change", { bubbles: true }));
    });

    log(`Filled ${filled} radio groups, ${textareas.length} textareas`);
    return { filledRadioGroups: filled, filledTextareas: textareas.length };
  }

  // ─── CAPTCHA ────────────────────────────────────────────────────
  function captureCaptcha() {
    const img =
      document.querySelector("img[src*='CaptchaImage']") ||
      document.querySelector("img[src*='captcha' i]") ||
      document.querySelector("img[id*='Captcha' i]") ||
      document.querySelector(".captcha img, #captchaImage");

    if (!img) return { ok: false, error: "Không tìm thấy CAPTCHA", base64: null };

    try {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || img.width || 200;
      c.height = img.naturalHeight || img.height || 60;
      c.getContext("2d").drawImage(img, 0, 0);
      return { ok: true, base64: c.toDataURL("image/png"), src: img.src, width: c.width, height: c.height };
    } catch (e) {
      return { ok: true, base64: null, src: img.src, error: String(e?.message || e) };
    }
  }

  async function reloadCaptcha() {
    const btn =
      document.querySelector("[id*='RefreshCaptcha'],[class*='captcha-refresh'],a[onclick*='captcha' i]");
    if (btn) { btn.click(); await wait(800); }
    else {
      const img = document.querySelector("img[src*='CaptchaImage'],img[src*='captcha' i]");
      if (img) {
        const u = new URL(img.src, location.href);
        u.searchParams.set("_t", Date.now());
        img.src = u.toString();
        await wait(600);
      }
    }
    return captureCaptcha();
  }

  // ─── Submit form ─────────────────────────────────────────────────
  async function submitForm(captchaText) {
    const captchaInput =
      document.querySelector("input[id*='captcha' i],input[name*='captcha' i]") ||
      document.querySelector("input[type='text'][maxlength='5'],input[type='text'][maxlength='6']");

    if (!captchaInput) return { ok: false, error: "Không tìm thấy ô nhập CAPTCHA" };

    captchaInput.value = captchaText;
    captchaInput.setAttribute("value", captchaText);
    captchaInput.dispatchEvent(new Event("focus", { bubbles: true }));
    captchaInput.dispatchEvent(new Event("input", { bubbles: true }));
    captchaInput.dispatchEvent(new Event("change", { bubbles: true }));
    captchaInput.dispatchEvent(new Event("blur", { bubbles: true }));
    await wait(200);

    const submitBtn =
      document.querySelector("[id*='btnsend' i]") ||
      document.querySelector("[id*='btnLuu' i]") ||
      document.querySelector("[id*='btnSave' i]") ||
      document.querySelector("[id*='btnSubmit' i]") ||
      document.querySelector("[id*='btnDanhGia' i]") ||
      document.querySelector("[id*='btnKetThuc' i]") ||
      Array.from(document.querySelectorAll("input, button, a, div")).find((el) => {
        if (el.style && el.style.display === "none") return false;
        
        const alt = (el.getAttribute("alt") || "").toLowerCase().trim();
        const title = (el.getAttribute("title") || "").toLowerCase().trim();
        const txt = (el.value || el.innerText || el.textContent || "").toLowerCase().trim();
        const cls = (typeof el.className === "string" ? el.className : "").toLowerCase();
        const onClickAttr = (el.getAttribute("onclick") || "").toLowerCase();
        
        const fullTxt = alt + " " + title + " " + txt + " " + cls;
        
        const isAction =
          el.tagName === "INPUT" ||
          el.tagName === "BUTTON" ||
          el.hasAttribute("onclick") ||
          String(el.getAttribute("href")).includes("javascript:") ||
          cls.includes("btn") || cls.includes("button");
          
        if (!isAction) return false;
        
        return fullTxt.includes("gửi đánh giá") || 
               fullTxt.includes("hoàn thành") || 
               fullTxt.includes("lưu lại") || 
               fullTxt.includes("guidanhgia") ||
               onClickAttr.includes("clicksend") ||
               fullTxt === "gửi" || fullTxt === "nộp" || fullTxt === "lưu";
      });

    if (!submitBtn) return { ok: false, error: "Không tìm thấy nút Lưu/Nộp trên trang web." };

    const urlBefore = location.href;
    submitBtn.click();
    await wait(2500);

    const body = document.body?.innerText?.toLowerCase() || "";
    if (body.includes("mã xác nhận không đúng") || body.includes("sai mã") || body.includes("captcha")) {
      return { ok: false, captchaError: true, error: "CAPTCHA sai. Vui lòng nhập lại." };
    }

    const isSuccess =
      location.href !== urlBefore ||
      body.includes("thành công") ||
      body.includes("cảm ơn") ||
      body.includes("đã nộp");

    return { ok: isSuccess, redirectedTo: location.href };
  }

  // ─── Message listener ────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg?.type?.startsWith("RATEFLOW_")) return false;

    (async () => {
      try {
        switch (msg.type) {

          case "RATEFLOW_SCAN_TEACHERS": {
            const result = scrapeTeachers();
            if (result && result._isError) {
              sendResponse({ ok: false, error: result.error });
            } else {
              sendResponse({ ok: true, teachers: result });
            }
            break;
          }

          case "RATEFLOW_FILL_FORM": {
            if (!isFormPage()) {
              sendResponse({ ok: false, error: "Không phải trang form đánh giá. URL hiện tại: " + location.search });
              break;
            }
            const fillResult = fillForm({
              policy: msg.payload?.policy || "random_4_5",
              texts: msg.payload?.texts || {},
            });
            await wait(400);
            const captcha = captureCaptcha();
            sendResponse({ ok: true, fillResult, captcha });
            break;
          }

          case "RATEFLOW_CAPTURE_CAPTCHA":
            sendResponse({ ok: true, captcha: captureCaptcha() });
            break;

          case "RATEFLOW_RELOAD_CAPTCHA":
            sendResponse({ ok: true, captcha: await reloadCaptcha() });
            break;

          case "RATEFLOW_SUBMIT": {
            const result = await submitForm(msg.payload?.captchaText || "");
            sendResponse({ ok: result.ok, ...result });
            break;
          }

          default:
            sendResponse({ ok: false, error: `Unknown: ${msg.type}` });
        }
      } catch (e) {
        err("Handler error:", e);
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();

    return true;
  });

  log("v2 injected →", isListPage() ? "LIST PAGE" : isFormPage() ? "FORM PAGE" : "OTHER", location.search.slice(0, 60));
})();
