import React, { useState, useEffect } from 'react';
import { Waves, ArrowDown, ArrowUp, Play, Square, CheckCircle2, RotateCcw } from 'lucide-react';

interface TankPumpVisualizerProps {
  tankLevel: number;
  setTankLevel: React.Dispatch<React.SetStateAction<number>>;
  pumpCmd: boolean;
  setVoltage: React.Dispatch<React.SetStateAction<number>>;
}

export const TankPumpVisualizer: React.FC<TankPumpVisualizerProps> = ({
  tankLevel,
  setTankLevel,
  pumpCmd,
  setVoltage,
}) => {
  const [isDraining, setIsDraining] = useState<boolean>(false);

  // Auto pump inflow simulation when pump is ON, drain simulation when drain is active
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTankLevel(prev => {
        let delta = 0;
        if (pumpCmd) delta += 0.8; // Pump fills tank
        if (isDraining) delta -= 0.6; // Drain valve empties tank

        let next = prev + delta;
        if (next > 100) next = 100;
        if (next < 0) next = 0;
        const rounded = Math.round(next * 10) / 10;
        setVoltage(rounded / 10);
        return rounded;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [pumpCmd, isDraining, setTankLevel, setVoltage]);

  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            Mô phỏng Bồn Nước & Bơm Trễ 2 Mức (Task 7)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Bơm BẬT khi Mức &lt; 30% · TẮT khi Mức &gt; 70% · Giữ trạng thái trong dải [30% .. 70%]
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
            pumpCmd ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950' : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${pumpCmd ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`}></span>
            Pump_CMD (%Q0.0): {pumpCmd ? 'ON (ĐANG BƠM)' : 'OFF (DỪNG)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Side: Water Tank Physical Graphics */}
        <div className="md:col-span-6 bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
          <div className="relative w-48 h-64 border-4 border-slate-600 border-t-0 rounded-b-2xl bg-slate-950 overflow-hidden flex flex-col justify-end">
            {/* 70% High Threshold Guideline */}
            <div className="absolute top-[30%] left-0 right-0 border-b-2 border-dashed border-rose-500/70 z-10 flex items-center justify-between px-2 text-[10px] text-rose-300 font-mono">
              <span>70% (TẮT BƠM)</span>
              <span>HI-LIMIT</span>
            </div>

            {/* 30% Low Threshold Guideline */}
            <div className="absolute top-[70%] left-0 right-0 border-b-2 border-dashed border-emerald-500/70 z-10 flex items-center justify-between px-2 text-[10px] text-emerald-300 font-mono">
              <span>30% (BẬT BƠM)</span>
              <span>LO-LIMIT</span>
            </div>

            {/* Water Column Animation */}
            <div 
              className="w-full bg-gradient-to-t from-cyan-600 via-sky-500 to-cyan-400 transition-all duration-150 relative overflow-hidden"
              style={{ height: `${Math.min(100, Math.max(0, tankLevel))}%` }}
            >
              {/* Wave surface shimmer */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-white/20 animate-pulse"></div>
            </div>

            {/* Current Level Overlay in Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <span className="text-2xl font-black font-mono text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {tankLevel.toFixed(1)} %
              </span>
            </div>
          </div>

          {/* Inflow Pipe & Pump Indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`w-3 h-3 rounded-full ${pumpCmd ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`}></span>
            <span className="text-slate-300 font-semibold">
              Động cơ Bơm cấp (%Q0.0): {pumpCmd ? 'Hoạt động (Inflow Active)' : 'Nghỉ (Idle)'}
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Controls & State Machine */}
        <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">
              Điều khiển Mô phỏng Mức nước Thực tế:
            </div>

            {/* Level Slider */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Điều chỉnh mức trực tiếp</span>
                <span className="font-mono text-cyan-300 font-bold">{tankLevel.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={tankLevel}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTankLevel(val);
                  setVoltage(val / 10);
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% (Cạn)</span>
                <span className="text-emerald-400 font-bold">30% (Kích bơm)</span>
                <span className="text-rose-400 font-bold">70% (Ngắt bơm)</span>
                <span>100% (Đầy)</span>
              </div>
            </div>

            {/* Quick Test Buttons matching PDF Rubric */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setTankLevel(25);
                  setVoltage(2.5);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  Math.abs(tankLevel - 25) < 1 
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-white">Kiểm tra mốc 25%</div>
                <div className="text-[11px] text-emerald-400 mt-0.5">Yêu cầu: Bơm ON (✓)</div>
              </button>

              <button
                onClick={() => {
                  setTankLevel(75);
                  setVoltage(7.5);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  Math.abs(tankLevel - 75) < 1 
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-white">Kiểm tra mốc 75%</div>
                <div className="text-[11px] text-rose-400 mt-0.5">Yêu cầu: Bơm OFF (✓)</div>
              </button>
            </div>

            {/* Drain Valve Simulation Toggle */}
            <button
              onClick={() => setIsDraining(!isDraining)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                isDraining
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              <ArrowDown className={`w-3.5 h-3.5 ${isDraining ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
              <span>{isDraining ? 'Đang Mở Van Xả Nước (Mức đang giảm)' : 'Mở Van Xả Nước Tiêu Thụ'}</span>
            </button>
          </div>

          {/* Hysteresis Behavior Explanation Callout */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-bold text-white block mb-0.5">Quy tắc duy trì trạng thái:</span>
            Trong dải từ <strong>30% đến 70%</strong>, ngõ ra <code>%Q0.0</code> duy trì nguyên trạng thái trước đó. Nếu đang bơm dâng lên qua 30%, bơm vẫn tiếp tục chạy cho đến khi vượt 70%. Nếu đang xả cạn từ 70% xuống, bơm vẫn tắt cho đến khi chạm dưới 30%.
          </div>
        </div>
      </div>
    </div>
  );
};
