import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Cpu,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Bell,
  Sliders,
  Waves,
  Flame,
  Snowflake,
  Sun,
  Activity,
  Zap,
  ChevronRight,
  Wrench,
  Table,
  ArrowLeftRight,
  Check
} from 'lucide-react';
import { rawCountsToVoltage } from '../utils/plcEngine';

export interface HMIAlarmEntry {
  id: number;
  tag: string;
  message: string;
  severity: 'HIGH' | 'LOW' | 'CRITICAL';
  timestamp: string;
  status: 'INCOMING' | 'ACKNOWLEDGED' | 'OUTGOING';
}

interface HMIPLCSimVisualizerProps {
  voltage: number;
  setVoltage: React.Dispatch<React.SetStateAction<number>>;
  rawIW64: number;
  normPct: number;
  scaleV: number;
  engFilt: number;
  hiAlm: boolean;
  loAlm: boolean;
  tankLevel: number;
  setTankLevel: React.Dispatch<React.SetStateAction<number>>;
  pumpCmd: boolean;
  temperature: number;
  setTemperature: React.Dispatch<React.SetStateAction<number>>;
  qCold: boolean;
  qNormal: boolean;
  qHot: boolean;
  roc: number;
  shockAlm: boolean;
  sampleTimeMs: number;
  setSampleTimeMs: (ms: number) => void;
  onFlickFast: () => void;
}

interface TrendPoint {
  engFilt: number;
  roc: number;
}

const CONNECTION_STEPS = [
  {
    step: 1,
    title: 'Thêm màn hình HMI & Kết nối mạng PROFINET',
    detail:
      'Trong TIA Portal -> Add new device -> HMI -> SIMATIC Basic Panel -> KTP700 Basic PN (6AV2 123-2GB03-0AX0). Mở "Devices & networks", kéo dây từ cổng PROFINET của HMI nối vào cổng PROFINET_1 của CPU S7-1200 để tạo mạng PN/IE_1.',
    highlight: 'IP CPU: 192.168.0.1 · IP HMI: 192.168.0.2',
  },
  {
    step: 2,
    title: 'Tạo HMI Connection trong mục Connections',
    detail:
      'Trong cây dự án của HMI -> Mở "Connections" -> Thêm kết nối mới "HMI_Connection_1". Chọn Communication driver = "SIMATIC S7 1200", Access point = "S7ONLINE", Partner = "PLC_1".',
    highlight: 'Driver: SIMATIC S7 1200 · Access point: S7ONLINE',
  },
  {
    step: 3,
    title: 'Ánh xạ HMI Tags với PLC Tags',
    detail:
      'Mở "HMI tags -> Default tag table" -> Nhấn Add new -> Ở cột "PLC tag", chọn trực tiếp các biến của PLC như AI0_RAW (%IW64), AI0_PCT (%MD12), AI0_V (%MD16), Tank_Level_Pct (%MD24), Pump_CMD (%Q0.0), RoC (%MD32), ShockAlm (%Q0.1). Đặt Acquisition cycle = 100 ms.',
    highlight: 'Acquisition cycle: 100 ms (Cyclic continuous)',
  },
  {
    step: 4,
    title: 'Cấu hình PG/PC Interface trên Windows (BẮT BUỘC)',
    detail:
      'Mở Control Panel của Windows (chế độ Small icons) -> Chọn "Set PG/PC Interface (32-bit)". Tại Access Point chọn "S7ONLINE (STEP 7)", ở danh sách Interface Parameter Assignment bên dưới chọn "PLCSIM.TCPIP.1" (hoặc PLCSIM S7-1200/S7-1500.TCPIP.1) -> Nhấn OK.',
    highlight: 'S7ONLINE (STEP 7) -> PLCSIM.TCPIP.1',
  },
  {
    step: 5,
    title: 'Chạy PLCSIM trước, mở WinCC Runtime sau',
    detail:
      'B1: Nhấp chọn PLC_1 -> Nhấn "Start simulation" để mở S7-PLCSIM, nạp chương trình và chuyển CPU sang trạng thái RUN (đèn xanh). B2: Mở Project mới trong PLCSIM hoặc SIM Table, thêm biến %IW64 và ép giá trị (0, 13824, 27648). B3: Nhấp chọn HMI_1 -> Nhấn "Start simulation" để mở WinCC Runtime và quan sát đồng bộ.',
    highlight: 'Thứ tự: PLCSIM RUN -> WinCC Runtime Simulator',
  },
];

