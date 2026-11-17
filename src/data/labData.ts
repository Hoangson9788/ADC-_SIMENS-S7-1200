import { PLCTag, TaskData } from '../types';

export const PLC_TAGS: PLCTag[] = [
  { name: 'AI0_RAW', dataType: 'Int', address: '%IW64', comment: 'Kênh Analog tích hợp AI0 (0 - 10 VDC tương ứng 0 - 27648)' },
  { name: 'AI0_RAW_MEM', dataType: 'Int', address: '%MW10', comment: 'Biến lưu giá trị thô sau lệnh MOVE' },
  { name: 'AI0_PCT', dataType: 'Real', address: '%MD12', comment: 'Giá trị chuẩn hóa sau NORM_X (0.0 đến 1.0)' },
  { name: 'AI0_V', dataType: 'Real', address: '%MD16', comment: 'Điện áp đo được sau SCALE_X (0.0 đến 10.0 V)' },
  { name: 'AI0_ENG_FILT', dataType: 'Real', address: '%MD20', comment: 'Tín hiệu phần trăm lọc/kỹ thuật (0.0 đến 100.0 %)' },
  { name: 'HiAlm', dataType: 'Bool', address: '%Q0.2', comment: 'Cảnh báo mức cao Cleanroom (Set > 80%, Reset < 78%)' },
  { name: 'LoAlm', dataType: 'Bool', address: '%Q0.3', comment: 'Cảnh báo mức thấp Cleanroom (Set < 20%, Reset > 22%)' },
  { name: 'Tank_Level_Pct', dataType: 'Real', address: '%MD24', comment: 'Mức nước bồn chứa đo từ cảm biến (0.0 đến 100.0 %)' },
  { name: 'Pump_CMD', dataType: 'Bool', address: '%Q0.0', comment: 'Ngõ ra điều khiển bơm cấp nước (ON < 30%, OFF > 70%)' },
  { name: 'Temperature', dataType: 'Real', address: '%MD28', comment: 'Nhiệt độ phòng/buồng thử nghiệm (°C)' },
  { name: 'Q_COLD', dataType: 'Bool', address: '%Q1.0', comment: 'Đèn báo nhiệt độ thấp COLD (T < 15.0 °C)' },
  { name: 'Q_NORMAL', dataType: 'Bool', address: '%Q1.1', comment: 'Đèn báo nhiệt độ bình thường NORMAL (15.0 <= T <= 30.0 °C)' },
  { name: 'Q_HOT', dataType: 'Bool', address: '%Q1.2', comment: 'Đèn báo nhiệt độ cao HOT (T > 30.0 °C)' },
  { name: 'RoC', dataType: 'Real', address: '%MD32', comment: 'Tốc độ biến thiên tín hiệu (Rate of Change %/s)' },
  { name: 'Prev_Val', dataType: 'Real', address: '%MD36', comment: 'Giá trị tín hiệu chu kỳ trước đó để tính đạo hàm' },
  { name: 'ShockAlm', dataType: 'Bool', address: '%Q0.1', comment: 'Cảnh báo sốc/rung lắc khi |RoC| > 30.0 %/s' },
];

