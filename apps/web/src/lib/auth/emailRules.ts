// apps/web/src/lib/auth/emailRules.ts

// Các "đuôi domain" cho phép (theo yêu cầu của bạn)
// Lưu ý: Đây là suffix, ví dụ:
// - "gmail.com" match đúng gmail.com
// - "edu.vn" match *.edu.vn
// - "com" match *.com
const ALLOWED_SUFFIXES = [
  // Gmail domains (chuẩn hiện tại)
  "gmail.com",
  "googlemail.com",

  // Một số suffix VN theo ảnh bạn gửi
  "edu.vn",
  "gov.vn",
  "org.vn",
  "com.vn",
  "vn",

  // Generic TLD theo ảnh bạn gửi
  "net",
  "org",
  "com",
  "info",
  "biz",
];

// normalize email: trim + lowercase
export function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

// Regex email vừa đủ chặt để tránh sai cơ bản
export function isValidEmailFormat(email: string) {
  const e = normalizeEmail(email);
  // local@domain.tld (không cho khoảng trắng)
  // domain bắt buộc có ít nhất 1 dấu chấm hoặc có thể là dạng endswith .com, .vn...
  const re =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

  return re.test(e);
}

function extractDomain(email: string) {
  const e = normalizeEmail(email);
  const at = e.lastIndexOf("@");
  if (at < 0) return "";
  return e.slice(at + 1);
}

// Check domain theo suffix allow-list
// Quy tắc match:
// - domain === suffix (vd gmail.com)
// - hoặc domain endsWith "." + suffix (vd dtu.edu.vn endsWith .edu.vn)
export function isAllowedEmailDomain(email: string) {
  const domain = extractDomain(email);
  if (!domain) return false;

  return ALLOWED_SUFFIXES.some((suffix) => {
    if (domain === suffix) return true;
    return domain.endsWith("." + suffix);
  });
}

// Gợi ý hiển thị cho UI
export function allowedDomainHint() {
  // hiển thị ngắn gọn (đừng quá dài)
  const show = [
    "@gmail.com",
    "@googlemail.com",
    "*.edu.vn",
    "*.gov.vn",
    "*.org.vn",
    "*.com.vn",
    "*.vn",
    "*.com",
    "*.org",
    "*.net",
    "*.info",
    "*.biz",
  ];
  return show.join(", ");
}