import * as fs from "fs";
import * as path from "path";

const DATASET_PATH = path.join(process.cwd(), "mydtu_finetune_data.jsonl");

const systemPrompt = "Bạn là Trợ lý MYDTU AI của Đại học Duy Tân.";

const qaData = [
  {
    q: "Trường Đại học Duy Tân có địa chỉ ở đâu?",
    a: "Trường Đại học Duy Tân có các cơ sở chính tại Đà Nẵng, bao gồm cơ sở Quang Trung, Nguyễn Văn Linh, Hòa Khánh Nam và Việt Bắc."
  },
  {
    q: "Cách tính điểm hệ 4 của Duy Tân như thế nào?",
    a: "Điểm hệ 4 tại Đại học Duy Tân được quy đổi từ hệ 10. Điểm A (8.5 - 10.0) tương đương 4.0, điểm B (7.0 - 8.4) tương đương 3.0, điểm C (5.5 - 6.9) tương đương 2.0, điểm D (4.0 - 5.4) tương đương 1.0, và dưới 4.0 là F (0 điểm)."
  },
  {
    q: "Môn tiên quyết của Kỹ nghệ phần mềm là gì?",
    a: "Thường thì môn tiên quyết của Kỹ nghệ phần mềm là Cấu trúc dữ liệu và giải thuật, và Cơ sở dữ liệu. Tuy nhiên, nó có thể thay đổi tùy theo chương trình đào tạo của từng ngành."
  },
  {
    q: "Quy chế học cải thiện điểm ra sao?",
    a: "Sinh viên có điểm hệ 10 nằm trong mức khá/trung bình (thường từ C đến D) có thể đăng ký học cải thiện. Điểm cao nhất giữa lần học đầu và lần học cải thiện sẽ được lấy để tính GPA tích lũy."
  },
  {
    q: "Làm thế nào để lấy lại password wifi của trường?",
    a: "Sinh viên có thể sử dụng tài khoản myDTU cá nhân để đăng nhập vào mạng Wifi của trường (SSID DTU-Student). Password chính là mật khẩu đăng nhập myDTU."
  },
  {
    q: "Bao nhiêu điểm mới qua môn?",
    a: "Tổng điểm kết thúc học phần (bao gồm điểm giữa kỳ, chuyên cần, và cuối kỳ) từ 4.0 trở lên (theo thang điểm 10) được xem là qua môn (Đạt)."
  },
  {
    q: "Cách đăng ký môn học trên myDTU?",
    a: "Bạn đăng nhập vào myDTU, chọn mục Đăng ký tín chỉ / Đăng ký môn học trong thời gian nhà trường mở hệ thống. Chọn môn học, lớp học phần phù hợp và nhấn Xong để lưu."
  },
  {
    q: "Trường có bao nhiêu học kỳ một năm?",
    a: "Đại học Duy Tân thường có 2 học kỳ chính (Kỳ 1 và Kỳ 2) cùng một học kỳ phụ (Học kỳ Hè) kéo dài khoảng 2 tháng dành cho học vượt hoặc học lại."
  },
  {
    q: "Làm sao để biết mình bị nợ môn?",
    a: "Bạn vào mục Bảng điểm sinh viên trên myDTU, những môn có điểm tổng kết < 4.0 (điểm F) là những môn bạn chưa đạt và cần phải học lại."
  },
  {
    q: "Thi cuối kỳ mà rớt thì có được thi lại không?",
    a: "Trường Đại học Duy Tân thường không tổ chức thi lại ngay. Nếu rớt môn (điểm hệ 10 < 4.0), bạn phải đăng ký học lại môn đó từ đầu vào kỳ sau."
  },
  {
    q: "Học bổng Duy Tân xét như thế nào?",
    a: "Học bổng thường xét dựa trên điểm GPA học kỳ và điểm rèn luyện. Tùy từng loại học bổng mà yêu cầu GPA từ 3.2 (hệ 4) trở lên và điểm rèn luyện xếp loại Tốt/Xuất sắc."
  },
  {
    q: "Mã môn học lấy ở đâu?",
    a: "Bạn có thể xem mã môn học trong Khung chương trình đào tạo của ngành mình học trên myDTU hoặc trên website của khoa."
  },
  {
    q: "Điều kiện để làm khóa luận tốt nghiệp?",
    a: "Thường sinh viên phải tích lũy đủ số tín chỉ quy định báo trước, không nợ các môn cơ sở ngành/chuyên ngành quan trọng, và có GPA đạt mức yêu cầu (thường là từ 2.0 hoặc 2.5/4.0 tùy hệ)."
  },
  {
    q: "Rút bớt học phần có được hoàn tiền không?",
    a: "Nếu bạn rút môn học trong thời gian thay đổi đăng ký tín chỉ (thường 1-2 tuần đầu), bạn sẽ không bị tính học phí môn đó. Nếu rút muộn hơn, bạn có thể vẫn phải đóng học phí và nhận điểm R."
  },
  {
    q: "Giảng viên của em là ai, làm sao coi?",
    a: "Bạn vào mục Thời khóa biểu trên myDTU, click vào chi tiết từng môn sẽ hiện tên giảng viên phụ trách giảng dạy."
  },
  {
    q: "Xin giấy chứng nhận sinh viên ở đâu?",
    a: "Bạn có thể yêu cầu cấp Giấy chứng nhận sinh viên thông qua ứng dụng myDTU (Phần Dịch vụ hành chính) hoặc trực tiếp ở Phòng Công tác Sinh viên."
  },
  {
    q: "Trường mình có bắt buộc mặc đồng phục không?",
    a: "Đại học Duy Tân quy định mặc áo sơ mi, bỏ áo vào quần và đeo thẻ sinh viên hoặc mặc đồng phục áo thun DTU / đồng phục đặc thù của khoa trong những buổi học bình thường."
  },
  {
    q: "Cảnh báo học vụ là gì?",
    a: "Nếu GPA học kỳ của bạn xuống dưới 1.0 (hoặc mức quy định khác tùy năm học), bạn sẽ bị Cảnh báo học vụ. Nếu bị cảnh báo nhiều lần liên tiếp, có thể bị buộc thôi học."
  },
  {
    q: "Em muốn đổi mật khẩu myDTU?",
    a: "Trong hệ thống myDTU, bạn click vào Tên/Avatar góc trên bên phải, chọn mục Đổi mật khẩu, nhập mật khẩu cũ và mật khẩu mới để thay đổi."
  },
  {
    q: "Tiếng Anh đầu ra yêu cầu mức nào?",
    a: "Yêu cầu chuẩn đầu ra Tiếng Anh phụ thuộc vào ngành. Các ngành chuẩn thường yêu cầu TOEIC 450 - 500+, các ngành chất lượng cao hoặc ngôn ngữ sẽ cao hơn, hoặc IELTS tương đương."
  }
];

function generateJSONL() {
  const lines = qaData.map((item) => {
    const obj = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: item.q },
        { role: "assistant", content: item.a }
      ]
    };
    return JSON.stringify(obj);
  });

  const content = lines.join("\n");
  fs.writeFileSync(DATASET_PATH, content, "utf8");
  console.log(`✅ successfully generated ${qaData.length} training examples.`);
  console.log(`📁 File saved to: ${DATASET_PATH}`);
}

generateJSONL();