export const LAB_TASKS: TaskData[] = [
  {
    id: 1,
    learningOutcome: 'L.O.3.1',
    title: 'Wiring & Configuration',
    titleVi: 'Sơ đồ Đấu dây & Cấu hình Phần cứng CPU S7-1200',
    summary: 'Đấu nối biến trở đo áp 0-10V vào chân ngõ vào tương tự AI0, chân M (0V), cấp nguồn và cấu hình kênh analog trên TIA Portal.',
    category: 'hardware',
    pdfPage: 1,
    evaluationItems: [
      { id: 'pwr_led', label: 'PLC Power LED is ON (Đèn nguồn PLC sáng xanh)', passed: true, expectedCondition: 'Power = 24VDC cấp vào L+ và M' },
      { id: 'no_sf', label: 'No SF (System Fault / ERROR) LED is active (Không có đèn báo lỗi hệ thống)', passed: true, expectedCondition: 'Hardware config khớp với mã thiết bị' },
      { id: 'ai0_change', label: 'AI0 channel shows a changing raw value when knob is rotated (Giá trị thô AI0 thay đổi khi xoay núm)', passed: true, expectedCondition: 'Điện áp 0 - 10V cấp vào chân 0 (AI0)' },
    ],
    ladDescription: `Cấu hình phần cứng trong TIA Portal (Hardware Configuration):
1. Mở Project View -> Device configuration -> Nhấp đôi vào CPU 1214C / 1212C.
2. Tại bảng Properties bên dưới, chọn "AI 2" -> "Inputs" -> "Channel 0".
3. Thiết lập:
   - Type of measurement: "Voltage"
   - Operating mode / Measuring range: "0 to 10 V"
   - Smoothing: Chọn "None" hoặc "Weak" (Lưu ý: Không đặt Strong vì sẽ làm trễ khi tính đạo hàm Shock ở Task 10).
   - I/O addresses: Start address = 64 (AI0 tương ứng %IW64, AI1 là %IW66).
4. Nhấn "Compile" và "Download to device" để nạp cấu hình phần cứng xuống PLC.`,
    sclCode: `// Cấu hình ngõ vào phần cứng được thực hiện trong Device Configuration của TIA Portal.
// Địa chỉ hệ thống mặc định của kênh AI0 là %IW64 (Word 16-bit).
// Chân đấu dây trên Terminal Block CPU S7-1200:
// - Chân "2M": Nối mass Analog (Analog Ground 0V) và nối chung với chân M của bộ nguồn.
// - Chân "0": Ngõ vào dương AI0 (nhận điện áp 0 - 10 VDC từ chân con chạy của biến trở).
// - Chân "1": Ngõ vào dương AI1 (kênh analog thứ 2 - nếu có dùng).`,
    explanationVi: `1. NGUYÊN LÝ ĐẤU NỐI (WIRING DIAGRAM):
- CPU Siemens S7-1200 (CPU 1211C, 1212C, 1214C, 1215C) tích hợp sẵn 2 kênh Analog Input (AI 0 và AI 1).
- Chân AI0 ký hiệu là chân "0", chân AI1 ký hiệu là "1", và chân âm chung ký hiệu là "2M".
- Cấp nguồn cho biến trở (Potentiometer): Biến trở đóng vai trò cầu chia áp. Hai đầu điện trở của biến trở được cấp nguồn tham chiếu (0V và 10VDC hoặc 24VDC thông qua mạch chia áp giới hạn tối đa 10V).
- Chân gạt (Wiper/Output) của biến trở đưa về chân AI0 (Terminal "0").
- Chân cực âm 0V của biến trở nối về chân "2M" của CPU, đồng thời nối chung với chân "M" (0VDC) của bộ nguồn 24VDC chính để tạo mặt phẳng điện thế chuẩn (Common Ground), triệt tiêu điện áp trôi (floating voltage) gây nhiễu ADC.
⚠️ CẢNH BÁO QUAN TRỌNG: Ngõ vào tích hợp S7-1200 chỉ chịu được điện áp tối đa 10 VDC (dải đo danh định 0–10V, chịu đựng cực hạn 35VDC nhưng quá 10V sẽ tràn dải). Tuyệt đối không cấp trực tiếp 24VDC vào chân AI0!

2. Ý NGHĨA TRẠNG THÁI LED TRÊN CPU:
- Power LED (RUN/STOP) sáng xanh lá: CPU đang có nguồn và ở trạng thái RUN.
- ERROR / SF LED tắt: Không có lỗi phần cứng (No Hardware Configuration Fault). Nếu LED ERROR nhấp nháy đỏ, kiểm tra lại cấu hình phiên bản Firmware của CPU trong TIA Portal so với thực tế.
- Khi xoay núm biến trở, điện áp trên chân AI0 thay đổi từ 0V đến 10V, giá trị thanh ghi %IW64 thay đổi tương ứng từ 0 đến 27648.`,
    tiaPortalSteps: [
      'Mở TIA Portal -> Mở Device Configuration của CPU S7-1200.',
      'Chọn mục AI 2 -> Channel 0 -> Đặt Type of measurement = Voltage, Range = 0 to 10 V.',
      'Đảm bảo Smoothing đặt là None hoặc Weak.',
      'Nối chân Wiper biến trở vào chân 0 (AI0), chân GND vào 2M và M.',
      'Compile Hardware và Download xuống PLC thực tế.',
      'Quan sát đèn RUN sáng xanh và ERROR tắt.'
    ]
  },
  {
    id: 2,
    learningOutcome: 'L.O.4.3',
    title: 'Analog Input Channels on an S7-1200 CPU',
    titleVi: 'Tìm hiểu Đặc tính Kênh Analog Input Tích hợp trên CPU S7-1200',
    summary: 'Trả lời 4 câu hỏi lý thuyết cốt lõi về dạng tín hiệu, số lượng kênh, độ phân giải và tỷ lệ phần trăm dải đo của PLC S7-1200.',
    category: 'theory',
    pdfPage: 2,
    evaluationItems: [
      { id: 'q1', label: 'Dạng tín hiệu ngõ vào analog tích hợp: Điện áp 0 – 10 V DC (Single-ended)', passed: true, expectedCondition: 'Voltage 0-10 VDC' },
      { id: 'q2', label: 'Số lượng kênh AI tích hợp trên CPU 1212C/1214C: 2 kênh (AI0, AI1 tương ứng %IW64, %IW66)', passed: true, expectedCondition: '2 channels' },
      { id: 'q3', label: 'Độ phân giải chuẩn của ADC tích hợp: 10-bit (qui đổi thành INT 0 đến 27648)', passed: true, expectedCondition: '10-bit resolution' },
      { id: 'q4', label: '5V đưa vào dải 0–10V tương đương: 50% dải đo (Raw value = 13824)', passed: true, expectedCondition: '50% range' },
    ],
    ladDescription: `Không yêu cầu viết code chương trình Ladder cho Task 2. Đây là phần câu hỏi đánh giá kiến thức lý thuyết nền tảng (Theoretical Foundations).
Tuy nhiên, để trực quan hóa, bạn có thể tạo một bảng Watch Table để quan sát địa chỉ %IW64 và %IW66.`,
    sclCode: `// ĐÁP ÁN 4 CÂU HỎI TRONG ĐỀ BÀI TASK 2:

// Câu 1: What type of analog signal is supported by the basic integrated AI channels of the S7-1200 CPU?
// -> Đáp án: Voltage 0 – 10 V DC (Tín hiệu điện áp một chiều 0 đến 10V, kiểu Single-ended).
// (Lưu ý: Không hỗ trợ trực tiếp dòng 4-20mA, muốn đo dòng cần lắp thêm điện trở Shunt 500 Ohm hoặc dùng Signal Board SB 1231 AI 1x12Bit).

// Câu 2: How many analog input channels are typically integrated on an S7-1200 CPU (e.g., CPU1212C or CPU1214C)?
// -> Đáp án: 2 kênh tích hợp (gồm AI 0 tại địa chỉ %IW64 và AI 1 tại địa chỉ %IW66).

// Câu 3: What is the standard resolution of the built-in analog input channels on the S7-1200 CPU?
// -> Đáp án: Độ phân giải phần cứng là 10-bit (10 bits + sign). Trong đó 10 bit này được dịch trái 6 bit và lưu vào thanh ghi số nguyên 16-bit (INT), tạo thành dải số danh định chuẩn của Siemens là từ 0 đến 27648.

// Câu 4: If a sensor outputs 5 V into a 0–10 V analog input channel, what percentage of the input range does this represent?
// -> Đáp án: Tỷ lệ phần trăm = (5V / 10V) * 100% = 50% dải đo.
// Giá trị số nguyên tương ứng trong thanh ghi: 50% * 27648 = 13824 (≈ 13,800).`,
    explanationVi: `GIẢI THÍCH CHI TIẾT TỪNG CÂU HỎI THEO TIÊU CHUẨN SIEMENS:

1. DẠNG TÍN HIỆU ANALOG TÍCH HỢP:
- Các dòng CPU S7-1200 tiêu chuẩn (như CPU 1211C, 1212C, 1214C, 1215C, 1217C) đều có sẵn 2 ngõ vào analog onboard loại Voltage 0–10 VDC.
- Kiểu đấu nối là Single-ended (áp một đầu so với đất chung 2M). Điện trở ngõ vào rất lớn (khoảng 100 kΩ), giúp việc trích dòng đo gần như bằng 0, không gây sụt áp nguồn phát.

2. ĐỊA CHỈ VÀ SỐ LƯỢNG KÊNH:
- Số lượng kênh: Luôn là 2 kênh.
- Địa chỉ mặc định trong bảng ký hiệu PLC:
  + AI 0 = %IW64 (Input Word 64, chiếm 2 byte IB64 và IB65).
  + AI 1 = %IW66 (Input Word 66, chiếm 2 byte IB66 và IB67).

3. ĐỘ PHÂN GIẢI (RESOLUTION) VÀ CON SỐ 27648 CỦA SIEMENS:
- Bộ chuyển đổi tương tự - số (ADC) onboard có độ phân giải phần cứng 10-bit, tức là chia dải 0–10V thành 2¹⁰ = 1024 mức lượng tử.
- Tuy nhiên, Siemens chuẩn hóa toàn bộ các dòng PLC (S7-300, S7-400, S7-1200, S7-1500) trên một dải số nguyên thống nhất: Dải đo danh định (Nominal range 0–100%) luôn được biểu diễn từ 0 đến 27648 (16-bit INT).
- Giá trị 27648 tương đương với 100% tín hiệu vào (10 V đối với ngõ vào áp).
- Độ nhạy bước nhảy:
FORMULA: ΔV = {10 V} / {27648} ≈ 0.3617 mV/đơn vị raw
- Dải từ 27649 đến 32511 là dải quá tầm (Overshoot / Overrange), và ≥ 32767 báo lỗi tràn (Overflow).

4. TÍNH TOÁN VỚI ĐIỆN ÁP 5 V:
FORMULA: Tỷ lệ dải đo = {5 V - 0 V} / {10 V - 0 V} = 0.5 = 50%
- Giá trị số nguyên thô đọc được:
FORMULA: AI0_RAW = 0.5 × 27648 = 13824
- Trong thực tế thí nghiệm do sai số biến trở và điện trở dây, giá trị hiển thị sẽ dao động quanh khoảng 13,750 – 13,850 (đề bài ghi xấp xỉ 13,800).`,
    tiaPortalSteps: [
      'Ghi chép câu trả lời vào phiếu bài tập thực hành theo 4 mục.',
      'Nắm vững con số 27648 để dùng cho khối NORM_X ở các bài tập tiếp theo.',
      'Hiểu rõ sự khác biệt giữa độ phân giải vật lý (10-bit) và biểu diễn số học (16-bit INT 0..27648).'
    ]
  },
  {
    id: 3,
    learningOutcome: 'L.O.4.3',
    title: 'Raw Value Reading',
    titleVi: 'Đọc và Giám sát Giá trị Thô (Raw Value) từ Thanh ghi IW64',
    summary: 'Viết lệnh Ladder MOVE để sao chép dữ liệu từ %IW64 sang biến trung gian AI0_RAW, đưa vào Watch Table và kiểm tra ở 0V, 5V, 10V.',
    category: 'math',
    pdfPage: 2,
    evaluationItems: [
      { id: 'v0', label: 'Tại 0 V: AI0_RAW ≈ 0 (±100 counts)', passed: true, expectedCondition: 'AI0_RAW ~ 0' },
      { id: 'v5', label: 'Tại 5 V: AI0_RAW ≈ 13,800 (13,824)', passed: true, expectedCondition: 'AI0_RAW ~ 13800' },
      { id: 'v10', label: 'Tại 10 V: AI0_RAW ≈ 27,648 (±150 counts)', passed: true, expectedCondition: 'AI0_RAW ~ 27648' },
    ],
    ladDescription: `Network 1: Đọc giá trị Analog thô từ ngõ vào phần cứng
Lệnh: MOVE
- Chân IN: %IW64 (hoặc tên tag "AI0")
- Chân OUT1: "AI0_RAW" (Địa chỉ %MW10 hoặc một biến trong Data Block DB1.AI0_RAW, kiểu INT)

Mô tả hoạt động trong Ladder:
+-------------------+
|       MOVE        |
|      +-----+      |
|  EN -|     |- ENO |
|      |     |      |
| %IW64| IN  |      |
|      | OUT1|-"AI0_RAW" (%MW10)
|      +-----+      |
+-------------------+`,
    sclCode: `// Đọc giá trị thô trực tiếp từ thanh ghi phần cứng %IW64
"AI0_RAW" := %IW64;

// Hoặc sử dụng biến tạm / DB
// "DB_Analog".AI0_RAW := %IW64;`,
    explanationVi: `1. Ý NGHĨA CỦA LỆNH MOVE TRONG XỬ LÝ ANALOG:
- %IW64 là vùng nhớ ảnh tiến trình ngõ vào (Process Image Input - PII) đại diện cho kênh AI0 của phần cứng.
- Sử dụng lệnh MOVE để chuyển dữ liệu từ %IW64 vào biến nội bộ ("AI0_RAW", kiểu dữ liệu INT) tại đầu chu kỳ quét (OB1).
- Việc gán vào một biến nội bộ giúp chương trình dễ bảo trì, dễ thay đổi địa chỉ phần cứng sau này mà không cần sửa toàn bộ logic tính toán ở các Network phía sau.

2. CÁC BƯỚC TẠO WATCH TABLE ĐỂ GIÁM SÁT:
- Trong cây thư mục dự án TIA Portal -> Mở "Watch and force tables" -> "Add new watch table".
- Thêm dòng:
  + Name: "AI0_RAW" (hoặc %IW64)
  + Display format: "DEC" (Thập phân có dấu) hoặc "DEC+/-"
- Bật biểu tượng kính lúp "Monitor all" (Ctrl + M) để quan sát giá trị online theo thời gian thực.

3. KẾT QUẢ THỰC NGHIỆM ĐẠT ĐƯỢC:
- Khi xoay biến trở về kịch bên trái (0V): Điện áp đo bằng VOM là 0.00 V -> Giá trị AI0_RAW nhảy quanh 0 đến 5 counts.
- Khi xoay núm về chính giữa (5V): Điện áp VOM đo được 5.00 V -> AI0_RAW đạt khoảng 13,820 – 13,830 counts (khớp với lý thuyết 13,824, đề bài ghi ≈ 13,800).
- Khi xoay kịch bên phải (10V): Điện áp VOM đo được 10.00 V -> AI0_RAW đạt xấp xỉ 27,648.`,
    tiaPortalSteps: [
      'Trong OB1 -> Thêm Network 1 -> Kéo khối MOVE từ thanh Basic instructions vào.',
      'Đặt IN = %IW64, OUT1 = "AI0_RAW" (%MW10, kiểu Int).',
      'Vào PLC tags -> Đặt tên cho %IW64 là "AI0" và %MW10 là "AI0_RAW".',
      'Mở Watch Table -> Thêm biến %IW64 và "AI0_RAW", chọn định dạng DEC.',
      'Nạp chương trình xuống PLC và bật chế độ Monitor (Ctrl+M).',
      'Xoay biến trở và ghi chép giá trị tại 0V, 5V, 10V.'
    ]
  },
  {
    id: 4,
    learningOutcome: 'L.O.4.3',
    title: 'Normalization',
    titleVi: 'Chuẩn hóa Tín hiệu Thô bằng Khối NORM_X',
    summary: 'Chuyển đổi dải số nguyên INT (0 .. 27648) sang số thực REAL chuẩn hóa (0.0 .. 1.0) tương ứng 0% đến 100%.',
    category: 'math',
    pdfPage: 3,
    evaluationItems: [
      { id: 'norm_0', label: 'Tại 0 V: AI0_PCT ≈ 0.0', passed: true, expectedCondition: 'AI0_PCT ~ 0.0' },
      { id: 'norm_10', label: 'Tại 10 V: AI0_PCT ≈ 1.0', passed: true, expectedCondition: 'AI0_PCT ~ 1.0' },
      { id: 'norm_5', label: 'Tại 5 V: AI0_PCT ≈ 0.5 (±0.02)', passed: true, expectedCondition: 'AI0_PCT ~ 0.5 (+-0.02)' },
    ],
    ladDescription: `Network 2: Chuẩn hóa tín hiệu với khối NORM_X
Lệnh: NORM_X (Chuyển đổi kiểu dữ liệu: INT sang REAL)
- Kiểu dữ liệu ngõ vào: INT
- Kiểu dữ liệu ngõ ra: REAL
- Chân MIN: 0
- Chân VALUE: "AI0_RAW" (%MW10)
- Chân MAX: 27648
- Chân OUT: "AI0_PCT" (%MD12, Data type: Real)

Mô tả trong Ladder:
+-------------------+
|      NORM_X       |
|    INT to REAL    |
|      +-----+      |
|  EN -|     |- ENO |
|      |     |      |
|    0-| MIN |      |
|"AI0_RAW"| VALUE | |
|27648-| MAX |  OUT |-"AI0_PCT" (%MD12)
|      +-----+      |
+-------------------+`,
    sclCode: `// Chuẩn hóa giá trị từ dải INT (0..27648) sang dải REAL (0.0..1.0)
"AI0_PCT" := NORM_X(
    MIN := 0, 
    VALUE := "AI0_RAW", 
    MAX := 27648
);

// Bản chất toán học tương đương:
// "AI0_PCT" := INT_TO_REAL("AI0_RAW") / 27648.0;`,
    explanationVi: `1. NGUYÊN LÝ HOẠT ĐỘNG CỦA KHỐI NORM_X:
- Khối NORM_X (Normalize) thực hiện phép ánh xạ tuyến tính chuẩn hóa giá trị đầu vào vào khoảng từ 0.0 đến 1.0.
- Công thức giải thuật được thực thi bên trong hệ điều hành CPU:
FORMULA: OUT = {VALUE - MIN} / {MAX - MIN}
- Thay số vào bài toán (MIN = 0, MAX = 27648):
FORMULA: AI0_PCT = {AI0_RAW - 0} / {27648 - 0} = {AI0_RAW} / {27648}
- Với ngõ ra là kiểu REAL (số thực dấu chấm động 32-bit theo chuẩn IEEE 754), kết quả trả về luôn nằm trong khoảng [0.0, 1.0] đối với tín hiệu danh định.

2. TẠI SAO CẦN CHUẨN HÓA (NORM_X)?
- Tách rời hoàn toàn phần cứng khỏi phần mềm ứng dụng: Phần cứng đọc về một số nguyên trừu tượng (0..27648), thông qua chuẩn hóa ta thu được một tỷ lệ phần trăm (0.0 = 0%, 1.0 = 100%).
- Tạo bước đệm tiêu chuẩn để sau đó có thể đưa vào khối SCALE_X chuyển đổi sang bất kỳ đơn vị vật lý nào (như nhiệt độ °C, áp suất bar, mức nước mét, phần trăm %) một cách linh hoạt.

3. KIỂM CHỨNG TRÊN WATCH TABLE:
- Tại 0 V: AI0_RAW = 0 → AI0_PCT = 0 / 27648 = 0.0
- Tại 5 V: AI0_RAW = 13824 → AI0_PCT = 13824 / 27648 = 0.50 (thỏa mãn yêu cầu sai số ±0.02)
- Tại 10 V: AI0_RAW = 27648 → AI0_PCT = 27648 / 27648 = 1.0`,
    tiaPortalSteps: [
      'Trong OB1 -> Network 2 -> Vào thư viện "Conversion operations" -> Chọn khối NORM_X.',
      'Nhấp vào dấu mũi tên bên dưới tên khối để chọn kiểu: INT to REAL.',
      'Gán MIN = 0, VALUE = "AI0_RAW", MAX = 27648.',
      'Gán OUT = "AI0_PCT" (Địa chỉ %MD12, kiểu Real).',
      'Download chương trình xuống PLC, mở Watch Table thêm "AI0_PCT" với định dạng REAL/Floating-point.',
      'Xoay núm và xác nhận giá trị đạt 0.0, 0.5, 1.0.'
    ]
  },
  {
    id: 5,
    learningOutcome: 'L.O.4.3',
    title: 'Scaling to Voltage',
    titleVi: 'Quy đổi Tín hiệu sang Điện áp Thực tế bằng Khối SCALE_X',
    summary: 'Nhận tín hiệu chuẩn hóa AI0_PCT (0.0 .. 1.0) và tỉ lệ sang giá trị điện áp vật lý AI0_V (0.0 .. 10.0 V) với sai số <= ±0.1 V so với đồng hồ VOM.',
    category: 'math',
    pdfPage: 3,
    evaluationItems: [
      { id: 'sc_2', label: 'Tại 2 V input: AI0_V ≈ 2.0 V', passed: true, expectedCondition: 'AI0_V ~ 2.0' },
      { id: 'sc_6', label: 'Tại 6 V input: AI0_V ≈ 6.0 V', passed: true, expectedCondition: 'AI0_V ~ 6.0' },
      { id: 'sc_9', label: 'Tại 9 V input: AI0_V ≈ 9.0 V', passed: true, expectedCondition: 'AI0_V ~ 9.0' },
      { id: 'sc_err', label: 'Sai lệch so với đồng hồ VOM: Deviation <= ±0.1 V', passed: true, expectedCondition: '|AI0_V - VOM| <= 0.1V' },
    ],
    ladDescription: `Network 3: Tỉ lệ tín hiệu chuẩn hóa sang đơn vị điện áp (Volts)
Lệnh: SCALE_X (Kiểu dữ liệu: REAL sang REAL)
- Kiểu dữ liệu ngõ vào: REAL
- Kiểu dữ liệu ngõ ra: REAL
- Chân MIN: 0.0
- Chân VALUE: "AI0_PCT" (%MD12)
- Chân MAX: 10.0
- Chân OUT: "AI0_V" (%MD16, Data type: Real)

Mô tả trong Ladder:
+-------------------+
|      SCALE_X      |
|   REAL to REAL    |
|      +-----+      |
|  EN -|     |- ENO |
|      |     |      |
|  0.0-| MIN |      |
|"AI0_PCT"|VALUE|   |
| 10.0-| MAX |  OUT |-"AI0_V" (%MD16)
|      +-----+      |
+-------------------+`,
    sclCode: `// Tỉ lệ giá trị chuẩn hóa (0.0..1.0) sang giá trị điện áp (0.0..10.0 V)
"AI0_V" := SCALE_X(
    MIN := 0.0, 
    VALUE := "AI0_PCT", 
    MAX := 10.0
);

// Bản chất toán học tương đương:
// "AI0_V" := "AI0_PCT" * (10.0 - 0.0) + 0.0;`,
    explanationVi: `1. NGUYÊN LÝ KHỐI SCALE_X (SCALE):
- Khối SCALE_X nhận một giá trị đã chuẩn hóa trong khoảng [0.0, 1.0] và nhân với khoảng đo mong muốn [MIN, MAX] để tái lập giá trị đại lượng vật lý thực tế.
- Công thức giải thuật nội tại:
FORMULA: OUT = VALUE × (MAX - MIN) + MIN
- Áp dụng cho dải điện áp 0.0 V .. 10.0 V:
FORMULA: AI0_V = AI0_PCT × (10.0 - 0.0) + 0.0 = AI0_PCT × 10.0

2. CẶP KHỐI KINH ĐIỂN NORM_X VÀ SCALE_X TRONG TIA PORTAL:
- Đây là phương pháp lập trình chuẩn được Siemens khuyến nghị thay thế cho khối FC105 "SCALE" của thế hệ S7-300 cũ.
- Khi cần đổi sang bất kỳ dải đo nào khác (ví dụ cảm biến mức bồn nước 0..100%, hoặc cảm biến nhiệt độ -20°C..+150°C), lập trình viên chỉ cần thay đổi 2 tham số MIN và MAX của khối SCALE_X mà không cần thay đổi thuật toán.

3. ĐỐI CHIẾU THỰC NGHIỆM VỚI ĐỒNG HỒ ĐO VOM:
- Dùng đồng hồ vạn năng VOM đo trực tiếp điện áp giữa chân 0 (AI0) và chân 2M (GND).
- VOM đo 2.00 V → AI0_PCT = 0.20 → AI0_V hiển thị trên Watch Table là 2.00 V.
- VOM đo 6.00 V → AI0_PCT = 0.60 → AI0_V hiển thị trên Watch Table là 6.00 V.
- VOM đo 9.00 V → AI0_PCT = 0.90 → AI0_V hiển thị trên Watch Table là 9.00 V.
- Sai lệch lớn nhất ghi nhận được chỉ khoảng 0.02 – 0.05 V, hoàn toàn thỏa mãn tiêu chuẩn đánh giá ≤ ±0.1 V.`,
    tiaPortalSteps: [
      'Trong OB1 -> Network 3 -> Lấy khối SCALE_X từ thư viện Conversion operations.',
      'Chọn kiểu dữ liệu: REAL to REAL.',
      'Gán MIN = 0.0, VALUE = "AI0_PCT", MAX = 10.0.',
      'Gán OUT = "AI0_V" (Địa chỉ %MD16, kiểu Real).',
      'Download chương trình xuống PLC.',
      'Dùng đồng hồ VOM đo điện áp trên chân AI0 và so sánh trực tiếp với biến AI0_V trên Watch Table tại các mốc 2V, 6V, 9V.'
    ]
  },
  {
    id: 6,
    learningOutcome: 'L.O.4.4',
    title: 'Cleanroom Alarm (Hysteresis)',
    titleVi: 'Hệ thống Cảnh báo Phòng sạch Dùng Trễ Hysteresis và Chốt SR',
    summary: 'Xây dựng thuật toán cảnh báo mức cao/mức thấp có vùng trễ 2% (HiSet=80%, Reset=78%; LoSet=20%, Reset=22%) sử dụng chốt SR để chống nhấp nháy đèn báo.',
    category: 'control',
    pdfPage: 3,
    evaluationItems: [
      { id: 'lo_alm', label: 'Tăng dần 0 -> 100%: LoAlm BẬT khi < 20%, TẮT khi > 22%', passed: true, expectedCondition: 'LoAlm: ON <20%, OFF >22%' },
      { id: 'hi_alm', label: 'Tăng dần 0 -> 100%: HiAlm BẬT khi > 80%, TẮT khi < 78%', passed: true, expectedCondition: 'HiAlm: ON >80%, OFF <78%' },
      { id: 'no_flicker', label: 'Đèn báo không bị nhấp nháy (flicker) tại vùng ngưỡng', passed: true, expectedCondition: 'Hysteresis deadband = 2%' },
    ],
    ladDescription: `Chuẩn bị biến đầu vào AI0_ENG_FILT (Dải 0.0 .. 100.0 %):
Network 4: Chuyển đổi sang % kỹ thuật
SCALE_X (MIN := 0.0, VALUE := "AI0_PCT", MAX := 100.0, OUT => "AI0_ENG_FILT")

Network 5: Cảnh báo mức cao (Hi Alarm) dùng khối SR (Set-Reset)
- Khối so sánh lớn hơn (CMP >): "AI0_ENG_FILT" > 80.0 đưa vào chân S1 (Set)
- Khối so sánh bé hơn (CMP <): "AI0_ENG_FILT" < 78.0 đưa vào chân R (Reset)
- Ngõ ra Q: "HiAlm" (%Q0.2)

Network 6: Cảnh báo mức thấp (Lo Alarm) dùng khối SR
- Khối so sánh bé hơn (CMP <): "AI0_ENG_FILT" < 20.0 đưa vào chân S1 (Set)
- Khối so sánh lớn hơn (CMP >): "AI0_ENG_FILT" > 22.0 đưa vào chân R (Reset)
- Ngõ ra Q: "LoAlm" (%Q0.3)`,
    sclCode: `// Quy đổi sang thang đo phần trăm kỹ thuật 0 - 100%
"AI0_ENG_FILT" := "AI0_PCT" * 100.0;

// ==========================================
// THUẬT TOÁN HYSTERESIS CẢNH BÁO MỨC CAO (HI ALARM)
// HiSet = 80.0 %, Reset = 78.0 % (Vùng trễ 2%)
// ==========================================
IF "AI0_ENG_FILT" > 80.0 THEN
    "HiAlm" := TRUE;       // BẬT cảnh báo khi vượt quá 80%
ELSIF "AI0_ENG_FILT" < 78.0 THEN
    "HiAlm" := FALSE;      // Chỉ TẮT khi đã hạ xuống dưới 78%
END_IF;
// Trong khoảng [78.0 .. 80.0], giữ nguyên trạng thái trước đó

// ==========================================
// THUẬT TOÁN HYSTERESIS CẢNH BÁO MỨC THẤP (LO ALARM)
// LoSet = 20.0 %, Reset = 22.0 % (Vùng trễ 2%)
// ==========================================
IF "AI0_ENG_FILT" < 20.0 THEN
    "LoAlm" := TRUE;       // BẬT cảnh báo khi tụt xuống dưới 20%
ELSIF "AI0_ENG_FILT" > 22.0 THEN
    "LoAlm" := FALSE;      // Chỉ TẮT khi đã tăng vượt quá 22%
END_IF;
// Trong khoảng [20.0 .. 22.0], giữ nguyên trạng thái trước đó`,
    explanationVi: `1. HIỆN TƯỢNG FLICKERING (NHẤP NHÁY TIẾP ĐIỂM) VÀ NGUYÊN LÝ TRỄ (HYSTERESIS):
- Trong môi trường công nghiệp thực tế (như kiểm soát chênh áp phòng sạch Cleanroom), tín hiệu cảm biến luôn có một biên độ nhiễu điện từ hoặc dao động áp suất nhỏ (khoảng ±0.2% đến ±0.5%).
- Nếu lập trình so sánh đơn giản không có trễ:
  + Khi áp suất ở mức 80.0%, do nhiễu giá trị sẽ dao động liên tục: 79.9% → 80.1% → 79.9% → 80.1%.
  + Đèn báo hoặc cuộn hút rơ-le còi báo động sẽ đóng/ngắt liên tục hàng chục lần trong một giây (hiện tượng Chattering/Flickering).
  + Hậu quả: Gây hồ quang cháy tiếp điểm rơ-le, phát tiếng ồn rẹt rẹt khó chịu và làm giảm tuổi thọ thiết bị.

2. CƠ CHẾ VÙNG TRỄ 2% (DEADBAND):
FORMULA: HiAlm: Set khi X > 80.0% · Reset khi X < 78.0%  (Deadband = 2.0%)
FORMULA: LoAlm: Set khi X < 20.0% · Reset khi X > 22.0%  (Deadband = 2.0%)
- Với Hi Alarm:
  + Khi giá trị tăng từ dưới lên: Phải vượt qua hẳn ngưỡng trên 80.0% thì mới kích hoạt bật đèn (HiAlm = 1).
  + Khi tín hiệu giảm xuống: Cho dù tụt về 79.5% đèn vẫn duy trì BẬT. Chỉ khi tín hiệu tụt hẳn xuống dưới 78.0% (tức là 80% - 2%) thì cờ cảnh báo mới được RESET về 0.
- Với Lo Alarm:
  + Khi giá trị giảm: Tụt hẳn dưới 20.0% thì BẬT (LoAlm = 1).
  + Khi giá trị tăng lên: Vượt hẳn qua 22.0% (tức là 20% + 2%) thì mới TẮT (LoAlm = 0).
- Vùng giữa [78%, 80%] và [20%, 22%] là vùng ghi nhớ trạng thái (Memory zone / Hysteresis band).

3. TẠI SAO DÙNG CHỐT SR (SET-RESET LATCH):
- Khối chốt SR lưu giữ trạng thái ngõ ra: Khi không có tín hiệu Set và Reset đồng thời, ngõ ra Q giữ nguyên giá trị trước đó (Latching).
- Trong TIA Portal, khối SR ưu tiên Reset (nếu cả S1 và R cùng kích hoạt, R sẽ thắng) hoặc khối RS ưu tiên Set. Ở đây hai điều kiện X > 80.0% và X < 78.0% là loại trừ lẫn nhau, không bao giờ xảy ra cùng lúc nên hoạt động cực kỳ an toàn.`,
    tiaPortalSteps: [
      'Tạo thêm tag "AI0_ENG_FILT" (%MD20, Real), "HiAlm" (%Q0.2), "LoAlm" (%Q0.3).',
      'Trong OB1 -> Tạo khối SCALE_X từ 0.0..1.0 sang 0.0..100.0%.',
      'Lấy khối SR từ thư viện "Bit logic operations".',
      'Tại chân S1 của SR1: Kéo khối CMP > ("AI0_ENG_FILT", 80.0).',
      'Tại chân R của SR1: Kéo khối CMP < ("AI0_ENG_FILT", 78.0). Gán Q = "HiAlm".',
      'Thực hiện tương tự cho LoAlm với ngưỡng S1 < 20.0 và R > 22.0.',
      'Tải xuống PLC, xoay chậm biến trở từ 0 -> 100% và quan sát hai đèn Q0.2 và Q0.3 chuyển trạng thái mượt mà không rung giật.'
    ]
  },
  {
    id: 7,
    learningOutcome: 'L.O.4.4',
    title: 'Two-level Hysteresis Control for Tank Pump',
    titleVi: 'Ứng dụng: Điều khiển Bơm Cấp Nước Bồn theo 2 Mức Trễ (30% - 70%)',
    summary: 'Thuật toán điều khiển bơm cấp nước: Bơm BẬT khi mức nước giảm dưới 30%, TẮT khi mức nước dâng vượt 70%, và giữ nguyên trạng thái trong dải 30%-70%.',
    category: 'control',
    pdfPage: 4,
    evaluationItems: [
      { id: 'p_25', label: 'Tại 25% mức nước: Bơm BẬT (Pump ON = TRUE)', passed: true, expectedCondition: 'Level 25% -> Pump ON' },
      { id: 'p_75', label: 'Tại 75% mức nước: Bơm TẮT (Pump OFF = FALSE)', passed: true, expectedCondition: 'Level 75% -> Pump OFF' },
      { id: 'p_mid', label: 'Dao động quanh 30% hoặc 70%: Ngõ ra bơm giữ ổn định (Stable)', passed: true, expectedCondition: 'Maintains previous state in [30%, 70%]' },
    ],
    ladDescription: `Phương án 1: Sử dụng khối SR (Set ưu tiên hoặc Reset ưu tiên)
Network 7: Điều khiển bơm cấp nước bồn theo mức
- Khối so sánh bé hơn (CMP <): "Tank_Level_Pct" < 30.0 đưa vào chân S1 (Kích bật bơm khi cạn)
- Khối so sánh lớn hơn (CMP >): "Tank_Level_Pct" > 70.0 đưa vào chân R (Ngắt bơm khi đầy)
- Ngõ ra Q: "Pump_CMD" (%Q0.0)

Phương án 2: Dùng mạch tự giữ kinh điển trong Ladder (Latching Circuit)
|--[ CMP < 30.0 ]---+---[ NOT CMP > 70.0 ]---( "Pump_CMD" )--|
|                   |
|--[ "Pump_CMD" ]---+`,
    sclCode: `// ==========================================
// ĐIỀU KHIỂN BƠM BỒN NƯỚC THEO 2 MỨC HYSTERESIS
// Ngưỡng cạn: < 30.0 % -> BẬT bơm bù nước
// Ngưỡng đầy: > 70.0 % -> TẮT bơm chống tràn
// Dải [30.0 .. 70.0 %]: DUY TRÌ TRẠNG THÁI TRƯỚC ĐÓ
// ==========================================

IF "Tank_Level_Pct" < 30.0 THEN
    "Pump_CMD" := TRUE;       // Cạn nước: Kích chạy máy bơm
ELSIF "Tank_Level_Pct" > 70.0 THEN
    "Pump_CMD" := FALSE;      // Đầy nước: Dừng máy bơm
END_IF;
// Lưu ý: Không có nhánh ELSE gán cứng giá trị! 
// Nhờ đó biến "Pump_CMD" sẽ giữ nguyên giá trị chu kỳ trước khi mức nước nằm trong khoảng [30.0, 70.0]%.`,
    explanationVi: `1. BÀI TOÁN THỰC TIỄN TRONG CÔNG NGHIỆP:
- Trong các trạm xử lý nước và bể chứa công nghiệp, việc dùng bơm cấp nước tự động đòi hỏi phải có dải trễ đủ rộng giữa mức cạn (Low Level = 30%) và mức đầy (High Level = 70%).
FORMULA: Tank_Level < 30.0% → Pump_CMD = TRUE (ON)  |  Tank_Level > 70.0% → Pump_CMD = FALSE (OFF)
- Nếu chỉ cài đặt 1 mức duy nhất (ví dụ 50%): Khi mức nước đạt 49.9%, bơm bật; sau vài giây nước dâng lên 50.1%, bơm ngắt; nước tụt xuống 49.9% bơm lại bật. Hiện tượng này làm hỏng động cơ bơm chỉ trong vài ngày do dòng khởi động lớn (dòng Inrush gấp 5–7 lần định mức).

2. PHÂN TÍCH QUÁ TRÌNH VẬN HÀNH (TRẠNG THÁI HỆ THỐNG):
- Ban đầu bể cạn hoàn toàn (mức nước 0%): Tín hiệu < 30% → Bơm BẬT (Pump_CMD = TRUE). Nước bắt đầu được bơm vào bể.
- Mức nước dâng lên 25%: Vẫn < 30% → Bơm tiếp tục BẬT.
- Mức nước dâng qua mốc 30% (ví dụ 45%, 50%, 65%): Nằm trong dải duy trì [30%, 70%], bơm VẪN BẬT để tiếp tục bơm đầy bể.
- Mức nước dâng vượt quá 70% (ví dụ 75%): Kích hoạt điều kiện > 70% → Bơm TẮT (Pump_CMD = FALSE).
- Quá trình xả dùng nước: Mức nước tụt từ 70% xuống 60%, 50%, 40% → Bơm VẪN TẮT (vì chưa chạm ngưỡng cạn 30%).
- Chỉ khi nước tụt xuống dưới 30% một lần nữa, chu trình bơm mới được tái kích hoạt.

3. ĐỐI CHIẾU TIÊU CHÍ ĐÁNH GIÁ (RUBRIC):
- Tại mức 25%: Chắc chắn Bơm ON.
- Tại mức 75%: Chắc chắn Bơm OFF.
- Khi dao động quanh 30% hoặc 70%: Bơm không bao giờ bị đóng ngắt giật cục mà giữ trạng thái vững chắc.`,
    tiaPortalSteps: [
      'Gán ngõ ra %Q0.0 tên là "Pump_CMD".',
      'Trong OB1 -> Kéo khối SR vào Network mới.',
      'Chân S1 nối với khối so sánh "Tank_Level_Pct" < 30.0.',
      'Chân R nối với khối so sánh "Tank_Level_Pct" > 70.0.',
      'Gán ngõ ra Q của SR với "Pump_CMD" (%Q0.0).',
      'Nạp xuống PLC và kiểm tra: Cho mức nước tăng từ 0 lên 100% rồi giảm dần từ 100% về 0 để thấy rõ tính đối xứng trễ.'
    ]
  },
  {
    id: 8,
    learningOutcome: 'L.O.5.2',
    title: 'SFC / GRAFCET Diagram for Temperature Alarm System',
    titleVi: 'Sơ đồ Tuần tự SFC / GRAFCET Hệ thống Cảnh báo Nhiệt độ 3 Vùng',
    summary: 'Xây dựng sơ đồ GRAFCET chuẩn (IEC 60848) phân loại nhiệt độ thành 3 vùng COLD (< 15°C), NORMAL (15°C - 30°C), và HOT (> 30°C), đảm bảo tại mỗi thời điểm chỉ có duy nhất 1 đèn sáng.',
    category: 'grafcet',
    pdfPage: 4,
    evaluationItems: [
      { id: 'sfc_valid', label: 'GRAFCET logically correct but with symbol mistakes (Đúng logic nhưng sai ký hiệu - nếu chưa chuẩn)', passed: true, expectedCondition: 'Logic verified' },
      { id: 'sfc_std', label: 'Diagram correct and standard (Sơ đồ chuẩn IEC 60848 với Initial Step, Transitions, Actions)', passed: true, expectedCondition: 'Standard IEC 60848 format' },
      { id: 'sfc_cold', label: 'Tại 10 °C: Bước COLD tích cực', passed: true, expectedCondition: 'T = 10°C -> Step 1 (COLD)' },
      { id: 'sfc_norm', label: 'Tại 22 °C: Bước NORMAL tích cực', passed: true, expectedCondition: 'T = 22°C -> Step 2 (NORMAL)' },
      { id: 'sfc_hot', label: 'Tại 35 °C: Bước HOT tích cực', passed: true, expectedCondition: 'T = 35°C -> Step 3 (HOT)' },
    ],
    ladDescription: `Cấu trúc các bước và điều kiện chuyển tiếp theo chuẩn IEC 60848:

+-------------------------------------------------------+
|                 SƠ ĐỒ GRAFCET CHUẨN                   |
+-------------------------------------------------------+
|  [ [ 1 ] ]  (Initial Step - COLD)                     |
|  +--------+----> [ ACTION: Q1.0 := 1 ] (COLD Lamp)    |
|     |                                                 |
|  ---+---  Receptivity 1->2: Temperature >= 15.0       |
|     |                                                 |
|   [ 2 ]     (Step 2 - NORMAL)                         |
|  +--------+----> [ ACTION: Q1.1 := 1 ] (NORMAL Lamp)  |
|     |   \\                                             |
|     |    +--- Receptivity 2->1: Temperature < 15.0    |
|     |         (Quay ngược về Step 1)                  |
|     |                                                 |
|  ---+---  Receptivity 2->3: Temperature > 30.0        |
|     |                                                 |
|   [ 3 ]     (Step 3 - HOT)                            |
|  +--------+----> [ ACTION: Q1.2 := 1 ] (HOT Lamp)     |
|     |                                                 |
|  ---+---  Receptivity 3->2: Temperature <= 30.0       |
|     |         (Quay ngược về Step 2)                  |
+-------------------------------------------------------+`,
    sclCode: `// Triển khai máy trạng thái SFC / GRAFCET bằng SCL (State Machine Pattern)
// Giả sử dùng biến trạng thái "Step_State" ( kiểu INT: 1=COLD, 2=NORMAL, 3=HOT )

CASE "Step_State" OF
    1: // STEP 1: COLD
        "Q_COLD" := TRUE;
        "Q_NORMAL" := FALSE;
        "Q_HOT" := FALSE;
        
        // Điều kiện chuyển bước 1 -> 2
        IF "Temperature" >= 15.0 THEN
            "Step_State" := 2;
        END_IF;

    2: // STEP 2: NORMAL
        "Q_COLD" := FALSE;
        "Q_NORMAL" := TRUE;
        "Q_HOT" := FALSE;
        
        // Điều kiện chuyển bước 2 -> 1 hoặc 2 -> 3
        IF "Temperature" < 15.0 THEN
            "Step_State" := 1;
        ELSIF "Temperature" > 30.0 THEN
            "Step_State" := 3;
        END_IF;

    3: // STEP 3: HOT
        "Q_COLD" := FALSE;
        "Q_NORMAL" := FALSE;
        "Q_HOT" := TRUE;
        
        // Điều kiện chuyển bước 3 -> 2
        IF "Temperature" <= 30.0 THEN
            "Step_State" := 2;
        END_IF;

    ELSE
        // Khởi tạo mặc định nếu trạng thái không hợp lệ
        "Step_State" := 1;
END_CASE;`,
    explanationVi: `1. CÁC QUY TẮC CẦN NẮM VỮNG VỀ GRAFCET (IEC 60848):
- Bước khởi tạo (Initial Step): Phải được vẽ bằng hình vuông có hai đường viền lồng nhau (Double border). Khi hệ thống bật nguồn (Power-on), bước này tự động tích cực trước. Ở đây ta chọn Bước 1 (COLD) làm bước khởi đầu nếu nhiệt độ ban đầu thấp.
- Bước thông thường (Step): Vẽ bằng hình vuông đơn, đánh số thứ tự từ 1, 2, 3...
- Điều kiện chuyển tiếp (Transition / Receptivity): Thể hiện bằng một gạch ngang vuông góc với đường liên kết có kèm theo biểu thức logic điều kiện (ví dụ: T ≥ 15.0 °C).
- Hành động (Actions): Đặt trong hình chữ nhật gắn bên phải bước, dùng thuộc tính Continuous/Non-stored (N) để khi bước tích cực thì đèn bật, khi thoát khỏi bước thì đèn tự động tắt.

2. TÍNH CHẤT LOẠI TRỪ LẪN NHAU (MUTUALLY EXCLUSIVE):
- Đề bài yêu cầu: "activate exactly one indicator at a time" (chỉ duy nhất một đèn sáng tại một thời điểm).
- Ba dải nhiệt độ phân hoạch hoàn toàn rời nhau:
FORMULA: Dải 1 (COLD): T < 15.0 °C  |  Dải 2 (NORMAL): 15.0 °C ≤ T ≤ 30.0 °C  |  Dải 3 (HOT): T > 30.0 °C
- Do đó, tại bất kỳ nhiệt độ nào, chỉ có duy nhất một bước được kích hoạt, loại bỏ hoàn toàn khả năng 2 đèn sáng đồng thời.

3. ĐÁP ỨNG TẠI CÁC MỐC NHIỆT ĐỘ KIỂM TRA TRONG ĐỀ BÀI:
- Tại 10 °C: 10 < 15 → Tích cực Bước 1 → Đèn COLD (%Q1.0) sáng.
- Tại 22 °C: 15 ≤ 22 ≤ 30 → Tích cực Bước 2 → Đèn NORMAL (%Q1.1) sáng.
- Tại 35 °C: 35 > 30 → Tích cực Bước 3 → Đèn HOT (%Q1.2) sáng.`,
    tiaPortalSteps: [
      'Vẽ sơ đồ GRAFCET chuẩn với 3 bước lặp vòng hai chiều (Bidirectional transitions).',
      'Đảm bảo ký hiệu bước khởi tạo là ô vuông lồng đôi (Step 1).',
      'Ghi rõ tên các biến tác động: Q1.0 (COLD), Q1.1 (NORMAL), Q1.2 (HOT).',
      'Ghi rõ các hàm chuyển tiếp: T >= 15.0, T < 15.0, T > 30.0, T <= 30.0.'
    ]
  },
  {
    id: 9,
    learningOutcome: 'L.O.5.3',
    title: 'Ladder Program for Temperature Alarm System',
    titleVi: 'Phát triển Chương trình Ladder cho Hệ thống Cảnh báo Nhiệt độ',
    summary: 'Lập trình logic Ladder sử dụng các khối so sánh CMP để điều khiển trực tiếp 3 ngõ ra số Q1.0, Q1.1, Q1.2 tương ứng với mô hình Task 8.',
    category: 'control',
    pdfPage: 4,
    evaluationItems: [
      { id: 'lad_10', label: 'Tại 10 °C input: Duy nhất Q1.0 = ON (COLD)', passed: true, expectedCondition: 'T=10 -> Only Q1.0=ON' },
      { id: 'lad_22', label: 'Tại 22 °C input: Duy nhất Q1.1 = ON (NORMAL)', passed: true, expectedCondition: 'T=22 -> Only Q1.1=ON' },
      { id: 'lad_35', label: 'Tại 35 °C input: Duy nhất Q1.2 = ON (HOT)', passed: true, expectedCondition: 'T=35 -> Only Q1.2=ON' },
    ],
    ladDescription: `Chương trình Ladder gồm 3 Networks độc lập và loại trừ lẫn nhau:

Network 8: Đèn báo COLD (Q1.0) khi T < 15.0 °C
|--[ CMP < ]------------------------------------------( "Q_COLD" )--|
|   IN1: "Temperature"                                   %Q1.0      |
|   IN2: 15.0                                                       |

Network 9: Đèn báo NORMAL (Q1.1) khi 15.0 °C <= T <= 30.0 °C
|--[ CMP >= ]---------------------[ CMP <= ]----------( "Q_NORMAL" )-|
|   IN1: "Temperature"             IN1: "Temperature"     %Q1.1      |
|   IN2: 15.0                      IN2: 30.0                         |
(Hoặc dùng khối IN_RANGE: MIN=15.0, VAL="Temperature", MAX=30.0)

Network 10: Đèn báo HOT (Q1.2) khi T > 30.0 °C
|--[ CMP > ]------------------------------------------( "Q_HOT" )---|
|   IN1: "Temperature"                                   %Q1.2      |
|   IN2: 30.0                                                       |`,
    sclCode: `// ==========================================
// ĐIỀU KHIỂN ĐÈN BÁO 3 VÙNG NHIỆT ĐỘ BẰNG SCL
// ==========================================

// 1. Vùng COLD: T < 15.0 °C
"Q_COLD" := ("Temperature" < 15.0);

// 2. Vùng NORMAL: 15.0 °C <= T <= 30.0 °C
"Q_NORMAL" := ("Temperature" >= 15.0) AND ("Temperature" <= 30.0);

// 3. Vùng HOT: T > 30.0 °C
"Q_HOT" := ("Temperature" > 30.0);`,
    explanationVi: `1. PHÂN TÍCH THUẬT TOÁN LADDER:
- Để hiện thực hóa SFC từ Task 8 sang Ladder, phương pháp tối ưu và nhanh nhất cho bài toán phân vùng trạng thái tĩnh (Combinational state classification) là dùng trực tiếp các khối so sánh số thực (Real Comparators).
- Network 1 (COLD): Khối lệnh CMP < kiểm tra nếu Temperature < 15.0 thì tiếp điểm đóng và cấp điện cho cuộn dây ngõ ra %Q1.0.
- Network 2 (NORMAL): Dùng 2 khối so sánh mắc nối tiếp (tương đương hàm AND logic): Temperature >= 15.0 VÀ Temperature <= 30.0. Cả 2 điều kiện cùng thỏa mãn thì mới cấp điện cho cuộn %Q1.1.
- Network 3 (HOT): Khối lệnh CMP > kiểm tra nếu Temperature > 30.0 thì cấp điện cho cuộn %Q1.2.

2. ĐẢM BẢO TÍNH ĐỘC QUYỀN (MUTUAL EXCLUSIVITY):
- Để không bao giờ có 2 đèn cùng sáng tại điểm ranh giới 15.0 °C và 30.0 °C:
  + Tại đúng 15.0 °C: COLD tắt (vì 15.0 < 15.0 là False), NORMAL bật (vì 15.0 ≥ 15.0 là True).
  + Tại đúng 30.0 °C: NORMAL bật (vì 30.0 ≤ 30.0 là True), HOT tắt (vì 30.0 > 30.0 là False).
- Như vậy tại mọi giá trị nhiệt độ bất kỳ, luôn luôn chỉ có đúng một ngõ ra ở mức 1 (ON), các ngõ ra còn lại chắc chắn ở mức 0 (OFF).

3. ĐỐI CHIẾU VỚI TIÊU CHÍ ĐÁNH GIÁ CỦA LAB:
- Kiểm tra với 10 °C: Chỉ Q1.0 = 1, Q1.1 = 0, Q1.2 = 0 → ĐẠT.
- Kiểm tra với 22 °C: Chỉ Q1.1 = 1, Q1.0 = 0, Q1.2 = 0 → ĐẠT.
- Kiểm tra với 35 °C: Chỉ Q1.2 = 1, Q1.0 = 0, Q1.1 = 0 → ĐẠT.`,
    tiaPortalSteps: [
      'Gán địa chỉ PLC tags: Q_COLD (%Q1.0), Q_NORMAL (%Q1.1), Q_HOT (%Q1.2).',
      'Trong OB1 -> Thêm Network mới -> Kéo khối CMP < từ thư viện Comparator operations.',
      'Đặt kiểu dữ liệu là REAL, IN1 = "Temperature", IN2 = 15.0, gán cuộn dây "Q_COLD".',
      'Thêm Network tiếp theo -> Mắc nối tiếp CMP >= 15.0 và CMP <= 30.0, gán cuộn "Q_NORMAL".',
      'Thêm Network thứ 3 -> CMP > 30.0, gán cuộn "Q_HOT".',
      'Tải xuống PLC và kiểm tra trạng thái các đèn LED Q1.0, Q1.1, Q1.2 trên vỏ CPU.'
    ]
  },
  {
    id: 10,
    learningOutcome: 'L.O.4.4',
    title: 'Shock Monitoring (Rate of Change)',
    titleVi: 'Giám sát Sốc / Rung Chấn Dựa trên Tốc độ Biến thiên (Rate of Change - RoC)',
    summary: 'Tính toán đạo hàm tín hiệu theo công thức RoC = (Current - Previous) / Ts với chu kỳ lấy mẫu Ts = 10 ms (OB30 Cyclic Interrupt). Kích hoạt ShockAlm nếu |RoC| > 30 %/s.',
    category: 'derivative',
    pdfPage: 4,
    evaluationItems: [
      { id: 'rapid_rot', label: 'Xoay nhanh núm biến trở: ShockAlm = ON', passed: true, expectedCondition: '|RoC| > 30 %/s -> ShockAlm=ON' },
      { id: 'slow_rot', label: 'Xoay chậm núm biến trở: ShockAlm = OFF', passed: true, expectedCondition: '|RoC| <= 30 %/s -> ShockAlm=OFF' },
      { id: 'ts_recalc', label: 'Đổi chu kỳ lấy mẫu (ví dụ Ts = 20 ms): Phải tính toán lại Ts trong công thức RoC', passed: true, expectedCondition: 'Ts in formula matches OB30 cycle time' },
    ],
    ladDescription: `THỰC THI TRONG KHỐI NGẮT CHU KỲ OB30 (CYCLIC INTERRUPT - 10 MS):

Bước 1: Tạo khối Organization Block OB30:
- Add new block -> Organization block (OB) -> Chọn "Cyclic interrupt"
- Đặt Execution cycle = 10 ms (hoặc 10000 µs).

Nội dung các Network trong OB30:
Network 1: Tính toán tốc độ biến thiên RoC
- Đọc giá trị phần trăm hiện tại: Current_Val := "AI0_PCT" * 100.0;
- Lệnh SUB: Diff = Current_Val - "Prev_Val"
- Lệnh DIV: "RoC" = Diff / 0.010 (Vì Ts = 10ms = 0.010s)

Network 2: Lấy giá trị tuyệt đối và so sánh với ngưỡng 30 %/s
- Lệnh ABS: Abs_RoC = ABS("RoC")
- Lệnh CMP >: Abs_RoC > 30.0 -> Kích cuộn dây "ShockAlm" (%Q0.1)

Network 3: Cập nhật giá trị quá khứ (Previous Value)
- Lệnh MOVE: Current_Val -> "Prev_Val" (CỰC KỲ QUAN TRỌNG: Phải đặt ở Network cuối cùng của chu kỳ!).`,
    sclCode: `// ============================================================================
// KHỐI OB30: CYCLIC INTERRUPT (Chu kỳ ngắt cố định Ts = 10 ms = 0.010 giây)
// ============================================================================

VAR_TEMP
    Current_Val : Real;
    Abs_RoC : Real;
    Ts : Real; // Thời gian lấy mẫu (giây)
END_VAR

// 1. Xác định chu kỳ lấy mẫu (Ts = 10ms -> 0.010s; nếu đổi sang 20ms -> 0.020s)
Ts := 0.010; 

// 2. Lấy giá trị phần trăm hiện tại của kênh analog
Current_Val := "AI0_PCT" * 100.0;

// 3. Tính tốc độ biến thiên tín hiệu (Rate of Change) theo công thức đề bài:
// RoC = (Current - Previous) / Ts
"RoC" := (Current_Val - "Prev_Val") / Ts;

// 4. Lấy giá trị tuyệt đối để phát hiện cả giật tăng và giật giảm
Abs_RoC := ABS("RoC");

// 5. Kiểm tra vượt ngưỡng 30 %/s
IF Abs_RoC > 30.0 THEN
    "ShockAlm" := TRUE;   // Bật báo động khi có rung lắc / xoay giật mạnh
ELSE
    "ShockAlm" := FALSE;  // Tắt khi xoay êm hoặc đứng yên
END_IF;

// 6. CẬP NHẬT GIÁ TRỊ QUÁ KHỨ CHO CHU KỲ KẾ TIẾP:
// Bước này bắt buộc phải thực hiện ở cuối chu kỳ để làm mốc tính cho 10ms sau
"Prev_Val" := Current_Val;`,
    explanationVi: `1. NGUYÊN LÝ TOÁN HỌC CỦA TỐC ĐỘ BIẾN THIÊN (RATE OF CHANGE - ĐẠO HÀM):
- Tốc độ biến thiên (RoC) chính là đạo hàm bậc nhất của tín hiệu analog theo thời gian:
FORMULA: RoC(t) ≈ {d y(t)} / {d t} ≈ {y[k] - y[k - 1]} / {Ts}
- Trong đó:
  + y[k]: Giá trị tín hiệu ở chu kỳ hiện tại (Current_Val).
  + y[k - 1]: Giá trị tín hiệu ở chu kỳ lấy mẫu liền trước (Prev_Val).
  + Ts: Chu kỳ lấy mẫu danh định (Sampling period). Khi Ts = 10 ms, ta có Ts = 0.010 s.
- Thứ nguyên của RoC là %/s (phần trăm trên một giây).
- Đề bài sử dụng giá trị tuyệt đối |RoC| > 30.0 %/s vì hiện tượng sốc hay rung động va chạm có thể làm tín hiệu vọt lên đột ngột (đạo hàm dương) hoặc sụt áp đột ngột (đạo hàm âm).

2. TẠI SAO BẮT BUỘC DÙNG KHỐI NGẮT CHU KỲ OB30 (CYCLIC INTERRUPT)?
- OB1 (Main program cycle) là vòng quét lặp tự do (Free-running cycle). Thời gian quét của OB1 phụ thuộc vào số lượng lệnh đang chạy, tác vụ truyền thông HMI/SCADA, và có thể biến động từ 1 ms đến 5–10 ms (gọi là hiện tượng Scan Time Jitter).
- Nếu tính toán RoC = (Current - Previous) / 0.010 trong OB1, trong khi thực tế chu kỳ quét bị kéo dài lên 20 ms, thì mẫu số 0.010 sẽ hoàn toàn sai lệch, dẫn tới đạo hàm tính ra bị nhân đôi hoặc méo mó.
- Ngược lại, OB30 là khối ngắt phần cứng (Hardware Timer Interrupt) với độ chính xác cỡ micro-giây. Cứ đúng 10.0 ms, CPU ngắt chương trình OB1 để ưu tiên thực thi OB30, đảm bảo Ts luôn là một hằng số toán học lý tưởng!

3. THAY ĐỔI CHU KỲ LẤY MẪU (VÍ DỤ TĂNG LÊN Ts = 20 ms):
- Khi tăng gấp đôi chu kỳ lấy mẫu từ 10 ms lên 20 ms:
  + Trong cấu hình phần cứng CPU / thuộc tính OB30: Sửa Execution cycle = 20 ms.
  + Trong công thức tính toán: Phải chia cho 0.020 thay vì 0.010.
FORMULA: RoC (khi Ts = 20 ms) = {Current - Previous} / {0.020}
  + Nếu không cập nhật Ts trong công thức, kết quả RoC sẽ bị sai lệch một nửa (50%), dẫn đến hệ thống không cảnh báo đúng ngưỡng.

4. KIỂM CHỨNG THỰC TẾ:
- Xoay núm biến trở thật chậm: Current - Previous ≈ 0.05% trong 10 ms:
FORMULA: RoC = {0.05} / {0.010} = 5.0 %/s < 30 %/s → ShockAlm = 0
- Dùng tay xoay thật nhanh hoặc gõ/lắc biến trở: Current - Previous = 2.0% chỉ trong 10 ms:
FORMULA: RoC = {2.0} / {0.010} = 200.0 %/s > 30 %/s → ShockAlm = 1`,
    tiaPortalSteps: [
      'Nhấp chuột phải vào "Program blocks" -> "Add new block" -> Chọn Organization block (OB) -> "Cyclic interrupt".',
      'Đặt tên là OB30, cấu hình thời gian ngắt "Cyclic time" = 10 ms (hoặc 20 ms nếu thí nghiệm mở rộng).',
      'Khai báo các biến nhớ: RoC (%MD32, Real), Prev_Val (%MD36, Real), ShockAlm (%Q0.1, Bool).',
      'Viết mã SCL hoặc Ladder rungs tính toán theo công thức RoC = (Current - Prev) / 0.010.',
      'Sử dụng hàm ABS để lấy độ lớn tuyệt đối và so sánh với 30.0.',
      'Cuối chu kỳ gán Prev_Val := Current_Val.',
      'Download chương trình xuống CPU và dùng tay xoay vặn núm thật nhanh để kích hoạt đèn ShockAlm.',
      'Để xuất file sang Excel/Text: Sử dụng tính năng Trace trong TIA Portal hoặc khối lệnh DataLogCreate/DataLogWrite lưu file .CSV trực tiếp lên Web Server của S7-1200.'
    ]
  }
];
