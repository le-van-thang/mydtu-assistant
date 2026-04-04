import type { TranscriptItem } from "./api";

type ExportOptions = {
  isVi?: boolean;
  filename?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value: string | null | undefined, locale = "vi-VN") {
  if (!value) return locale.startsWith("vi") ? "Chưa rõ" : "Unknown";
  // The value is typically '2023-2024' or similar in transcript, or '2023-2024 - Học kỳ 1'
  return value;
}

export function exportTranscriptCsv(
  items: TranscriptItem[],
  locale: string,
  filename = "bang-diem"
) {
  const isVi = locale.startsWith("vi");
  const headers = [
    isVi ? "Học kỳ" : "Semester",
    isVi ? "Mã môn" : "Course code",
    isVi ? "Lớp môn học" : "Class code",
    isVi ? "Tên môn" : "Course name",
    isVi ? "Số tín chỉ" : "Credits",
    isVi ? "Điểm hệ 10" : "Grade 10",
    isVi ? "Điểm chữ" : "Letter grade",
    isVi ? "Điểm hệ 4" : "GPA 4",
    isVi ? "Trạng thái" : "Status",
  ];

  const escapeCsv = (value: string | number | null | undefined) => {
    const safe = String(value ?? "");
    if (safe.includes('"') || safe.includes(",") || safe.includes("\n")) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };

  const rows = items.map((item) => [
    item.semester,
    item.courseCode,
    item.classCode,
    item.courseName,
    item.credits,
    item.score10 ?? "",
    item.letter ?? "",
    item.gpa4 ?? "",
    item.status ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportTranscriptHtml(
  items: TranscriptItem[],
  locale: string,
  filename = "bang-diem"
) {
  const isVi = locale.startsWith("vi");
  const title = isVi ? "Bảng Điểm Học Tập" : "Academic Transcript";

  const rowsHtml = items
    .map(
      (item) => `
    <tr>
      <td>${escapeHtml(item.semester)}</td>
      <td>${escapeHtml(item.courseCode)}</td>
      <td>${escapeHtml(item.courseName)}</td>
      <td style="text-align: center;">${item.credits}</td>
      <td style="text-align: center; font-weight: 600;">${item.score10 ?? "-"}</td>
      <td style="text-align: center;">${item.letter ?? "-"}</td>
      <td style="text-align: center;">${item.gpa4 ?? "-"}</td>
      <td style="text-align: center;">${escapeHtml(item.status)}</td>
    </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: sans-serif; padding: 20px; color: #333; }
    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #e2e8f0; padding: 12px 8px; text-align: left; }
    th { background-color: #f8fafc; font-weight: 700; }
    tr:nth-child(even) { background-color: #f1f5f9; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${isVi ? "Ngày xuất" : "Exported at"}: ${new Date().toLocaleString(locale)}</p>
  <table>
    <thead>
      <tr>
        <th>${isVi ? "Học kỳ" : "Semester"}</th>
        <th>${isVi ? "Mã môn" : "Code"}</th>
        <th>${isVi ? "Tên môn" : "Course"}</th>
        <th>${isVi ? "TC" : "Crd"}</th>
        <th>${isVi ? "Điểm 10" : "G10"}</th>
        <th>${isVi ? "Điểm chữ" : "Letter"}</th>
        <th>${isVi ? "Điểm 4" : "G4"}</th>
        <th>${isVi ? "Kết quả" : "Status"}</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function openPrintableTranscriptSlip(
  items: TranscriptItem[],
  studentInfo: { name: string; id: string; major?: string },
  stats: { gpa4: string; passedCredits: string; totalCredits: string },
  locale: string
) {
  const isVi = locale.startsWith("vi");
  const title = isVi ? "PHIẾU ĐIỂM TỔNG HỢP CÁ NHÂN" : "PERSONAL ACADEMIC TRANSCRIPT SLIP";

  // Group by semester for better layout
  const grouped = new Map<string, TranscriptItem[]>();
  for (const item of items) {
    if (!grouped.has(item.semester)) grouped.set(item.semester, []);
    grouped.get(item.semester)!.push(item);
  }

  const sectionsHtml = Array.from(grouped.entries())
    .map(([semester, semesterItems]) => {
      const rows = semesterItems
        .map(
          (item) => `
      <tr>
        <td style="font-size: 11px;">${escapeHtml(item.courseCode)}</td>
        <td style="font-weight: 500;">${escapeHtml(item.courseName)}</td>
        <td style="text-align: center;">${item.credits}</td>
        <td style="text-align: center; font-weight: 700;">${item.score10 ?? "-"}</td>
        <td style="text-align: center;">${item.letter ?? "-"}</td>
        <td style="text-align: center;">${item.gpa4 ?? "-"}</td>
        <td style="text-align: center; font-size: 11px;">${escapeHtml(item.status)}</td>
      </tr>`
        )
        .join("");

      return `
      <div class="semester-block">
        <div class="semester-title">${escapeHtml(semester)}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 80px;">${isVi ? "Mã môn" : "Code"}</th>
              <th>${isVi ? "Tên học phần" : "Course Name"}</th>
              <th style="width: 40px;">${isVi ? "TC" : "Cr"}</th>
              <th style="width: 50px;">${isVi ? "Hệ 10" : "H10"}</th>
              <th style="width: 40px;">${isVi ? "Chữ" : "Let"}</th>
              <th style="width: 50px;">${isVi ? "Hệ 4" : "H4"}</th>
              <th style="width: 70px;">${isVi ? "Kết quả" : "Result"}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="${isVi ? "vi" : "en"}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #1e293b;
      font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 20mm auto;
      padding: 15mm;
      background: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #2563eb;
      font-size: 24px;
      text-transform: uppercase;
    }
    .header p {
      margin: 5px 0 0;
      font-size: 14px;
      color: #64748b;
    }
    .student-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 25px;
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .info-item b {
      color: #475569;
      font-size: 12px;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    .info-item span {
      font-weight: 600;
      font-size: 16px;
    }
    .summary-stats {
      display: flex;
      justify-content: space-around;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 25px;
    }
    .stat-box { text-align: center; }
    .stat-box b { display: block; font-size: 11px; color: #3b82f6; text-transform: uppercase; }
    .stat-box span { font-size: 20px; font-weight: 800; color: #1e40af; }
    
    .semester-block { margin-bottom: 30px; }
    .semester-title {
      font-size: 14px;
      font-weight: 800;
      background: #334155;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      display: inline-block;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      border: 1px solid #cbd5e1;
      padding: 8px;
      font-size: 11px;
      background: #f1f5f9;
      text-align: left;
      text-transform: uppercase;
    }
    td {
      border: 1px solid #e2e8f0;
      padding: 8px;
      font-size: 13px;
    }
    tr:nth-child(even) { background: #fcfcfc; }
    
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
    }
    .signature {
      text-align: center;
      width: 200px;
      margin-top: 20px;
    }
    .signature b { display: block; margin-bottom: 60px; }
    
    @media print {
      body { background: white; }
      .page {
        width: 100%;
        margin: 0;
        box-shadow: none;
        padding: 5mm;
      }
      .semester-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <p>${isVi ? "Hệ thống trợ lý MyDTU Assistant" : "Generated by MyDTU Assistant"}</p>
    </div>

    <div class="student-info">
      <div class="info-item">
        <b>${isVi ? "Họ và tên" : "Full Name"}</b>
        <span>${escapeHtml(studentInfo.name)}</span>
      </div>
      <div class="info-item">
        <b>${isVi ? "Mã số sinh viên" : "Student ID"}</b>
        <span>${escapeHtml(studentInfo.id)}</span>
      </div>
      <div class="info-item" style="grid-column: span 2;">
        <b>${isVi ? "Ngành học" : "Major"}</b>
        <span>${escapeHtml(studentInfo.major || "—")}</span>
      </div>
    </div>

    <div class="summary-stats">
      <div class="stat-box">
        <b>${isVi ? "GPA Hệ 4" : "GPA (Scale 4.0)"}</b>
        <span>${stats.gpa4}</span>
      </div>
      <div class="stat-box">
        <b>${isVi ? "TC Tích lũy" : "Passed Credits"}</b>
        <span>${stats.passedCredits}</span>
      </div>
      <div class="stat-box">
        <b>${isVi ? "Tổng TC Đã học" : "Total Registered"}</b>
        <span>${stats.totalCredits}</span>
      </div>
    </div>

    ${sectionsHtml}

    <div class="footer">
      <div>
        ${isVi ? "Xuất ngày" : "Generated at"}: ${new Date().toLocaleString(locale)}
      </div>
      <div class="signature">
        <b>${isVi ? "Người in phiếu" : "Generated By"}</b>
        (Ký và ghi rõ họ tên)
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
        // window.close(); // Options: auto close after print
      }, 500);
    }
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}
