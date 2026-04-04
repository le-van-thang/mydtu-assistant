export function escapeHtml(value: unknown) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function exportTimetableWorkbook(
  items: any[],
  locale: string,
  options: {
    isVi: boolean;
    filePrefix: string;
  },
) {
  const { isVi, filePrefix } = options;

  let htmlLines: string[] = [];

  htmlLines.push(
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">',
  );
  htmlLines.push('<head><meta charset="utf-8" /><style>');
  htmlLines.push(
    'table, th, td { border: 1px solid #bfcbda; border-collapse: collapse; font-family: "Times New Roman", Times, serif; font-size: 14pt; }',
  );
  htmlLines.push(
    "th { background-color: #0f172a; color: #ffffff; font-weight: bold; }",
  );
  htmlLines.push(".bg-today { background-color: #e2e8f0; }");
  htmlLines.push("</style></head><body>");

  htmlLines.push("<h2>");
  htmlLines.push(
    isVi
      ? `Báo cáo Thời khoá biểu (Xuất lúc: ${new Date().toLocaleString(locale)})`
      : `Timetable Report (Exported at: ${new Date().toLocaleString(locale)})`,
  );
  htmlLines.push("</h2>");
  htmlLines.push("<br/>");

  htmlLines.push("<table>");
  htmlLines.push("<tr>");
  htmlLines.push(`<th>STT</th>`);
  htmlLines.push(`<th>${isVi ? "Mã môn học" : "Course Code"}</th>`);
  htmlLines.push(`<th>${isVi ? "Tên môn học" : "Course Name"}</th>`);
  htmlLines.push(`<th>${isVi ? "Phòng học" : "Room"}</th>`);
  htmlLines.push(`<th>${isVi ? "Ngày diễn ra" : "Date"}</th>`);
  htmlLines.push(`<th>${isVi ? "Thời gian" : "Time"}</th>`);
  htmlLines.push(`<th>${isVi ? "Tuần học" : "Weeks"}</th>`);
  htmlLines.push("</tr>");

  items.forEach((item, idx) => {
    htmlLines.push("<tr>");
    htmlLines.push(
      `<td style="text-align: center">${idx + 1}</td>`,
    );
    htmlLines.push(
      `<td style="mso-number-format:'\\@';">${escapeHtml(item.courseCode)}</td>`,
    );
    htmlLines.push(`<td>${escapeHtml(item.courseName || "")}</td>`);
    htmlLines.push(`<td>${escapeHtml(item.room)}</td>`);
    htmlLines.push(`<td>${escapeHtml(item.occurrenceDate || "")}</td>`);
    htmlLines.push(`<td>${escapeHtml(item.startTime)} - ${escapeHtml(item.endTime)}</td>`);
    htmlLines.push(`<td style="mso-number-format:'\\@';">${escapeHtml(item.weeksIncluded || "")}</td>`);
    htmlLines.push("</tr>");
  });

  htmlLines.push("</table></body></html>");

  const blob = new Blob(["\ufeff", htmlLines.join("\n")], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const fileDate = new Date()
    .toLocaleDateString(locale)
    .replace(/[^\d]+/g, "-");
  const filename = `${filePrefix}-${fileDate}.xls`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
