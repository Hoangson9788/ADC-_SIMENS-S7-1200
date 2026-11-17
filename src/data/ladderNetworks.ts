import { TaskLadderProgram } from '../types';

export const TASK_LADDER_PROGRAMS: Record<number, TaskLadderProgram> = {
  1: {
    taskId: 1,
    obBlock: 'OB1 [Main] · Kiểm tra & Giám sát phần cứng AI0',
    networks: [
      {
        id: 't1-n1',
        title: 'Network 1: Giám sát dải hợp lệ phần cứng AI0 (%IW64) bằng IN_RANGE',
        comment: 'Kiểm tra điện áp 0–10V hợp lệ (0 .. 27648) và phát hiện lỗi tràn Overflow (>= 32767) khi đấu nhầm áp cao.',
        rungs: [
          [
            {
              kind: 'compare',
              op: 'IN_RANGE',
              dataType: 'Int',
              in1: '0',
              in2: '%IW64',
              in3: '27648',
              liveReadout: (s) => `${s.rawIW64}`,
              active: (s) => s.rawIW64 >= 0 && s.rawIW64 <= 27648,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'AI0_Hardware_OK',
              address: '%M0.0',
              active: (s) => s.rawIW64 >= 0 && s.rawIW64 <= 27648,
            },
          ],
          [
            {
              kind: 'compare',
              op: '>=',
              dataType: 'Int',
              in1: '%IW64',
              in2: '32767',
              liveReadout: (s) => `${s.rawIW64}`,
              active: (s) => s.rawIW64 >= 32767,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'AI0_Overflow_Fault',
              address: '%M0.1',
              active: (s) => s.rawIW64 >= 32767,
            },
          ],
        ],
      },
      {
        id: 't1-n2',
        title: 'Network 2: Đọc tín hiệu kiểm tra kênh AI0 khi xoay biến trở',
        comment: 'Đưa giá trị %IW64 vào vùng nhớ %MW10 để theo dõi trực tiếp trên Watch Table khi xoay núm.',
        rungs: [
          [
            {
              kind: 'contact',
              variant: 'NO',
              tag: 'AlwaysTRUE',
              address: '%M1.2',
              active: () => true,
            },
            {
              kind: 'box',
              instruction: 'MOVE',
              subLabel: 'Int',
              inputs: [
                { pin: 'IN', label: '%IW64 (AI0)', liveValue: (s) => `${s.rawIW64}` },
              ],
              outputs: [
                { pin: 'OUT1', label: 'AI0_RAW (%MW10)', liveValue: (s) => `${s.rawIW64}` },
              ],
            },
          ],
        ],
      },
    ],
  },

  2: {
    taskId: 2,
    obBlock: 'OB1 [Main] · Kiểm chứng 2 kênh AI tích hợp & Mốc 5V',
    networks: [
      {
        id: 't2-n1',
        title: 'Network 1: Đọc song song 2 kênh Analog tích hợp AI0 (%IW64) và AI1 (%IW66)',
        comment: 'Minh họa CPU S7-1200 có 2 kênh AI onboard dùng chung thanh ghi địa chỉ %IW64 và %IW66.',
        rungs: [
          [
            {
              kind: 'contact',
              variant: 'NO',
              tag: 'AlwaysTRUE',
              address: '%M1.2',
              active: () => true,
            },
            {
              kind: 'branch',
              branches: [
                [
                  {
                    kind: 'box',
                    instruction: 'MOVE',
                    subLabel: 'AI0',
                    inputs: [{ pin: 'IN', label: '%IW64', liveValue: (s) => `${s.rawIW64}` }],
                    outputs: [{ pin: 'OUT1', label: 'AI0_RAW (%MW10)', liveValue: (s) => `${s.rawIW64}` }],
                  },
                ],
                [
                  {
                    kind: 'box',
                    instruction: 'MOVE',
                    subLabel: 'AI1',
                    inputs: [{ pin: 'IN', label: '%IW66', liveValue: () => '0' }],
                    outputs: [{ pin: 'OUT1', label: 'AI1_RAW (%MW12)', liveValue: () => '0' }],
                  },
                ],
              ],
            },
          ],
        ],
      },
      {
        id: 't2-n2',
        title: 'Network 2: Kiểm chứng điểm giữa dải đo 5V (50% = 13824 ± 300 counts)',
        comment: 'Kích bit kiểm tra khi tín hiệu đầu vào nằm quanh ngưỡng 5.0 V (50% dải đo 0–10V).',
        rungs: [
          [
            {
              kind: 'compare',
              op: 'IN_RANGE',
              dataType: 'Int',
              in1: '13524',
              in2: 'AI0_RAW',
              in3: '14124',
              liveReadout: (s) => `${s.rawIW64}`,
              active: (s) => s.rawIW64 >= 13524 && s.rawIW64 <= 14124,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'AI0_At_50Pct_5V',
              address: '%M0.2',
              active: (s) => s.rawIW64 >= 13524 && s.rawIW64 <= 14124,
            },
          ],
        ],
      },
    ],
  },

  3: {
    taskId: 3,
    obBlock: 'OB1 [Main] · Đọc giá trị thô %IW64',
    networks: [
      {
        id: 't3-n1',
        title: 'Network 1: Sao chép dữ liệu thô từ thanh ghi phần cứng %IW64 sang AI0_RAW',
        comment: 'Tại 0V -> 0; tại 5V -> ~13824; tại 10V -> 27648 (kiểu số nguyên có dấu Int 16-bit).',
        rungs: [
          [
            {
              kind: 'box',
              instruction: 'MOVE',
              subLabel: 'Int -> Int',
              inputs: [
                { pin: 'IN', label: '%IW64 ("AI0")', liveValue: (s) => `${s.rawIW64}` },
              ],
              outputs: [
                { pin: 'OUT1', label: '"AI0_RAW" (%MW10)', liveValue: (s) => `${s.rawIW64}` },
              ],
            },
          ],
        ],
      },
    ],
  },

  4: {
    taskId: 4,
    obBlock: 'OB1 [Main] · Chuẩn hóa tín hiệu NORM_X',
    networks: [
      {
        id: 't4-n1',
        title: 'Network 1: Đọc giá trị thô %IW64 sang AI0_RAW (%MW10)',
        comment: 'Đọc dữ liệu đầu vào trước khi đưa vào khối chuẩn hóa.',
        rungs: [
          [
            {
              kind: 'box',
              instruction: 'MOVE',
              subLabel: 'Int',
              inputs: [{ pin: 'IN', label: '%IW64', liveValue: (s) => `${s.rawIW64}` }],
              outputs: [{ pin: 'OUT1', label: '"AI0_RAW" (%MW10)', liveValue: (s) => `${s.rawIW64}` }],
            },
          ],
        ],
      },
      {
        id: 't4-n2',
        title: 'Network 2: Chuẩn hóa dải INT (0..27648) sang REAL (0.0..1.0) bằng NORM_X',
        comment: 'Công thức: OUT = (VALUE - MIN) / (MAX - MIN). Tại 5V: AI0_PCT = 0.500.',
        rungs: [
          [
            {
              kind: 'box',
              instruction: 'NORM_X',
              subLabel: 'INT to REAL',
              inputs: [
                { pin: 'MIN', label: '0' },
                { pin: 'VALUE', label: '"AI0_RAW" (%MW10)', liveValue: (s) => `${s.rawIW64}` },
                { pin: 'MAX', label: '27648' },
              ],
              outputs: [
                { pin: 'OUT', label: '"AI0_PCT" (%MD12)', liveValue: (s) => s.normPct.toFixed(4) },
              ],
            },
          ],
        ],
      },
    ],
  },

  5: {
    taskId: 5,
    obBlock: 'OB1 [Main] · Quy đổi điện áp thực tế SCALE_X',
    networks: [
      {
        id: 't5-n1',
        title: 'Network 1: Chuẩn hóa từ %IW64 sang AI0_PCT (0.0..1.0)',
        comment: 'Tín hiệu chuẩn hóa làm đầu vào cho SCALE_X.',
        rungs: [
          [
            {
              kind: 'box',
              instruction: 'NORM_X',
              subLabel: 'INT to REAL',
              inputs: [
                { pin: 'MIN', label: '0' },
                { pin: 'VALUE', label: '%IW64', liveValue: (s) => `${s.rawIW64}` },
                { pin: 'MAX', label: '27648' },
              ],
              outputs: [
                { pin: 'OUT', label: '"AI0_PCT" (%MD12)', liveValue: (s) => s.normPct.toFixed(4) },
              ],
            },
          ],
        ],
      },
      {
        id: 't5-n2',
        title: 'Network 2: Quy đổi sang điện áp 0.0 .. 10.0 V bằng SCALE_X',
        comment: 'Kiểm tra tại 2V, 6V, 9V đảm bảo sai số <= ±0.1 V so với đồng hồ VOM.',
        rungs: [
          [
            {
              kind: 'box',
              instruction: 'SCALE_X',
              subLabel: 'REAL to REAL',
              inputs: [
                { pin: 'MIN', label: '0.0' },
                { pin: 'VALUE', label: '"AI0_PCT" (%MD12)', liveValue: (s) => s.normPct.toFixed(3) },
                { pin: 'MAX', label: '10.0' },
              ],
              outputs: [
                { pin: 'OUT', label: '"AI0_V" (%MD16)', liveValue: (s) => `${s.scaleV.toFixed(2)} V` },
              ],
            },
          ],
        ],
      },
    ],
  },

  6: {
    taskId: 6,
    obBlock: 'OB1 [Main] · Cảnh báo phòng sạch Hysteresis dùng chốt SR',
    networks: [
      {
        id: 't6-n1',
        title: 'Network 1: Quy đổi tín hiệu sang thang đo kỹ thuật 0.0 .. 100.0 %',
        comment: 'Ngõ ra AI0_ENG_FILT (%MD20) dùng cho cả hai bộ so sánh cảnh báo cao/thấp.',
        rungs: [
          [
            {
              kind: 'box',
              instruction: 'SCALE_X',
              subLabel: 'REAL to REAL',
              inputs: [
                { pin: 'MIN', label: '0.0' },
                { pin: 'VALUE', label: '"AI0_PCT" (%MD12)', liveValue: (s) => s.normPct.toFixed(3) },
                { pin: 'MAX', label: '100.0' },
              ],
              outputs: [
                { pin: 'OUT', label: '"AI0_ENG_FILT" (%MD20)', liveValue: (s) => `${s.engFilt.toFixed(1)} %` },
              ],
            },
          ],
        ],
      },
      {
        id: 't6-n2',
        title: 'Network 2: Chốt cảnh báo mức cao HiAlm (Set > 80.0%, Reset < 78.0%)',
        comment: 'Dải trễ 2% [78% .. 80%] giữ nguyên trạng thái để chống nhấp nháy đèn báo.',
        rungs: [
          [
            {
              kind: 'compare',
              op: '>',
              dataType: 'Real',
              in1: 'AI0_ENG_FILT',
              in2: '80.0',
              liveReadout: (s) => `${s.engFilt.toFixed(1)}%`,
              active: (s) => s.engFilt > 80.0,
            },
            {
              kind: 'box',
              instruction: 'SR',
              subLabel: 'Flip-Flop',
              inputs: [
                { pin: 'S1', label: 'Set (> 80%)', liveValue: (s) => (s.engFilt > 80.0 ? '1' : '0') },
              ],
              auxInputs: [
                {
                  pin: 'R',
                  elements: [
                    {
                      kind: 'compare',
                      op: '<',
                      dataType: 'Real',
                      in1: 'AI0_ENG_FILT',
                      in2: '78.0',
                      liveReadout: (s) => `${s.engFilt.toFixed(1)}%`,
                      active: (s) => s.engFilt < 78.0,
                    },
                  ],
                },
              ],
              outputs: [
                { pin: 'Q', label: '"HiAlm" (%Q0.2)', liveValue: (s) => (s.hiAlm ? 'TRUE' : 'FALSE') },
              ],
              active: (s) => s.hiAlm,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'HiAlm',
              address: '%Q0.2',
              active: (s) => s.hiAlm,
            },
          ],
        ],
      },
      {
        id: 't6-n3',
        title: 'Network 3: Chốt cảnh báo mức thấp LoAlm (Set < 20.0%, Reset > 22.0%)',
        comment: 'Bật cảnh báo khi tụt dưới 20% và chỉ tắt khi phục hồi vượt 22%.',
        rungs: [
          [
            {
              kind: 'compare',
              op: '<',
              dataType: 'Real',
              in1: 'AI0_ENG_FILT',
              in2: '20.0',
              liveReadout: (s) => `${s.engFilt.toFixed(1)}%`,
              active: (s) => s.engFilt < 20.0,
            },
            {
              kind: 'box',
              instruction: 'SR',
              subLabel: 'Flip-Flop',
              inputs: [
                { pin: 'S1', label: 'Set (< 20%)', liveValue: (s) => (s.engFilt < 20.0 ? '1' : '0') },
              ],
              auxInputs: [
                {
                  pin: 'R',
                  elements: [
                    {
                      kind: 'compare',
                      op: '>',
                      dataType: 'Real',
                      in1: 'AI0_ENG_FILT',
                      in2: '22.0',
                      liveReadout: (s) => `${s.engFilt.toFixed(1)}%`,
                      active: (s) => s.engFilt > 22.0,
                    },
                  ],
                },
              ],
              outputs: [
                { pin: 'Q', label: '"LoAlm" (%Q0.3)', liveValue: (s) => (s.loAlm ? 'TRUE' : 'FALSE') },
              ],
              active: (s) => s.loAlm,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'LoAlm',
              address: '%Q0.3',
              active: (s) => s.loAlm,
            },
          ],
        ],
      },
    ],
  },

  7: {
    taskId: 7,
    obBlock: 'OB1 [Main] · Điều khiển Bơm cấp nước Bồn (30% - 70%)',
    networks: [
      {
        id: 't7-n1',
        title: 'Network 1 (Cách 1 - Khối SR): BẬT bơm < 30%, TẮT bơm > 70%',
        comment: 'Dùng chốt SR đảm bảo bơm giữ nguyên trạng thái trong vùng trễ 30% .. 70%.',
        rungs: [
          [
            {
              kind: 'compare',
              op: '<',
              dataType: 'Real',
              in1: 'Tank_Level_Pct',
              in2: '30.0',
              liveReadout: (s) => `${s.tankLevel.toFixed(1)}%`,
              active: (s) => s.tankLevel < 30.0,
            },
            {
              kind: 'box',
              instruction: 'SR',
              subLabel: 'Tank Pump',
              inputs: [
                { pin: 'S1', label: 'Bật (< 30%)', liveValue: (s) => (s.tankLevel < 30.0 ? '1' : '0') },
              ],
              auxInputs: [
                {
                  pin: 'R',
                  elements: [
                    {
                      kind: 'compare',
                      op: '>',
                      dataType: 'Real',
                      in1: 'Tank_Level_Pct',
                      in2: '70.0',
                      liveReadout: (s) => `${s.tankLevel.toFixed(1)}%`,
                      active: (s) => s.tankLevel > 70.0,
                    },
                  ],
                },
              ],
              outputs: [
                { pin: 'Q', label: '"Pump_CMD" (%Q0.0)', liveValue: (s) => (s.pumpCmd ? 'ON' : 'OFF') },
              ],
              active: (s) => s.pumpCmd,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'Pump_CMD',
              address: '%Q0.0',
              active: (s) => s.pumpCmd,
            },
          ],
        ],
      },
      {
        id: 't7-n2',
        title: 'Network 2 (Cách 2 - Mạch tự giữ kinh điển): Seal-in Latch Circuit',
        comment: 'Biểu diễn tương đương bằng tiếp điểm tự giữ song song với điều kiện mở bơm, nối tiếp điều kiện cắt <= 70%.',
        rungs: [
          [
            {
              kind: 'branch',
              branches: [
                [
                  {
                    kind: 'compare',
                    op: '<',
                    dataType: 'Real',
                    in1: 'Tank_Level_Pct',
                    in2: '30.0',
                    liveReadout: (s) => `${s.tankLevel.toFixed(1)}%`,
                    active: (s) => s.tankLevel < 30.0,
                  },
                ],
                [
                  {
                    kind: 'contact',
                    variant: 'NO',
                    tag: 'Pump_CMD',
                    address: '%Q0.0',
                    active: (s) => s.pumpCmd,
                  },
                ],
              ],
            },
            {
              kind: 'compare',
              op: '<=',
              dataType: 'Real',
              in1: 'Tank_Level_Pct',
              in2: '70.0',
              liveReadout: (s) => `${s.tankLevel.toFixed(1)}%`,
              active: (s) => s.tankLevel <= 70.0,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'Pump_CMD',
              address: '%Q0.0',
              active: (s) => s.pumpCmd,
            },
          ],
        ],
      },
    ],
  },

  8: {
    taskId: 8,
    obBlock: 'OB1 [Main] · Hiện thực hóa GRAFCET 3 bước bằng Ladder (Set/Reset Step Bits)',
    networks: [
      {
        id: 't8-n1',
        title: 'Network 1: Bước 1 (Step_1_COLD) & Chuyển đổi sang Bước 2 (NORMAL)',
        comment: 'Khởi tạo Step 1 khi FirstScan; nếu đang ở Step 1 và Temperature >= 15.0°C thì Set Step 2 và Reset Step 1.',
        rungs: [
          [
            {
              kind: 'contact',
              variant: 'NO',
              tag: 'Step_1_COLD',
              address: '%M10.0',
              active: (s) => s.qCold,
            },
            {
              kind: 'compare',
              op: '>=',
              dataType: 'Real',
              in1: 'Temperature',
              in2: '15.0',
              liveReadout: (s) => `${s.temperature.toFixed(1)}°C`,
              active: (s) => s.temperature >= 15.0,
            },
            {
              kind: 'branch',
              branches: [
                [
                  {
                    kind: 'coil',
                    variant: 'SET',
                    tag: 'Step_2_NORMAL',
                    address: '%M10.1',
                    active: (s) => s.qNormal,
                  },
                ],
                [
                  {
                    kind: 'coil',
                    variant: 'RESET',
                    tag: 'Step_1_COLD',
                    address: '%M10.0',
                    active: (s) => s.qCold && s.temperature >= 15.0,
                  },
                ],
              ],
            },
          ],
        ],
      },
      {
        id: 't8-n2',
        title: 'Network 2: Chuyển tiếp 2 chiều từ Bước 2 (NORMAL) <-> Bước 1 / Bước 3',
        comment: 'Nhánh trên: T < 15.0°C quay về Step 1. Nhánh dưới: T > 30.0°C tiến lên Step 3.',
        rungs: [
          [
            {
              kind: 'contact',
              variant: 'NO',
              tag: 'Step_2_NORMAL',
              address: '%M10.1',
              active: (s) => s.qNormal,
            },
            {
              kind: 'branch',
              branches: [
                [
                  {
                    kind: 'compare',
                    op: '<',
                    dataType: 'Real',
                    in1: 'Temperature',
                    in2: '15.0',
                    liveReadout: (s) => `${s.temperature.toFixed(1)}°C`,
                    active: (s) => s.temperature < 15.0,
                  },
                  {
                    kind: 'coil',
                    variant: 'SET',
                    tag: 'Step_1_COLD',
                    address: '%M10.0',
                    active: (s) => s.qCold,
                  },
                ],
                [
                  {
                    kind: 'compare',
                    op: '>',
                    dataType: 'Real',
                    in1: 'Temperature',
                    in2: '30.0',
                    liveReadout: (s) => `${s.temperature.toFixed(1)}°C`,
                    active: (s) => s.temperature > 30.0,
                  },
                  {
                    kind: 'coil',
                    variant: 'SET',
                    tag: 'Step_3_HOT',
                    address: '%M10.2',
                    active: (s) => s.qHot,
                  },
                ],
              ],
            },
          ],
        ],
      },
      {
        id: 't8-n3',
        title: 'Network 3: Khối Action — Xuất ngõ ra đèn Q1.0, Q1.1, Q1.2 theo từng Step',
        comment: 'Đảm bảo tại mỗi thời điểm chỉ có duy nhất 1 bước tích cực và 1 đèn sáng.',
        rungs: [
          [
            {
              kind: 'contact',
              variant: 'NO',
              tag: 'Step_1_COLD',
              address: '%M10.0',
              active: (s) => s.qCold,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'Q_COLD',
              address: '%Q1.0',
              active: (s) => s.qCold,
            },
          ],
          [
            {
              kind: 'contact',
              variant: 'NO',
              tag: 'Step_2_NORMAL',
              address: '%M10.1',
              active: (s) => s.qNormal,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'Q_NORMAL',
              address: '%Q1.1',
              active: (s) => s.qNormal,
            },
          ],
          [
            {
              kind: 'contact',
              variant: 'NO',
              tag: 'Step_3_HOT',
              address: '%M10.2',
              active: (s) => s.qHot,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'Q_HOT',
              address: '%Q1.2',
              active: (s) => s.qHot,
            },
          ],
        ],
      },
    ],
  },

  9: {
    taskId: 9,
    obBlock: 'OB1 [Main] · Chương trình Ladder Nhiệt độ 3 vùng (CMP)',
    networks: [
      {
        id: 't9-n1',
        title: 'Network 1: Vùng COLD — Bật Q_COLD (%Q1.0) khi T < 15.0 °C',
        comment: 'Kiểm tra ở 10 °C: chỉ Q1.0 sáng.',
        rungs: [
          [
            {
              kind: 'compare',
              op: '<',
              dataType: 'Real',
              in1: 'Temperature',
              in2: '15.0',
              liveReadout: (s) => `${s.temperature.toFixed(1)}°C`,
              active: (s) => s.temperature < 15.0,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'Q_COLD',
              address: '%Q1.0',
              active: (s) => s.qCold,
            },
          ],
        ],
      },
      {
        id: 't9-n2',
        title: 'Network 2: Vùng NORMAL — Bật Q_NORMAL (%Q1.1) khi 15.0 <= T <= 30.0 °C',
        comment: 'Mắc nối tiếp 2 khối so sánh CMP >= và CMP <=. Kiểm tra ở 22 °C: chỉ Q1.1 sáng.',
        rungs: [
          [
            {
              kind: 'compare',
              op: '>=',
              dataType: 'Real',
              in1: 'Temperature',
              in2: '15.0',
              liveReadout: (s) => `${s.temperature.toFixed(1)}°C`,
              active: (s) => s.temperature >= 15.0,
            },
            {
              kind: 'compare',
              op: '<=',
              dataType: 'Real',
              in1: 'Temperature',
              in2: '30.0',
              liveReadout: (s) => `${s.temperature.toFixed(1)}°C`,
              active: (s) => s.temperature <= 30.0,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'Q_NORMAL',
              address: '%Q1.1',
              active: (s) => s.qNormal,
            },
          ],
        ],
      },
      {
        id: 't9-n3',
        title: 'Network 3: Vùng HOT — Bật Q_HOT (%Q1.2) khi T > 30.0 °C',
        comment: 'Kiểm tra ở 35 °C: chỉ Q1.2 sáng.',
        rungs: [
          [
            {
              kind: 'compare',
              op: '>',
              dataType: 'Real',
              in1: 'Temperature',
              in2: '30.0',
              liveReadout: (s) => `${s.temperature.toFixed(1)}°C`,
              active: (s) => s.temperature > 30.0,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'Q_HOT',
              address: '%Q1.2',
              active: (s) => s.qHot,
            },
          ],
        ],
      },
    ],
  },

  10: {
    taskId: 10,
    obBlock: 'OB30 [Cyclic Interrupt] · Chu kỳ ngắt Ts = 10 ms / 20 ms',
    networks: [
      {
        id: 't10-n1',
        title: 'Network 1: Tính phần trăm hiện tại & hiệu số (Current_Val - Prev_Val)',
        comment: 'Chuyển AI0_PCT sang 0..100% bằng MUL, sau đó trừ cho giá trị chu kỳ ngắt trước bằng SUB.',
        rungs: [
          [
            {
              kind: 'box',
              instruction: 'MUL',
              subLabel: 'Real',
              inputs: [
                { pin: 'IN1', label: '"AI0_PCT"', liveValue: (s) => s.normPct.toFixed(3) },
                { pin: 'IN2', label: '100.0' },
              ],
              outputs: [
                { pin: 'OUT', label: '#Current_Val', liveValue: (s) => `${s.engFilt.toFixed(1)}%` },
              ],
            },
            {
              kind: 'box',
              instruction: 'SUB',
              subLabel: 'Real',
              inputs: [
                { pin: 'IN1', label: '#Current_Val', liveValue: (s) => s.engFilt.toFixed(1) },
                { pin: 'IN2', label: '"Prev_Val" (%MD36)', liveValue: (s) => (s.engFilt - s.roc * (s.sampleTimeMs / 1000)).toFixed(1) },
              ],
              outputs: [
                { pin: 'OUT', label: '#Diff_Val', liveValue: (s) => (s.roc * (s.sampleTimeMs / 1000)).toFixed(2) },
              ],
            },
          ],
        ],
      },
      {
        id: 't10-n2',
        title: 'Network 2: Chia cho chu kỳ lấy mẫu Ts và lấy trị tuyệt đối ABS(RoC)',
        comment: 'Lưu ý: Khi đổi Cyclic Interrupt OB30 sang 20 ms thì mẫu số IN2 của khối DIV phải cập nhật thành 0.020.',
        rungs: [
          [
            {
              kind: 'box',
              instruction: 'DIV',
              subLabel: 'Real',
              inputs: [
                { pin: 'IN1', label: '#Diff_Val', liveValue: (s) => (s.roc * (s.sampleTimeMs / 1000)).toFixed(2) },
                { pin: 'IN2', label: 'Ts (s)', liveValue: (s) => (s.sampleTimeMs / 1000).toFixed(3) },
              ],
              outputs: [
                { pin: 'OUT', label: '"RoC" (%MD32)', liveValue: (s) => `${s.roc.toFixed(1)} %/s` },
              ],
            },
            {
              kind: 'box',
              instruction: 'ABS',
              subLabel: 'Real',
              inputs: [
                { pin: 'IN', label: '"RoC" (%MD32)', liveValue: (s) => s.roc.toFixed(1) },
              ],
              outputs: [
                { pin: 'OUT', label: '#Abs_RoC', liveValue: (s) => Math.abs(s.roc).toFixed(1) },
              ],
            },
          ],
        ],
      },
      {
        id: 't10-n3',
        title: 'Network 3: So sánh ngưỡng sốc |RoC| > 30.0 %/s -> Kích ShockAlm (%Q0.1)',
        comment: 'Xoay chậm |RoC| <= 30 -> ShockAlm = OFF; Xoay nhanh |RoC| > 30 -> ShockAlm = ON.',
        rungs: [
          [
            {
              kind: 'compare',
              op: '>',
              dataType: 'Real',
              in1: '#Abs_RoC',
              in2: '30.0',
              liveReadout: (s) => `${Math.abs(s.roc).toFixed(1)} %/s`,
              active: (s) => s.shockAlm,
            },
            {
              kind: 'coil',
              variant: 'OUT',
              tag: 'ShockAlm',
              address: '%Q0.1',
              active: (s) => s.shockAlm,
            },
          ],
        ],
      },
      {
        id: 't10-n4',
        title: 'Network 4: Cập nhật Prev_Val cho chu kỳ OB30 tiếp theo (Bắt buộc đặt cuối)',
        comment: 'Nếu đặt trước Network 1 sẽ làm Diff_Val luôn bằng 0 và mất đạo hàm.',
        rungs: [
          [
            {
              kind: 'box',
              instruction: 'MOVE',
              subLabel: 'Real',
              inputs: [
                { pin: 'IN', label: '#Current_Val', liveValue: (s) => s.engFilt.toFixed(1) },
              ],
              outputs: [
                { pin: 'OUT1', label: '"Prev_Val" (%MD36)', liveValue: (s) => s.engFilt.toFixed(1) },
              ],
            },
          ],
        ],
      },
    ],
  },
};