const HMI_TAG_MAPPING = [
  { hmiTag: 'HMI_AI0_RAW', plcTag: 'AI0_RAW', addr: '%IW64', type: 'Int', cycle: '100 ms', widget: 'IO Field + Bar Graph' },
  { hmiTag: 'HMI_AI0_V', plcTag: 'AI0_V', addr: '%MD16', type: 'Real', cycle: '100 ms', widget: 'IO Field (0.00 - 10.00 V)' },
  { hmiTag: 'HMI_Tank_Level', plcTag: 'Tank_Level_Pct', addr: '%MD24', type: 'Real', cycle: '100 ms', widget: 'Tank Graphic + Slider' },
  { hmiTag: 'HMI_Pump_CMD', plcTag: 'Pump_CMD', addr: '%Q0.0', type: 'Bool', cycle: '100 ms', widget: 'Motor Color Animation' },
  { hmiTag: 'HMI_HiAlm', plcTag: 'HiAlm', addr: '%Q0.2', type: 'Bool', cycle: '100 ms', widget: 'HMI Alarm Class' },
  { hmiTag: 'HMI_LoAlm', plcTag: 'LoAlm', addr: '%Q0.3', type: 'Bool', cycle: '100 ms', widget: 'HMI Alarm Class' },
  { hmiTag: 'HMI_Temp', plcTag: 'Temperature', addr: '%MD28', type: 'Real', cycle: '250 ms', widget: 'IO Field + Zone Lamps' },
  { hmiTag: 'HMI_RoC', plcTag: 'RoC', addr: '%MD32', type: 'Real', cycle: '100 ms', widget: 'Trend View f(t)' },
  { hmiTag: 'HMI_ShockAlm', plcTag: 'ShockAlm', addr: '%Q0.1', type: 'Bool', cycle: '100 ms', widget: 'Alarm Banner + Indicator' },
];

