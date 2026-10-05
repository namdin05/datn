const groups = [
  {
    "id": "foundation",
    "title": "Học phần & tài liệu",
    "subtitle": "Xây nền dữ liệu trước khi tạo câu hỏi.",
    "source": "§8–10",
    "modules": [
      [
        "01",
        "Tổ chức, học phần & lớp học",
        "Quản lý không gian giảng dạy và người tham gia.",
        "MVP",
        "§8",
        [
          "Tạo học phần, học kỳ và lớp; ghi danh bằng mã mời hoặc import danh sách CSV.",
          "Phân công giảng viên, trợ giảng; lưu trữ và sao chép học phần.",
          "Quản lý mã môn, tên, mô tả, năm học, ngôn ngữ, số tín chỉ và trạng thái."
        ],
        "Một học phần Hệ điều hành có các lớp và danh sách sinh viên riêng.",
        "Học phần, lớp và ghi danh thuộc MVP. Organization multi-tenant vẫn cần quyết định."
      ],
      [
        "02",
        "Quản lý tài liệu học tập",
        "Chuyển tài liệu giảng dạy thành cấu trúc kiến thức có thể sử dụng.",
        "MVP",
        "§4–5, 9",
        [
          "Tiếp nhận PDF, DOCX, PPTX, TXT, Markdown hoặc văn bản dán; định dạng MVP cần chốt.",
          "Kiểm tra khả năng đọc, thiếu nội dung, tài liệu trùng, nhiễu và nhu cầu OCR.",
          "Trích xuất chương, mục, chủ đề, khái niệm và chuẩn đầu ra; giảng viên chỉnh sửa cấu trúc được nhận diện."
        ],
        "chapter-3.pdf: báo cáo nội dung đọc được, trang OCR kém, chủ đề phát hiện và phần trùng lặp.",
        "Giảng viên có thể chấp nhận cảnh báo, thay tệp, loại trang hoặc sửa metadata. Chất lượng đầu vào quyết định chất lượng đánh giá."
      ],
      [
        "03",
        "Chuẩn đầu ra học tập",
        "Liên kết nội dung đánh giá với mục tiêu của học phần.",
        "MVP",
        "§10",
        [
          "Tạo thủ công, import hoặc nhận gợi ý chuẩn đầu ra từ AI.",
          "Giảng viên phê duyệt chuẩn đầu ra trước khi sử dụng.",
          "Liên kết Course → Topic → Learning Outcome → Question để kiểm tra độ bao phủ."
        ],
        "LO02: Phân tích các thuật toán lập lịch CPU.",
        "AI chỉ gợi ý; chuẩn đầu ra cần được giảng viên xác nhận."
      ]
    ]
  },
  {
    "id": "questions",
    "title": "Ngân hàng câu hỏi",
    "subtitle": "Lưu câu hỏi có ngữ cảnh, nguồn gốc và quy trình kiểm soát chất lượng.",
    "source": "§11–20",
    "modules": [
      [
        "04",
        "Ngân hàng câu hỏi & vòng đời",
        "Quản lý câu hỏi như tài nguyên học thuật có thể tái sử dụng.",
        "MVP",
        "§11–15",
        [
          "Lưu nội dung, đáp án, giải thích, chủ đề, chuẩn đầu ra, Bloom, nguồn và tác giả. Giáo viên gán nhãn dễ / trung bình / khó; lưu riêng độ khó dự kiến và thống kê thực nghiệm.",
          "Các loại đề xuất: single choice, multiple choice, đúng/sai, điền khuyết, ghép nối, sắp xếp, số, trả lời ngắn và tự luận.",
          "Vòng đời: Draft → Review → Approved → Active → Deprecated; hỗ trợ review, bình luận, duyệt, từ chối và khôi phục.",
          "Lưu version, người sửa, thời điểm và lý do; đề đã dùng tham chiếu đúng phiên bản cũ.",
          "Đề xuất chia sẻ theo phạm vi cá nhân, học phần, bộ môn, cơ sở và công khai."
        ],
        "Q102 có v1, v2, v3. Đề thi đã công bố dùng v1 vẫn giữ nguyên nội dung của v1.",
        "Ngân hàng, nhãn độ khó và lưu phiên bản đã sử dụng là nền tảng đề xuất v0.2. Loại câu hỏi MVP và collaboration cần chốt; chia sẻ cấp cơ sở thuộc mở rộng. Coding chỉ là extension."
      ],
      [
        "05",
        "Nhập câu hỏi",
        "Đưa câu hỏi sẵn có vào ngân hàng qua bước kiểm tra của giảng viên.",
        "MVP",
        "§16",
        [
          "Tạo bằng editor hoặc nhập hàng loạt từ Excel, CSV, DOCX, PDF.",
          "Với AI extraction: phân tích tài liệu → OCR khi cần → nhận diện câu hỏi → chuẩn hóa cấu trúc.",
          "Giảng viên review và approve trước khi câu hỏi được đưa vào sử dụng."
        ],
        "Import một đề cũ; kiểm tra lại nội dung, phương án, đáp án đúng và metadata trước khi duyệt.",
        "Không tự công bố câu hỏi do AI trích xuất. Định dạng và mức hỗ trợ OCR cần research."
      ],
      [
        "06",
        "AI sinh câu hỏi bám nguồn",
        "Tạo bản nháp từ tài liệu và yêu cầu đánh giá của giảng viên.",
        "Nâng cao",
        "§17–19, 46",
        [
          "Chọn chủ đề, chuẩn đầu ra, tài liệu nguồn, loại câu hỏi, số lượng, độ khó và Bloom.",
          "RAG: xử lý tài liệu → chia đoạn → embedding → tìm ngữ cảnh liên quan → LLM sinh câu hỏi.",
          "Đầu ra gồm câu hỏi, đáp án, giải thích, metadata và trích dẫn tệp / trang / mục.",
          "Kiểm định bám nguồn, nhất quán đáp án, trùng lặp, mơ hồ và chất lượng phương án nhiễu."
        ],
        "Sinh 20 câu CPU Scheduling: 5 dễ, 10 trung bình, 5 khó. Mỗi câu có nguồn để giảng viên đối chiếu.",
        "Giữ hướng RAG từ đặc tả gốc; chọn độ sâu sau khi cân đối OMR và cá nhân hóa. Câu hỏi là bản nháp cần giảng viên duyệt; không dùng nhãn AI như sự thật mặc định."
      ],
      [
        "07",
        "Bộ phân tích chất lượng câu hỏi",
        "Phát hiện vấn đề trước khi câu hỏi được sử dụng trong đề thi.",
        "Nâng cao",
        "§20, 48",
        [
          "Phát hiện trùng ngữ nghĩa; gợi ý giữ, gộp, xóa hoặc viết lại.",
          "Cảnh báo diễn đạt mơ hồ và phương án nhiễu yếu.",
          "Dự đoán độ khó, phân loại Bloom kèm độ tin cậy; giảng viên có thể ghi đè.",
          "Sau kỳ thi, so sánh độ khó dự đoán với dữ liệu trả lời thực tế."
        ],
        "Một phương án “Banana” trong câu hỏi về giao thức mạng bị gắn cờ là phương án nhiễu yếu.",
        "Điểm AI là tín hiệu tham khảo. Giáo viên xem độ khó ban đầu, tỷ lệ đúng, số bài và nhóm làm bài để quyết định điều chỉnh; không tự ghi đè nhãn theo một thống kê nhỏ."
      ]
    ]
  },
  {
    "id": "assessment",
    "title": "Tạo đề & tổ chức thi",
    "subtitle": "Từ ma trận yêu cầu đến một phiên thi có thể phục hồi khi mất kết nối.",
    "source": "§21–29",
    "modules": [
      [
        "08",
        "Ma trận đề thi (Exam Blueprint)",
        "Mô tả cấu trúc đề trước khi hệ thống chọn câu hỏi.",
        "MVP",
        "§21–22",
        [
          "Thiết lập số câu, thời lượng, tỷ lệ chủ đề, độ khó, Bloom và loại câu hỏi.",
          "Ràng buộc độ bao phủ chuẩn đầu ra, giới hạn tái sử dụng câu hỏi và tổng thời gian dự kiến.",
          "Kiểm tra ngân hàng có đủ câu thỏa từng chiều trước khi sinh đề; chỉ rõ phần thiếu và đề nghị bổ sung hoặc sửa blueprint có xác nhận."
        ],
        "Giữa kỳ: 40 câu, 60 phút; dễ 30%, trung bình 50%, khó 20%. Nếu thiếu 6 câu mức vận dụng về Synchronization, báo thiếu trước khi tạo đề.",
        "Blueprint là cơ sở chọn câu, thay vì random thuần túy."
      ],
      [
        "09",
        "Sinh đề thông minh & đề tương đương",
        "Chọn câu theo blueprint và hỗ trợ so sánh các mã đề.",
        "MVP + Nâng cao",
        "§23–25, 47",
        [
          "Kết hợp ngân hàng câu hỏi với blueprint; giảm độ lệch chủ đề, độ khó, Bloom, thời gian, trùng nghĩa và tái sử dụng.",
          "Preview danh sách câu, độ bao phủ và phân bố; cho phép thay, khóa câu hoặc sinh lại đề.",
          "Nâng cao: tạo Form A / B / C / D tương đương về độ khó, chủ đề, Bloom, chuẩn đầu ra, loại câu và thời gian.",
          "Khóa câu hỏi, đáp án và ánh xạ thứ tự theo từng mã đề khi phát hành. Kết quả online và phiếu scan đều tham chiếu đúng snapshot này."
        ],
        "Ví dụ đề tương đương: Form A độ khó 0,62 / 59 phút; B 0,60 / 61 phút; C 0,61 / 60 phút. Đây là dữ liệu minh họa.",
        "Đề tương đương dùng cho thi chung; phân phối đề khác độ khó dùng trước cho luyện tập. Không đồng nhất hai mục tiêu. Thuật toán và ngưỡng tương đương chưa chốt."
      ],
      [
        "10",
        "Tổ chức thi & phục hồi phiên",
        "Hỗ trợ sinh viên làm bài ổn định trong thời gian quy định.",
        "MVP",
        "§26–28",
        [
          "Luồng: phòng chờ → xác minh → hướng dẫn → làm bài → nộp bài → kết quả.",
          "Đặt lịch, giờ mở / đóng, thời lượng, mật khẩu hoặc mã truy cập và số lần làm bài.",
          "Đếm ngược, điều hướng, đánh dấu câu, tự lưu và tự nộp. Phân biệt đã lưu cục bộ / đã đồng bộ / đã nộp; chỉ phát biên nhận khi máy chủ nhận bài.",
          "Đảo thứ tự câu / đáp án; hỗ trợ question pool và mã đề.",
          "Lưu câu trả lời cục bộ khi mất mạng rồi đồng bộ; xử lý gửi trùng, xung đột, hết hạn và timeout."
        ],
        "Sinh viên mất mạng tạm thời: câu trả lời được lưu, đồng bộ lại khi kết nối phục hồi.",
        "Máy chủ quyết định thời hạn và trạng thái nộp. Gửi lại cùng một yêu cầu không tạo thêm bài cuối. Randomization là baseline, không phải đóng góp nghiên cứu chính."
      ],
      [
        "11",
        "Tính toàn vẹn học thuật",
        "Cung cấp nhật ký hoạt động để giảng viên xem xét.",
        "Cần chốt",
        "§29, 55",
        [
          "Ghi nhận chuyển tab, mất focus, reconnect, đăng nhập nhiều thiết bị và thay đổi IP.",
          "Có thể ghi nhận nộp bài bất thường, thoát toàn màn hình và copy/paste khi phù hợp.",
          "Điểm hoạt động đáng ngờ là tùy chọn mở rộng.",
          "Công bố quy tắc thu thập tín hiệu trước kỳ thi; người có quyền xem xét ngữ cảnh và ghi lý do xử lý."
        ],
        "Giảng viên xem Exam Activity Log để hiểu ngữ cảnh các sự kiện trong phiên thi.",
        "Không tự trừ điểm hoặc kết luận gian lận từ tín hiệu. Sinh viên có thể giải thích hoặc yêu cầu xem lại; giới hạn người xem và thời gian lưu sự kiện."
      ]
    ]
  },
  {
    "id": "paper",
    "title": "Phiếu giấy & scan điện thoại",
    "subtitle": "Dùng cùng đề đã duyệt và cùng quy trình kết quả với bài online. Chỉ bài giấy cần bước nhận diện ô tô.",
    "source": "Bổ sung v0.2",
    "modules": [
      [
        "19",
        "Thiết kế phiếu trả lời",
        "Giáo viên tùy chỉnh phần tô đáp án trong giới hạn bảo đảm nhận diện.",
        "Nâng cao",
        "Bổ sung · yêu cầu của nhóm",
        [
          "Cấu hình số câu, số phương án, nhãn A–D / A–E, chia cột, chia phần và đánh số câu trên mẫu chuẩn.",
          "Thêm trường sinh viên, lớp và mã đề; xuất PDF phiếu riêng hoặc cùng đề thi.",
          "Giữ dấu căn chỉnh, kích thước ô và khoảng cách tối thiểu; preview và kiểm tra mẫu trước khi in.",
          "Gắn mã mẫu, phiên bản phiếu và mã đề với đáp án / ánh xạ phương án đã khóa. QR không chứa đáp án."
        ],
        "Đề A đảo thứ tự câu và phương án: phiếu A được chấm theo ánh xạ của A, không lấy trực tiếp đáp án đề gốc.",
        "Đề xuất bản đầu dùng mẫu có ràng buộc, single choice và một số khổ giấy thống nhất. Không làm editor tự do hoặc tự giả định mọi mẫu bên ngoài đều quét được."
      ],
      [
        "20",
        "Chấm phiếu bằng camera điện thoại",
        "Nhận diện ô tô, đưa trường hợp chưa rõ cho người chấm kiểm tra.",
        "Nâng cao",
        "Bổ sung · yêu cầu của nhóm",
        [
          "Chọn kỳ thi → chụp hoặc tải ảnh → xác định mẫu / mã đề → kiểm tra sinh viên → căn chỉnh → đọc ô tô (OMR).",
          "Kiểm tra ảnh thiếu góc, mờ, nghiêng hoặc thiếu sáng; yêu cầu chụp lại nếu không đủ chất lượng.",
          "Đánh dấu tô nhiều ô, tẩy không sạch hoặc độ tin cậy thấp; hiển thị vùng ảnh và kết quả đề xuất để xác nhận.",
          "Phát hiện quét trùng; đối chiếu danh sách lớp. Không tự gắn bài cho sinh viên khi mã không khớp hoặc không chắc chắn.",
          "Lưu ảnh nguồn, kết quả đọc ban đầu, thay đổi thủ công và người xác nhận; chỉ kết quả đã xác nhận được chuyển sang phân tích."
        ],
        "Câu 12 có dấu tô giữa B và D: hệ thống đưa vào hàng đợi review. Giảng viên xem ảnh, sửa B thành D và ghi lý do trước khi công bố điểm.",
        "OMR nhận dấu tô, không phải đọc chữ viết tay hay AI chấm tự luận. Chưa chốt dùng camera web hay app riêng; độ chính xác và ngưỡng review phải kiểm chứng trên bộ ảnh thực tế."
      ]
    ]
  },
  {
    "id": "grading",
    "title": "Chấm điểm & phản hồi",
    "subtitle": "Kết hợp chấm tự động và đánh giá của giảng viên, kiểm soát thời điểm công bố.",
    "source": "§30–34",
    "modules": [
      [
        "12",
        "Chấm điểm & rubric",
        "Chấm khách quan tự động, chấm tự luận theo tiêu chí rõ ràng.",
        "MVP + Nâng cao",
        "§30–31",
        [
          "Chấm tự động cho single choice, multiple choice, đúng/sai, numeric và matching.",
          "Giảng viên chấm câu chủ quan bằng điểm, feedback, rubric và bình luận.",
          "Rubric chia điểm theo từng tiêu chí để hỗ trợ đánh giá nhất quán.",
          "Tách kết quả máy gợi ý, điểm đã xác nhận và điểm công bố. Thay đổi đáp án chung cần xác định tất cả bài bị ảnh hưởng và tạo revision khi chấm lại."
        ],
        "Tự luận 10 điểm: khái niệm 4, lập luận 3, ví dụ 2, trình bày 1.",
        "Chấm tự động thuộc MVP; rubric thuộc nâng cao. Quy tắc điểm của từng loại câu cần đặc tả."
      ],
      [
        "13",
        "AI hỗ trợ chấm & gom nhóm đáp án",
        "Giảm công việc lặp lại khi chấm nhiều câu trả lời tự do.",
        "Mở rộng",
        "§32–33, 55",
        [
          "AI nhận bài làm, câu hỏi, đáp án tham chiếu và rubric để đề xuất điểm kèm lý do.",
          "Giảng viên chấp nhận, sửa hoặc từ chối điểm đề xuất.",
          "Gom nhóm đáp án tương đồng về ngữ nghĩa để hỗ trợ chấm theo nhóm."
        ],
        "100 câu trả lời ngắn có thể được gom thành các nhóm nội dung để giảng viên review hiệu quả hơn.",
        "AI không tự công bố điểm cuối. Dù được mô tả là optional advanced ở §32, bảng scope §55 xếp AI grading vào mở rộng."
      ],
      [
        "14",
        "Kết quả & phản hồi",
        "Giúp sinh viên hiểu kết quả và nhận hướng cải thiện.",
        "MVP",
        "§34",
        [
          "Hiển thị điểm, câu đúng / sai, giải thích và phản hồi.",
          "Có thể bổ sung kết quả theo chủ đề và chuẩn đầu ra.",
          "Giảng viên cấu hình hiện ngay, sau khi đóng kỳ thi hoặc không hiện đáp án.",
          "Công bố bằng chứng chấm của chính sinh viên theo quyền và lịch; liên kết yêu cầu phúc khảo và thông báo các lần hiệu chỉnh."
        ],
        "Sinh viên nhận điểm sau khi nộp; đáp án chỉ được mở khi kỳ thi kết thúc theo cấu hình.",
        "Điểm không được ghi đè âm thầm. Kết quả đã xác nhận là đầu vào cho analytics; sau phúc khảo, đánh dấu dữ liệu phụ thuộc cần tính lại."
      ]
    ]
  },
  {
    "id": "analytics",
    "title": "Phân tích & cải thiện",
    "subtitle": "Dùng dữ liệu sau kỳ thi để cải thiện câu hỏi, học phần và việc luyện tập.",
    "source": "§35–44",
    "modules": [
      [
        "15",
        "Item Analysis & Question Health",
        "Đánh giá câu hỏi bằng dữ liệu trả lời thực tế.",
        "Nâng cao",
        "§35–37",
        [
          "Item difficulty: P = số sinh viên trả lời đúng / tổng sinh viên; P cao nghĩa là câu dễ hơn với nhóm làm bài.",
          "Item discrimination: khả năng phân biệt nhóm có kết quả cao và thấp.",
          "Distractor effectiveness: kiểm tra mức lựa chọn từng phương án nhiễu.",
          "Question Health kết hợp độ khó thực nghiệm, độ phân biệt, phương án nhiễu, phân tích AI, mức sử dụng và nguy cơ trùng.",
          "Đề xuất giữ, review, viết lại hoặc ngừng dùng; đưa dữ liệu trở về ngân hàng câu hỏi."
        ],
        "Question 017: difficulty 0,38; discrimination 0,56; distractor efficiency 67%; health 78/100; đề xuất xem lại phương án D.",
        "Thống kê phải kèm số bài, nhóm làm bài, hình thức giấy / online và phiên bản câu hỏi. Tách dữ liệu luyện tập thích ứng khi phân tích vì cách chọn câu ảnh hưởng tỷ lệ đúng. Công thức health và ngưỡng cần kiểm chứng."
      ],
      [
        "16",
        "Learning Analytics & hồ sơ năng lực",
        "Theo dõi kết quả lớp và điểm mạnh, điểm yếu của từng sinh viên.",
        "MVP + Nâng cao",
        "§38–40",
        [
          "Giảng viên xem điểm trung bình, tỷ lệ đạt, hiệu suất theo chủ đề / chuẩn đầu ra, chất lượng câu hỏi và nhóm cần hỗ trợ.",
          "Sinh viên xem xu hướng, điểm mạnh và điểm yếu.",
          "Nâng cao: cập nhật mastery profile theo chủ đề sau mỗi bài đánh giá.",
          "Chỉ dùng bài đã xác nhận; loại ảnh chưa review và bài trùng. Khi kết quả nguồn được sửa, lưu phiên bản hồ sơ tính lại và lý do."
        ],
        "Hồ sơ minh họa: Process 84%, Thread 71%, Scheduling 48%, Synchronization 42%, Memory 77%.",
        "Theo dõi theo từng chủ đề, không gắn nhãn giỏi / yếu cố định cho toàn bộ sinh viên. Ít dữ liệu phải hiển thị độ tin cậy thấp; mô hình và trọng số lịch sử còn cần chọn."
      ],
      [
        "17",
        "Phân phối bộ luyện tập theo năng lực",
        "Chọn tỷ lệ dễ / trung bình / khó theo kết quả từng chủ đề.",
        "Nâng cao",
        "§41–43 · ưu tiên lại v0.2",
        [
          "Giáo viên gán độ khó câu hỏi; hệ thống kết hợp chuẩn đầu ra với lịch sử học tập đã xác nhận để đề xuất bộ bài.",
          "Khởi tạo bằng bài chẩn đoán khi thiếu lịch sử; dùng tỷ lệ độ khó có thể cấu hình và giữ độ bao phủ nội dung.",
          "Thích ứng giữa các lần làm bài, dùng được cho giấy và online. Thích ứng từng câu là hướng mở rộng.",
          "Giải thích lý do chọn bài; giảng viên được điều chỉnh có lưu vết, sinh viên có thể phản hồi bài chưa phù hợp.",
          "Gợi ý tài liệu học phần và kiểm tra lại bằng câu khác cùng chuẩn đầu ra; không chỉ ghi nhận hoàn thành."
        ],
        "Sinh viên mạnh Process nhưng yếu Synchronization: tăng mức thử thách ở Process, tăng câu nền tảng ở Synchronization. Không áp cùng một nhãn năng lực cho cả môn.",
        "Yêu cầu mới đưa phân phối bộ bài thành tính năng nâng cao trọng tâm. Ưu tiên luyện tập; không xếp hạng bằng điểm thô của các đề khác độ khó. Các tỷ lệ và mô hình chưa chốt."
      ],
      [
        "18",
        "Phân tích để cải thiện học phần",
        "Giúp giảng viên nhìn lại nội dung dạy và cách đánh giá.",
        "Cần chốt",
        "§44",
        [
          "Xác định chủ đề sinh viên gặp khó và chuẩn đầu ra chưa đạt.",
          "Tìm câu hỏi chất lượng kém, bài thi quá khó và chênh lệch giữa các phiên bản đề.",
          "Sử dụng kết quả để điều chỉnh câu hỏi và hoạt động đánh giá tiếp theo.",
          "Đề xuất phân tích kiểu hiểu sai từ phương án nhiễu có nhãn được giáo viên duyệt; dùng nhiều bằng chứng, không kết luận từ một câu sai."
        ],
        "Một chuẩn đầu ra có kết quả thấp ở nhiều lớp là tín hiệu để giảng viên xem lại tài liệu và câu hỏi liên quan.",
        "Phụ thuộc learning analytics, item analysis và dữ liệu đủ tin cậy; đặc tả chưa tách scope riêng cho module này."
      ]
    ]
  }
];
const escapeHTML = s => s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const badgeClass = label => ({MVP:'mvp','Nâng cao':'advanced','Mở rộng':'stretch','Cần chốt':'pending'}[label] || 'advanced');
const modulesEl=document.getElementById('modules');if(modulesEl)modulesEl.innerHTML = groups.map(g=>`<section class="module-group" id="${g.id}"><div class="group-meta"><span class="category">Danh mục tính năng</span><span>/</span><span>${g.modules.length} module</span></div><div class="section-title"><h2>${g.title}</h2><span class="source">${g.source}</span></div><p>${g.subtitle}</p>${g.modules.map(m=>`<details class="module" id="module-${m[0]}"><summary><span class="module-code">${m[0]}</span><div><span class="module-title">${m[1]}</span><span class="module-description">${m[2]}</span></div><div class="badges">${m[3].split(' + ').map(b=>`<span class="badge ${badgeClass(b)}">${b}</span>`).join('')}</div><span class="chevron" aria-hidden="true">+</span></summary><div class="module-content"><h4>Tính năng đề xuất</h4><ul>${m[5].map(f=>`<li>${escapeHTML(f)}</li>`).join('')}</ul><div class="example"><b>Ví dụ minh họa</b>${escapeHTML(m[6])}</div><p class="rule">${escapeHTML(m[7])}</p><span class="source">Nguồn / cập nhật: ${m[4]}</span></div></details>`).join('')}</section>`).join('');
const menu=document.querySelector('.menu-button'), sidebar=document.querySelector('.sidebar');
function closeMenu(){sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();menu.focus();}});
document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{if(!sidebar.contains(e.target)&&!menu.contains(e.target))closeMenu();});
const links=[...document.querySelectorAll('.nav-link')];
let ticking=false;
function updateActive(){let current='overview';document.querySelectorAll('main section[id]').forEach(section=>{if(section.getBoundingClientRect().top<=150)current=section.id;});links.forEach(a=>{const active=a.hash==='#'+current;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});ticking=false;}
window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateActive);ticking=true;}},{passive:true});
function handleHash(){const target=document.getElementById(location.hash.slice(1));if(target){if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView();}}
window.addEventListener('hashchange',handleHash);handleHash();updateActive();
