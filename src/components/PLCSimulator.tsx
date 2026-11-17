import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  RotateCw, 
  Activity, 
  Gauge, 
  Flame, 
  Snowflake, 
  Sun, 
  ShieldAlert, 
  Waves, 
  Sliders, 
  Check, 
  Play, 
  Square, 
  Clock,
  ArrowRight
} from 'lucide-react';

interface PLCSimulatorProps {
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
  setSampleTimeMs: (t: number) => void;
  onFlickFast: () => void;
}

export const PLCSimulator: React.FC<PLCSimulatorProps> = ({
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
  const [syncMode, setSyncMode] = useState<'pot' | 'tank' | 'temp'>('pot');
  const [isAutoSweeping, setIsAutoSweeping] = useState(false);
  const sweepRef = useRef<number | null>(null);
  const sweepDirRef = useRef<number>(1);

  // Auto sweep for demonstrating hysteresis
  useEffect(() => {
    if (isAutoSweeping) {
      const interval = window.setInterval(() => {
        setVoltage(prev => {
          let next = prev + sweepDirRef.current * 0.1;
          if (next >= 10.0) {
            next = 10.0;
            sweepDirRef.current = -1;
          } else if (next <= 0.0) {
            next = 0.0;
            sweepDirRef.current = 1;
          }
          return Math.round(next * 10) / 10;
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [isAutoSweeping, setVoltage]);

  // Handle sync modes
  const handleVoltageChange = (newV: number) => {
    setVoltage(newV);
    if (syncMode === 'tank') {
      setTankLevel(Math.round(newV * 10 * 10) / 10);
    } else if (syncMode === 'temp') {
      // Map 0 - 10V to 0 - 50 °C
      setTemperature(Math.round(newV * 5 * 10) / 10);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: CPU Siemens S7-1200 Faceplate & Diagnostic Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-10 bg-teal-500 rounded-full"></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">SIEMENS SIMATIC S7-1200</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-mono border border-slate-700">
                  CPU 1214C DC/DC/DC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Chế độ thực thi: RUN · Ngõ vào tích hợp: 2x AI 0–10V (%IW64, %IW66) · Chu kỳ ngắt: OB30 ({sampleTimeMs} ms)
              </p>
            </div>
          </div>

          {/* LED Status Row */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
              <span className="text-slate-300 font-mono">RUN/STOP</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
              <span className="text-slate-400 font-mono">ERROR</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
              <span className="text-slate-400 font-mono">MAINT</span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full transition-colors ${
                voltage > 0.05 ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-slate-700'
              }`}></span>
              <span className="text-cyan-300 font-mono">AI0 (%IW64)</span>
            </div>
          </div>
        </div>

        {/* Digital Output LEDs Matrix on S7-1200 Faceplate */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className={`p-2.5 rounded-xl border transition-all ${
            pumpCmd ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono">%Q0.0</span>
              <span className={`w-2 h-2 rounded-full ${pumpCmd ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'}`}></span>
            </div>
            <div className="font-semibold text-xs mt-1 truncate">Pump_CMD</div>
            <div className="text-[10px] opacity-75">{pumpCmd ? 'BƠM CHẠY' : 'DỪNG'}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            shockAlm ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono">%Q0.1</span>
              <span className={`w-2 h-2 rounded-full ${shockAlm ? 'bg-rose-400 shadow-sm shadow-rose-400' : 'bg-slate-700'}`}></span>
            </div>
            <div className="font-semibold text-xs mt-1 truncate">ShockAlm</div>
            <div className="text-[10px] opacity-75">{shockAlm ? 'CẢNH BÁO SỐC' : 'BÌNH THƯỜNG'}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            hiAlm ? 'bg-amber-950/50 border-amber-500/60 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono">%Q0.2</span>
              <span className={`w-2 h-2 rounded-full ${hiAlm ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-slate-700'}`}></span>
            </div>
            <div className="font-semibold text-xs mt-1 truncate">HiAlm</div>
            <div className="text-[10px] opacity-75">{hiAlm ? 'MỨC CAO >80%' : 'OFF'}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            loAlm ? 'bg-blue-950/50 border-blue-500/60 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono">%Q0.3</span>
              <span className={`w-2 h-2 rounded-full ${loAlm ? 'bg-blue-400 shadow-sm shadow-blue-400' : 'bg-slate-700'}`}></span>
            </div>
            <div className="font-semibold text-xs mt-1 truncate">LoAlm</div>
            <div className="text-[10px] opacity-75">{loAlm ? 'MỨC THẤP <20%' : 'OFF'}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            qCold ? 'bg-sky-950/50 border-sky-400 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono">%Q1.0</span>
              <span className={`w-2 h-2 rounded-full ${qCold ? 'bg-sky-400 shadow-sm shadow-sky-400' : 'bg-slate-700'}`}></span>
            </div>
            <div className="font-semibold text-xs mt-1 truncate">Q_COLD</div>
            <div className="text-[10px] opacity-75">&lt; 15 °C</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            qNormal ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono">%Q1.1</span>
              <span className={`w-2 h-2 rounded-full ${qNormal ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'}`}></span>
            </div>
            <div className="font-semibold text-xs mt-1 truncate">Q_NORMAL</div>
            <div className="text-[10px] opacity-75">15 .. 30 °C</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            qHot ? 'bg-red-950/50 border-red-400 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono">%Q1.2</span>
              <span className={`w-2 h-2 rounded-full ${qHot ? 'bg-red-400 shadow-sm shadow-red-400' : 'bg-slate-700'}`}></span>
            </div>
            <div className="font-semibold text-xs mt-1 truncate">Q_HOT</div>
            <div className="text-[10px] opacity-75">&gt; 30 °C</div>
          </div>
        </div>
      </div>

      {/* Main Interactive Controls & Signal Processing Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Potentiometer & Signal Generator Control */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-white text-base">Bộ Điều khiển Tín hiệu Analog</h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setSyncMode('pot')}
                className={`px-2 py-1 rounded transition-colors ${
                  syncMode === 'pot' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Điện áp 0-10V
              </button>
              <button
                onClick={() => setSyncMode('tank')}
                className={`px-2 py-1 rounded transition-colors ${
                  syncMode === 'tank' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mức Nước
              </button>
              <button
                onClick={() => setSyncMode('temp')}
                className={`px-2 py-1 rounded transition-colors ${
                  syncMode === 'temp' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Nhiệt độ
              </button>
            </div>
          </div>

          {/* Master Voltage Knob Display */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center space-y-3">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {syncMode === 'pot' && 'Điện áp Ngõ vào AI0 (Terminal 0 - 2M)'}
              {syncMode === 'tank' && 'Mức nước Bồn chứa (Tank Level)'}
              {syncMode === 'temp' && 'Nhiệt độ Môi trường (Chamber Temperature)'}
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-extrabold text-teal-300 font-mono tracking-tight">
                {syncMode === 'pot' && `${voltage.toFixed(2)}`}
                {syncMode === 'tank' && `${tankLevel.toFixed(1)}`}
                {syncMode === 'temp' && `${temperature.toFixed(1)}`}
              </span>
              <span className="text-lg font-bold text-slate-400">
                {syncMode === 'pot' && 'V DC'}
                {syncMode === 'tank' && '%'}
                {syncMode === 'temp' && '°C'}
              </span>
            </div>

            {/* Slider */}
            <div className="px-2 pt-2">
              <input
                type="range"
                min="0"
                max={syncMode === 'temp' ? 50 : 10}
                step="0.05"
                value={syncMode === 'temp' ? temperature : (syncMode === 'tank' ? tankLevel / 10 : voltage)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (syncMode === 'temp') {
                    setTemperature(val);
                    setVoltage(Math.min(10, Math.max(0, val / 5)));
                  } else if (syncMode === 'tank') {
                    setTankLevel(val * 10);
                    setVoltage(val);
                  } else {
                    handleVoltageChange(val);
                  }
                }}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                <span>0.00 {syncMode === 'temp' ? '°C' : 'V'}</span>
                <span>5.00 {syncMode === 'temp' ? '°C' : 'V'} (50%)</span>
                <span>{syncMode === 'temp' ? '50.0 °C' : '10.00 V'}</span>
              </div>
            </div>
          </div>

          {/* Quick Presets for Lab 3 Tasks */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Mốc kiểm nghiệm thực hành (Lab 3 Evaluation Presets):
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { v: 0.0, label: '0 V', sub: 'Task 3,4' },
                { v: 2.0, label: '2 V', sub: 'Task 5' },
                { v: 5.0, label: '5 V', sub: 'Task 2,3' },
                { v: 6.0, label: '6 V', sub: 'Task 5' },
                { v: 9.0, label: '9 V', sub: 'Task 5' },
                { v: 10.0, label: '10 V', sub: 'Task 3,4' },
              ].map((p) => (
                <button
                  key={p.v}
                  onClick={() => handleVoltageChange(p.v)}
                  className={`p-1.5 text-center rounded-lg border transition-all text-xs ${
                    Math.abs(voltage - p.v) < 0.05
                      ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono">{p.label}</div>
                  <div className="text-[10px] text-slate-500">{p.sub}</div>
                </button>
              ))}
            </div>

            {/* Specialized Presets for Task 7 (Tank) & Task 8 (Temp) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-blue-400" /> Bồn Task 7:
                </span>
                <div className="flex gap-1">
                  {[25, 50, 75].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setSyncMode('tank');
                        setTankLevel(lvl);
                        setVoltage(lvl / 10);
                      }}
                      className="flex-1 py-1 text-xs rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800"
                    >
                      {lvl}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Nhiệt độ Task 8:
                </span>
                <div className="flex gap-1">
                  {[
                    { t: 10, label: '10°C (COLD)' },
                    { t: 22, label: '22°C (NORM)' },
                    { t: 35, label: '35°C (HOT)' },
                  ].map(item => (
                    <button
                      key={item.t}
                      onClick={() => {
                        setSyncMode('temp');
                        setTemperature(item.t);
                        setVoltage(item.t / 5);
                      }}
                      className="flex-1 py-1 text-xs rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800"
                    >
                      {item.t}°C
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Action Buttons: Auto Sweep & Fast Flick for Shock */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setIsAutoSweeping(!isAutoSweeping)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                isAutoSweeping 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {isAutoSweeping ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoSweeping ? 'Dừng Quét Tự động' : 'Quét Chậm 0 ⇄ 100% (Thử Hysteresis)'}</span>
            </button>

            <button
              onClick={onFlickFast}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all shadow-sm shadow-rose-950"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Xoay Nhanh (Kích Sốc RoC &gt; 30%/s)</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Data Flow Pipeline & Watch Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-white text-base">Chuỗi Xử lý Tín hiệu Tương tự (Signal Pipeline)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">OB1 & OB30 Live Pipeline</span>
          </div>

          {/* 4-Step Pipeline Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1: Raw Value (IW64) */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 relative overflow-hidden">
              <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Bước 1: Đọc Thô (MOVE)</div>
              <div className="text-xs text-slate-400">Tag: <span className="font-mono text-white">AI0_RAW</span></div>
              <div className="text-xs text-slate-400">Địa chỉ: <span className="font-mono text-cyan-400">%IW64</span></div>
              <div className="pt-1">
                <span className="text-2xl font-bold font-mono text-teal-300">{rawIW64}</span>
                <span className="text-xs text-slate-500 ml-1">counts</span>
              </div>
              <div className="text-[10px] text-slate-500">Dải danh định: 0 .. 27648</div>
            </div>

            {/* Step 2: NORM_X (0.0 to 1.0) */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Bước 2: NORM_X (0..1)</div>
              <div className="text-xs text-slate-400">Tag: <span className="font-mono text-white">AI0_PCT</span></div>
              <div className="text-xs text-slate-400">Địa chỉ: <span className="font-mono text-cyan-400">%MD12</span></div>
              <div className="pt-1">
                <span className="text-2xl font-bold font-mono text-teal-300">{normPct.toFixed(4)}</span>
                <span className="text-xs text-slate-500 ml-1">Real</span>
              </div>
              <div className="text-[10px] text-slate-500">RAW / 27648.0</div>
            </div>

            {/* Step 3: SCALE_X (Voltage) */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Bước 3: SCALE_X (0..10V)</div>
              <div className="text-xs text-slate-400">Tag: <span className="font-mono text-white">AI0_V</span></div>
              <div className="text-xs text-slate-400">Địa chỉ: <span className="font-mono text-cyan-400">%MD16</span></div>
              <div className="pt-1">
                <span className="text-2xl font-bold font-mono text-teal-300">{scaleV.toFixed(2)}</span>
                <span className="text-xs text-slate-500 ml-1">V</span>
              </div>
              <div className="text-[10px] text-slate-500">Sai số VOM: ≤ ±0.1 V</div>
            </div>

            {/* Step 4: RoC (OB30 10ms) */}
            <div className={`p-3 bg-slate-950 rounded-xl border space-y-1.5 transition-all ${
              shockAlm ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800'
            }`}>
              <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Bước 4: RoC (OB30)</div>
              <div className="text-xs text-slate-400">Tag: <span className="font-mono text-white">RoC</span></div>
              <div className="text-xs text-slate-400">Địa chỉ: <span className="font-mono text-cyan-400">%MD32</span></div>
              <div className="pt-1">
                <span className={`text-2xl font-bold font-mono ${shockAlm ? 'text-rose-400' : 'text-teal-300'}`}>
                  {roc.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 ml-1">%/s</span>
              </div>
              <div className="text-[10px] text-slate-500">Ngưỡng sốc: 30 %/s</div>
            </div>
          </div>

          {/* Live Watch Table (TIA Portal Monitor Style) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">TIA Portal Watch Table 1 (Giám sát Online)</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online (Monitoring active)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Tên Biến (Tag)</th>
                    <th className="py-2 px-3">Địa chỉ (Address)</th>
                    <th className="py-2 px-3">Kiểu (Type)</th>
                    <th className="py-2 px-3 text-right">Giá trị Online (Value)</th>
                    <th className="py-2 px-3">Ý nghĩa & Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-1.5 px-3 text-white font-semibold">AI0_RAW</td>
                    <td className="py-1.5 px-3 text-cyan-400">%IW64</td>
                    <td className="py-1.5 px-3 text-slate-400">Int</td>
                    <td className="py-1.5 px-3 text-right text-teal-300 font-bold tabular-nums">{rawIW64}</td>
                    <td className="py-1.5 px-3 text-[11px] font-sans text-slate-400">Thanh ghi thô từ bộ ADC 10-bit</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-1.5 px-3 text-white font-semibold">AI0_PCT</td>
                    <td className="py-1.5 px-3 text-cyan-400">%MD12</td>
                    <td className="py-1.5 px-3 text-slate-400">Real</td>
                    <td className="py-1.5 px-3 text-right text-teal-300 font-bold tabular-nums">{normPct.toFixed(4)}</td>
                    <td className="py-1.5 px-3 text-[11px] font-sans text-slate-400">Chuẩn hóa 0.0 .. 1.0 (Task 4)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-1.5 px-3 text-white font-semibold">AI0_V</td>
                    <td className="py-1.5 px-3 text-cyan-400">%MD16</td>
                    <td className="py-1.5 px-3 text-slate-400">Real</td>
                    <td className="py-1.5 px-3 text-right text-teal-300 font-bold tabular-nums">{scaleV.toFixed(2)} V</td>
                    <td className="py-1.5 px-3 text-[11px] font-sans text-slate-400">Điện áp vật lý quy đổi (Task 5)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-1.5 px-3 text-white font-semibold">Tank_Level_Pct</td>
                    <td className="py-1.5 px-3 text-cyan-400">%MD24</td>
                    <td className="py-1.5 px-3 text-slate-400">Real</td>
                    <td className="py-1.5 px-3 text-right text-teal-300 font-bold tabular-nums">{tankLevel.toFixed(1)} %</td>
                    <td className="py-1.5 px-3 text-[11px] font-sans text-slate-400">Mức nước bể chứa (Task 7)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-1.5 px-3 text-white font-semibold">Pump_CMD</td>
                    <td className="py-1.5 px-3 text-cyan-400">%Q0.0</td>
                    <td className="py-1.5 px-3 text-slate-400">Bool</td>
                    <td className="py-1.5 px-3 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pumpCmd ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {pumpCmd ? 'TRUE' : 'FALSE'}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-[11px] font-sans text-slate-400">Bơm cấp bồn (Hysteresis 30%-70%)</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-1.5 px-3 text-white font-semibold">ShockAlm</td>
                    <td className="py-1.5 px-3 text-cyan-400">%Q0.1</td>
                    <td className="py-1.5 px-3 text-slate-400">Bool</td>
                    <td className="py-1.5 px-3 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        shockAlm ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {shockAlm ? 'TRUE' : 'FALSE'}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-[11px] font-sans text-slate-400">Báo sốc khi |RoC| &gt; 30%/s (Task 10)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