export const HMIPLCSimVisualizer: React.FC<HMIPLCSimVisualizerProps> = ({
  voltage,
  setVoltage,
  rawIW64,
  normPct,
  scaleV,
  engFilt,
  hiAlm,
  loAlm,
  tankLevel,
  setTankLevel,
  pumpCmd,
  temperature,
  setTemperature,
  qCold,
  qNormal,
  qHot,
  roc,
  shockAlm,
  sampleTimeMs,
  setSampleTimeMs,
  onFlickFast,
}) => {
  const [plcSimRunning, setPlcSimRunning] = useState<boolean>(true);
  const [pgPcInterface, setPgPcInterface] = useState<'PLCSIM.TCPIP.1' | 'Realtek.TCPIP.1'>('PLCSIM.TCPIP.1');
  const [hmiScreen, setHmiScreen] = useState<1 | 2 | 3 | 4>(1);
  const [simIw64Input, setSimIw64Input] = useState<string>(String(rawIW64));
  const [simTankInput, setSimTankInput] = useState<string>(String(tankLevel));
  const [simTempInput, setSimTempInput] = useState<string>(String(temperature));
  const [activeGuideStep, setActiveGuideStep] = useState<number>(1);
  const [trendHistory, setTrendHistory] = useState<TrendPoint[]>(() =>
    Array.from({ length: 30 }, () => ({ engFilt: 50, roc: 0 }))
  );
  const [alarms, setAlarms] = useState<HMIAlarmEntry[]>([]);
  const [copiedMapping, setCopiedMapping] = useState<boolean>(false);

  const isHmiConnected = plcSimRunning && pgPcInterface === 'PLCSIM.TCPIP.1';

  // Keep SIM table inputs synced when sliders move externally
  useEffect(() => {
    setSimIw64Input(String(rawIW64));
  }, [rawIW64]);

  useEffect(() => {
    setSimTankInput(String(Math.round(tankLevel * 10) / 10));
  }, [tankLevel]);

  useEffect(() => {
    setSimTempInput(String(Math.round(temperature * 10) / 10));
  }, [temperature]);

  // Sample trend history for HMI Trend Control
  useEffect(() => {
    if (!isHmiConnected) return;
    const timer = window.setInterval(() => {
      setTrendHistory((prev) => [...prev.slice(-39), { engFilt, roc }]);
    }, 200);
    return () => clearInterval(timer);
  }, [isHmiConnected, engFilt, roc]);

  // Record HMI Alarms when HiAlm, LoAlm, or ShockAlm triggers
  useEffect(() => {
    if (!isHmiConnected) return;
    const nowStr = new Date().toTimeString().split(' ')[0];

    const appendIfNew = (tag: string, message: string, severity: HMIAlarmEntry['severity']) => {
      setAlarms((prev) => {
        const latestSame = prev.find((a) => a.tag === tag && a.status === 'INCOMING');
        if (latestSame) return prev;
        const nextEntry: HMIAlarmEntry = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          tag,
          message,
          severity,
          timestamp: nowStr,
          status: 'INCOMING',
        };
        return [nextEntry, ...prev].slice(0, 25);
      });
    };

    if (hiAlm) {
      appendIfNew('HiAlm (%Q0.2)', `Áp suất/Tín hiệu vượt ngưỡng cao > 80% (${engFilt.toFixed(1)}%)`, 'HIGH');
    }
    if (loAlm) {
      appendIfNew('LoAlm (%Q0.3)', `Áp suất/Tín hiệu dưới ngưỡng thấp < 20% (${engFilt.toFixed(1)}%)`, 'LOW');
    }
    if (shockAlm) {
      appendIfNew('ShockAlm (%Q0.1)', `Cảnh báo sốc cơ khí! |RoC| = ${Math.abs(roc).toFixed(1)} %/s > 30 %/s`, 'CRITICAL');
    }
  }, [isHmiConnected, hiAlm, loAlm, shockAlm, engFilt, roc]);

  const handleAckAllAlarms = () => {
    setAlarms((prev) =>
      prev.map((a) => (a.status === 'INCOMING' ? { ...a, status: 'ACKNOWLEDGED' } : a))
    );
  };

  const handleApplySimIw64 = (valStr?: string) => {
    const parsed = Number(valStr ?? simIw64Input);
    if (!Number.isFinite(parsed)) return;
    const clampedCounts = Math.min(27648, Math.max(0, Math.round(parsed)));
    setSimIw64Input(String(clampedCounts));
    setVoltage(rawCountsToVoltage(clampedCounts));
  };

  const handleApplySimTank = (valStr?: string) => {
    const parsed = Number(valStr ?? simTankInput);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(100, Math.max(0, parsed));
    setTankLevel(clamped);
  };

  const handleApplySimTemp = (valStr?: string) => {
    const parsed = Number(valStr ?? simTempInput);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(50, Math.max(0, parsed));
    setTemperature(clamped);
  };

  const unackCount = alarms.filter((a) => a.status === 'INCOMING').length;

  // Build SVG polyline points for Trend Control
  const buildPolyline = (selector: (p: TrendPoint) => number, minVal: number, maxVal: number) => {
    const width = 460;
    const height = 130;
    return trendHistory
      .map((pt, i) => {
        const x = (i / Math.max(1, trendHistory.length - 1)) * width;
        const norm = (selector(pt) - minVal) / (maxVal - minVal);
        const clampedNorm = Math.min(1, Math.max(0, norm));
        const y = height - clampedNorm * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const handleCopyMapping = () => {
    const header = 'HMI_Tag\tPLC_Tag\tAddress\tData_Type\tAcquisition_Cycle\tHMI_Object\n';
    const body = HMI_TAG_MAPPING.map(
      (r) => `${r.hmiTag}\t${r.plcTag}\t${r.addr}\t${r.type}\t${r.cycle}\t${r.widget}`
    ).join('\n');
    navigator.clipboard.writeText(header + body);
    setCopiedMapping(true);
    setTimeout(() => setCopiedMapping(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Thiết kế Giao diện HMI (WinCC) &amp; Kết nối Mô phỏng PLCSIM
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mô phỏng đồng thời màn hình cảm ứng SIMATIC HMI KTP700 Basic và bảng ép biến S7-PLCSIM v16–v19 qua giao diện S7ONLINE
              </p>
            </div>
          </div>

          {/* Connection Status Readout */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Link2 className={`w-4 h-4 ${isHmiConnected ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="font-mono font-semibold text-slate-200">
                {isHmiConnected ? 'KẾT NỐI: S7ONLINE ↔ PLCSIM' : 'MẤT KẾT NỐI HMI ↔ PLC'}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <span className={`font-mono font-bold ${plcSimRunning ? 'text-emerald-400' : 'text-amber-400'}`}>
              CPU: {plcSimRunning ? 'RUN' : 'STOP'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Zone Workbench: Left = HMI KTP700 Panel, Right = PLCSIM SIM Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT (7 cols): Virtual SIMATIC HMI KTP700 Basic Panel */}
        <div className="xl:col-span-7 bg-slate-800 p-3 sm:p-4 rounded-2xl border-2 border-slate-700 shadow-2xl space-y-3">
          {/* Bezel Top Branding */}
          <div className="flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-slate-200">SIEMENS</span>
              <span className="text-slate-400 font-mono text-[11px]">SIMATIC HMI · KTP700 Basic PN</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className={isHmiConnected ? 'text-emerald-400' : 'text-rose-400'}>
                {isHmiConnected ? 'PN/IE_1: Online' : 'PN/IE_1: Offline (###)'}
              </span>
            </div>
          </div>

          {/* Inner LCD Touch Display */}
          <div className="bg-slate-950 border-4 border-slate-900 rounded-xl overflow-hidden flex flex-col min-h-[450px]">
            {/* WinCC Template Top Status Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-teal-300">
                  {hmiScreen === 1 && 'Màn hình 01: Tín hiệu Analog (Tasks 3–5)'}
                  {hmiScreen === 2 && 'Màn hình 02: Bồn nước & Phòng sạch (Tasks 6–7)'}
                  {hmiScreen === 3 && 'Màn hình 03: Nhiệt độ & Trend RoC (Tasks 8–10)'}
                  {hmiScreen === 4 && 'Màn hình 04: Lịch sử Cảnh báo (Alarm View)'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {unackCount > 0 && (
                  <button
                    onClick={() => setHmiScreen(4)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[11px] font-mono font-bold"
                  >
                    <Bell className="w-3 h-3" />
                    <span>{unackCount} Cảnh báo mới</span>
                  </button>
                )}
                <span className="text-[11px] font-mono text-slate-400">
                  HMI_1 (192.168.0.2)
                </span>
              </div>
            </div>

            {/* Active HMI Screen Content */}
            <div className="flex-1 p-4 space-y-4">
              {!isHmiConnected && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-rose-300">
                      Mất kết nối WinCC Runtime ↔ PLCSIM (Các ô IO Field hiển thị ###)
                    </strong>
                    <span className="text-[11px]">
                      {!plcSimRunning
                        ? 'Nguyên nhân: CPU trong PLCSIM đang ở trạng thái STOP. Hãy chuyển công tắc bên phải sang RUN.'
                        : 'Nguyên nhân: PG/PC Interface chưa trỏ đúng vào PLCSIM.TCPIP.1. Hãy kiểm tra lại mục PG/PC Interface ở bảng bên phải.'}
                    </span>
                  </div>
                </div>
              )}

              {/* HMI SCREEN 1: ANALOG & IO FIELDS */}
              {hmiScreen === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Bar Graph Widget */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">HMI Bar Graph: AI0 Voltage</span>
                        <span className="font-mono text-teal-300 font-bold">
                          {isHmiConnected ? `${scaleV.toFixed(2)} V` : '### V'}
                        </span>
                      </div>
                      <div className="flex items-end gap-4 h-44 px-4 py-2 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex flex-col justify-between h-full text-[10px] font-mono text-slate-500 py-1">
                          <span>10.0 V (27648)</span>
                          <span>7.5 V (20736)</span>
                          <span>5.0 V (13824)</span>
                          <span>2.5 V (6912)</span>
                          <span>0.0 V (0)</span>
                        </div>
                        <div className="flex-1 h-full bg-slate-900 rounded-md border border-slate-800 relative overflow-hidden flex flex-col justify-end">
                          <div
                            className={`w-full transition-all duration-100 ${
                              isHmiConnected
                                ? engFilt > 80
                                  ? 'bg-amber-500'
                                  : engFilt < 20
                                    ? 'bg-sky-500'
                                    : 'bg-teal-400'
                                : 'bg-slate-700'
                            }`}
                            style={{ height: isHmiConnected ? `${Math.min(100, Math.max(0, engFilt))}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* WinCC IO Fields Table */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="text-xs font-bold text-slate-200 pb-1 border-b border-slate-800">
                        WinCC IO Fields (Giá trị Đọc / Ghi)
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400">AI0_RAW (%IW64)</span>
                          <span className="font-mono font-bold text-cyan-300 tabular-nums">
                            {isHmiConnected ? rawIW64 : '#####'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400">AI0_PCT (%MD12)</span>
                          <span className="font-mono font-bold text-teal-300 tabular-nums">
                            {isHmiConnected ? normPct.toFixed(3) : '#.###'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400">AI0_V (%MD16)</span>
                          <span className="font-mono font-bold text-emerald-300 tabular-nums">
                            {isHmiConnected ? `${scaleV.toFixed(2)} V` : '##.## V'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400">AI0_ENG_FILT (%MD20)</span>
                          <span className="font-mono font-bold text-white tabular-nums">
                            {isHmiConnected ? `${engFilt.toFixed(1)} %` : '###.# %'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HMI Touch Slider */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <label htmlFor="hmi-voltage-slider" className="font-semibold text-slate-300 flex items-center gap-1.5 min-w-0">
                        <Sliders className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">HMI Slider Control (0–10 V)</span>
                      </label>
                      <span className="font-mono text-teal-300 font-bold whitespace-nowrap shrink-0 tabular-nums">
                        {isHmiConnected ? `${voltage.toFixed(2)} V` : 'Offline'}
                      </span>
                    </div>
                    <input
                      id="hmi-voltage-slider"
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      disabled={!isHmiConnected}
                      value={voltage}
                      onChange={(e) => setVoltage(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 disabled:opacity-40"
                    />
                  </div>
                </div>
              )}

              {/* HMI SCREEN 2: TANK PUMP & CLEANROOM */}
              {hmiScreen === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tank & Pump Faceplate */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Waves className="w-4 h-4 text-cyan-400" />
                        Bồn Nước (Task 7)
                      </span>
                      <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                        !isHmiConnected
                          ? 'bg-slate-800 text-slate-500'
                          : pumpCmd
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                      }`}>
                        {!isHmiConnected ? '###' : pumpCmd ? 'PUMP: ON' : 'PUMP: OFF'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-24 h-36 border-2 border-slate-600 border-t-0 rounded-b-xl bg-slate-950 relative overflow-hidden flex flex-col justify-end shrink-0">
                        <div className="absolute top-[30%] inset-x-0 border-b border-dashed border-rose-400/70 text-[9px] text-rose-300 px-1 font-mono">
                          70%
                        </div>
                        <div className="absolute top-[70%] inset-x-0 border-b border-dashed border-emerald-400/70 text-[9px] text-emerald-300 px-1 font-mono">
                          30%
                        </div>
                        <div
                          className="w-full bg-cyan-500/80 transition-all duration-150"
                          style={{ height: isHmiConnected ? `${tankLevel}%` : '0%' }}
                        />
                      </div>

                      <div className="flex-1 space-y-2 text-xs">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-[11px] text-slate-400">Tank_Level_Pct (%MD24)</div>
                          <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
                            {isHmiConnected ? `${tankLevel.toFixed(1)} %` : '### %'}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[25, 50, 75].map((lvl) => (
                            <button
                              key={lvl}
                              disabled={!isHmiConnected}
                              onClick={() => setTankLevel(lvl)}
                              className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs disabled:opacity-40"
                            >
                              {lvl}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cleanroom Alarm Faceplate */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Cảnh báo Phòng sạch (Task 6)</span>
                      <span className="font-mono text-teal-300 font-bold">
                        {isHmiConnected ? `${engFilt.toFixed(1)} %` : '### %'}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className={`p-3 rounded-lg border flex items-center justify-between ${
                        isHmiConnected && hiAlm
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}>
                        <div>
                          <div className="font-bold">HiAlm (%Q0.2)</div>
                          <div className="text-[11px] opacity-80">Set &gt; 80% · Reset &lt; 78%</div>
                        </div>
                        <span className="font-mono font-bold">
                          {!isHmiConnected ? '###' : hiAlm ? 'ACTIVE' : 'NORMAL'}
                        </span>
                      </div>

                      <div className={`p-3 rounded-lg border flex items-center justify-between ${
                        isHmiConnected && loAlm
                          ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}>
                        <div>
                          <div className="font-bold">LoAlm (%Q0.3)</div>
                          <div className="text-[11px] opacity-80">Set &lt; 20% · Reset &gt; 22%</div>
                        </div>
                        <span className="font-mono font-bold">
                          {!isHmiConnected ? '###' : loAlm ? 'ACTIVE' : 'NORMAL'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {[
                          { label: '15% (Lo)', v: 1.5 },
                          { label: '50% (OK)', v: 5.0 },
                          { label: '85% (Hi)', v: 8.5 },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            disabled={!isHmiConnected}
                            onClick={() => setVoltage(preset.v)}
                            className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono disabled:opacity-40"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HMI SCREEN 3: TEMPERATURE ZONES & TREND ROC */}
              {hmiScreen === 3 && (
                <div className="space-y-4">
                  {/* Temperature 3-Zone HMI Strip */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-white">Phân vùng Nhiệt độ (Tasks 8–9)</span>
                      <div className="flex items-center gap-1.5">
                        {[10, 22, 35].map((t) => (
                          <button
                            key={t}
                            disabled={!isHmiConnected}
                            onClick={() => setTemperature(t)}
                            className={`px-2 py-1 rounded font-mono text-[11px] border disabled:opacity-40 ${
                              Math.abs(temperature - t) < 0.5
                                ? 'bg-teal-500 text-slate-950 font-bold border-teal-400'
                                : 'bg-slate-950 text-slate-300 border-slate-800'
                            }`}
                          >
                            {t}°C
                          </button>
                        ))}
                        <span className="font-mono font-bold text-teal-300 ml-2">
                          {isHmiConnected ? `${temperature.toFixed(1)} °C` : '### °C'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                        isHmiConnected && qCold ? 'bg-sky-950/60 border-sky-400 text-sky-200' : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}>
                        <Snowflake className="w-4 h-4 shrink-0" />
                        <span className="font-mono font-bold truncate">Q1.0 COLD</span>
                      </div>
                      <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                        isHmiConnected && qNormal ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}>
                        <Sun className="w-4 h-4 shrink-0" />
                        <span className="font-mono font-bold truncate">Q1.1 NORM</span>
                      </div>
                      <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                        isHmiConnected && qHot ? 'bg-rose-950/60 border-rose-400 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}>
                        <Flame className="w-4 h-4 shrink-0" />
                        <span className="font-mono font-bold truncate">Q1.2 HOT</span>
                      </div>
                    </div>
                  </div>

                  {/* HMI Trend Control (Task 10) */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-rose-400" />
                        <span className="font-bold text-white">WinCC Trend View: RoC (%MD32) &amp; AI0 (%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={!isHmiConnected}
                          onClick={() => setSampleTimeMs(sampleTimeMs === 10 ? 20 : 10)}
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-[11px] text-teal-300 disabled:opacity-40"
                        >
                          Ts = {sampleTimeMs} ms
                        </button>
                        <button
                          disabled={!isHmiConnected}
                          onClick={onFlickFast}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 font-semibold text-[11px] flex items-center gap-1 disabled:opacity-40"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Kích Xung Sốc</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 rounded-lg border border-slate-800 p-2">
                      <svg viewBox="0 0 460 130" className="w-full h-32">
                        {/* Grid */}
                        <line x1="0" y1="65" x2="460" y2="65" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="0" y1="32" x2="460" y2="32" stroke="#f43f5e" strokeDasharray="2 4" strokeWidth="1" opacity="0.6" />
                        <line x1="0" y1="98" x2="460" y2="98" stroke="#f43f5e" strokeDasharray="2 4" strokeWidth="1" opacity="0.6" />
                        {isHmiConnected && (
                          <>
                            <polyline
                              fill="none"
                              stroke="#2dd4bf"
                              strokeWidth="2"
                              points={buildPolyline((p) => p.engFilt, 0, 100)}
                            />
                            <polyline
                              fill="none"
                              stroke="#fb7185"
                              strokeWidth="2"
                              points={buildPolyline((p) => p.roc, -60, 60)}
                            />
                          </>
                        )}
                      </svg>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                        <span className="text-teal-300">▬ AI0_ENG_FILT (0..100%)</span>
                        <span className="text-rose-400">▬ RoC (-60..+60 %/s) · Ngưỡng: ±30 %/s</span>
                        <span className={shockAlm ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          ShockAlm: {isHmiConnected ? (shockAlm ? 'ON' : 'OFF') : '###'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HMI SCREEN 4: ALARM VIEW */}
              {hmiScreen === 4 && (
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">WinCC Alarm View Control</span>
                    <button
                      onClick={handleAckAllAlarms}
                      disabled={unackCount === 0}
                      className="px-3 py-1 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 disabled:opacity-40 transition-colors"
                    >
                      Xác nhận tất cả (Acknowledge)
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Thời gian</th>
                          <th className="py-2 px-3">Biến PLC</th>
                          <th className="py-2 px-3">Nội dung Cảnh báo</th>
                          <th className="py-2 px-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {alarms.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                              Chưa phát sinh cảnh báo. Hãy đẩy mức tín hiệu &gt; 80%, &lt; 20% hoặc kích sốc ở Màn hình 03.
                            </td>
                          </tr>
                        ) : (
                          alarms.map((a) => (
                            <tr
                              key={a.id}
                              className={
                                a.status === 'INCOMING'
                                  ? 'bg-rose-950/30 text-rose-200'
                                  : 'text-slate-400'
                              }
                            >
                              <td className="py-1.5 px-3 whitespace-nowrap tabular-nums">{a.timestamp}</td>
                              <td className="py-1.5 px-3 font-bold whitespace-nowrap">{a.tag}</td>
                              <td className="py-1.5 px-3 font-sans">{a.message}</td>
                              <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                <span
                                  className={`inline-block whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${
                                    a.status === 'INCOMING'
                                      ? 'bg-rose-500 text-slate-950'
                                      : 'bg-slate-800 text-emerald-300'
                                  }`}
                                >
                                  {a.status === 'INCOMING' ? 'CHƯA XÁC NHẬN' : 'ĐÃ XÁC NHẬN'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Physical Function Keys Strip on KTP700 Bezel (Single Consolidated Bar) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-1 pt-1">
            {[
              { id: 1 as const, keyLabel: 'F1', name: 'Analog & IO' },
              { id: 2 as const, keyLabel: 'F2', name: 'Bồn & Sạch' },
              { id: 3 as const, keyLabel: 'F3', name: 'Nhiệt & RoC' },
              { id: 4 as const, keyLabel: 'F4', name: `Cảnh báo (${alarms.length})` },
            ].map((fkey) => (
              <button
                key={fkey.id}
                onClick={() => setHmiScreen(fkey.id)}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors duration-75 flex items-center justify-center gap-1.5 ${
                  hmiScreen === fkey.id
                    ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-slate-500'
                }`}
              >
                <span className="font-mono text-[11px] opacity-80">{fkey.keyLabel}</span>
                <span>{fkey.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT (5 cols): S7-PLCSIM Controller & SIM Table */}
        <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-bold text-white">S7-PLCSIM · SIM Table_1</h3>
                <p className="text-[11px] text-slate-400">
                  Ép giá trị đầu vào giả lập để kiểm tra phản hồi trên HMI
                </p>
              </div>
            </div>

            {/* CPU RUN / STOP Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setPlcSimRunning(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono font-bold transition-colors ${
                  plcSimRunning ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play className="w-3 h-3" />
                <span>RUN</span>
              </button>
              <button
                onClick={() => setPlcSimRunning(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono font-bold transition-colors ${
                  !plcSimRunning ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Square className="w-3 h-3" />
                <span>STOP</span>
              </button>
            </div>
          </div>

          {/* Windows PG/PC Interface Selector Simulation */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
            <label htmlFor="pg-pc-select" className="font-bold text-slate-200 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>PG/PC Interface (Access Point: S7ONLINE)</span>
            </label>
            <select
              id="pg-pc-select"
              value={pgPcInterface}
              onChange={(e) => setPgPcInterface(e.target.value as 'PLCSIM.TCPIP.1' | 'Realtek.TCPIP.1')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-400"
            >
              <option value="PLCSIM.TCPIP.1">PLCSIM.TCPIP.1 (Mô phỏng chuẩn với HMI)</option>
              <option value="Realtek.TCPIP.1">Realtek PCIe GbE.TCPIP.1 (Sai cấu hình - Mất kết nối)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Thử đổi sang Card mạng thật để thấy lỗi mất kết nối (###) thường gặp khi sinh viên quên chỉnh PG/PC Interface!
            </p>
          </div>

          {/* PLCSIM Force Inputs Table */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Bảng Ép Biến PLCSIM (Modify Values)</span>
              <span className="font-mono text-[11px] text-slate-500">SIM_Table_1</span>
            </div>

            {/* Row 1: %IW64 (AI0_RAW) */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label htmlFor="sim-iw64-input" className="font-mono font-bold text-cyan-300">
                  AI0_RAW (%IW64) · Int
                </label>
                <span className="text-[11px] text-slate-400">Dải: 0 .. 27648</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="sim-iw64-input"
                  type="number"
                  min={0}
                  max={27648}
                  value={simIw64Input}
                  onChange={(e) => setSimIw64Input(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white text-xs focus:outline-none focus:border-teal-400"
                />
                <button
                  onClick={() => handleApplySimIw64()}
                  className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Ép (Force)
                </button>
              </div>
              <div className="flex gap-1.5">
                {[
                  { label: '0 (0V)', val: '0' },
                  { label: '13824 (5V)', val: '13824' },
                  { label: '27648 (10V)', val: '27648' },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() => handleApplySimIw64(preset.val)}
                    className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: %MD24 (Tank_Level_Pct) & %MD28 (Temperature) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <label htmlFor="sim-tank-input" className="font-mono font-bold text-sky-300 block">
                  Tank_Level (%MD24)
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="sim-tank-input"
                    type="number"
                    min={0}
                    max={100}
                    value={simTankInput}
                    onChange={(e) => setSimTankInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                  />
                  <button
                    onClick={() => handleApplySimTank()}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs"
                  >
                    Set
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <label htmlFor="sim-temp-input" className="font-mono font-bold text-amber-300 block">
                  Temperature (%MD28)
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="sim-temp-input"
                    type="number"
                    min={0}
                    max={50}
                    value={simTempInput}
                    onChange={(e) => setSimTempInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                  />
                  <button
                    onClick={() => handleApplySimTemp()}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>

            {/* Monitored PLC Outputs Summary */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Ngõ ra PLC giám sát trực tiếp trên PLCSIM
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <div className="flex justify-between px-2 py-1 rounded bg-slate-900">
                  <span className="text-slate-400">%Q0.0 Pump:</span>
                  <span className={pumpCmd ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {pumpCmd ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
                <div className="flex justify-between px-2 py-1 rounded bg-slate-900">
                  <span className="text-slate-400">%Q0.1 Shock:</span>
                  <span className={shockAlm ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                    {shockAlm ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
                <div className="flex justify-between px-2 py-1 rounded bg-slate-900">
                  <span className="text-slate-400">%Q0.2 HiAlm:</span>
                  <span className={hiAlm ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    {hiAlm ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
                <div className="flex justify-between px-2 py-1 rounded bg-slate-900">
                  <span className="text-slate-400">%Q0.3 LoAlm:</span>
                  <span className={loAlm ? 'text-sky-400 font-bold' : 'text-slate-500'}>
                    {loAlm ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Step-by-Step TIA Portal HMI + PLCSIM Setup Guide & Tag Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5-Step Connection Guide */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-teal-400" />
              <span>Quy trình 5 bước Kết nối HMI với PLCSIM trong TIA Portal</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {CONNECTION_STEPS.map((item) => {
              const isActive = activeGuideStep === item.step;
              return (
                <button
                  key={item.step}
                  onClick={() => setActiveGuideStep(item.step)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-teal-500/10 border-teal-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 text-teal-300'
                      }`}>
                        {item.step}
                      </span>
                      <span className="text-xs font-bold">{item.title}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'rotate-90 text-teal-400' : 'text-slate-600'}`} />
                  </div>
                  {isActive && (
                    <div className="mt-2.5 pl-8 space-y-1.5 text-xs text-slate-300 leading-relaxed">
                      <p>{item.detail}</p>
                      <div className="font-mono text-[11px] text-teal-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 inline-block">
                        {item.highlight}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* HMI Tag Mapping Table */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-teal-400" />
              <span>Bảng Ánh xạ HMI Tags ↔ PLC Tags (WinCC)</span>
            </h3>
            <button
              onClick={handleCopyMapping}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              {copiedMapping ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
              <span>{copiedMapping ? 'Đã chép bảng!' : 'Sao chép bảng'}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-[10px] text-slate-400 font-mono uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">HMI Tag</th>
                  <th className="py-2 px-3">PLC Tag</th>
                  <th className="py-2 px-3">Địa chỉ</th>
                  <th className="py-2 px-3">Chu kỳ</th>
                  <th className="py-2 px-3">Đối tượng WinCC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {HMI_TAG_MAPPING.map((row) => (
                  <tr key={row.hmiTag} className="hover:bg-slate-900/50">
                    <td className="py-1.5 px-3 text-teal-300 font-semibold">{row.hmiTag}</td>
                    <td className="py-1.5 px-3 text-white">{row.plcTag}</td>
                    <td className="py-1.5 px-3 text-cyan-400">{row.addr}</td>
                    <td className="py-1.5 px-3 text-slate-400">{row.cycle}</td>
                    <td className="py-1.5 px-3 text-slate-300 font-sans">{row.widget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
