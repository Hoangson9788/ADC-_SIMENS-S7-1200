import React from 'react';
import { ShieldAlert, AlertCircle, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

interface CleanroomHysteresisVisualizerProps {
  engFilt: number;
  hiAlm: boolean;
  loAlm: boolean;
  setVoltage: React.Dispatch<React.SetStateAction<number>>;
}

export const CleanroomHysteresisVisualizer: React.FC<CleanroomHysteresisVisualizerProps> = ({
  engFilt,
  hiAlm,
  loAlm,
  setVoltage,
}) => {
  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Đặc tuyến Trễ Hysteresis Cảnh báo Phòng Sạch (Task 6)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Dải trễ 2%: HiSet = 80% (Reset &lt; 78%) · LoSet = 20% (Reset &gt; 22%)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
            loAlm ? 'bg-blue-950 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${loAlm ? 'bg-blue-400' : 'bg-slate-700'}`}></span>
            LoAlm: {loAlm ? 'ON' : 'OFF'}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
            hiAlm ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${hiAlm ? 'bg-amber-400' : 'bg-slate-700'}`}></span>
            HiAlm: {hiAlm ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Interactive Hysteresis Axis Visualization */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Thanh đo Tín hiệu Phần trăm (0 .. 100%)</span>
          <span className="font-mono text-teal-300 font-bold text-sm">{engFilt.toFixed(1)} %</span>
        </div>

        {/* Bar with Zones */}
        <div className="relative h-10 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center">
          {/* Lo Alarm Active Zone (<20%) */}
          <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-blue-500/20 border-r border-blue-500/50 flex items-center justify-center text-[10px] text-blue-300 font-mono">
            LoAlm ON (&lt;20%)
          </div>

          {/* Lo Deadband (20% - 22%) */}
          <div className="absolute left-[20%] top-0 bottom-0 w-[2%] bg-blue-500/10 border-r border-blue-500/30"></div>

          {/* Normal Zone (22% - 78%) */}
          <div className="absolute left-[22%] top-0 bottom-0 w-[56%] bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-400 font-medium">
            VÙNG BÌNH THƯỜNG (AN TOÀN)
          </div>

          {/* Hi Deadband (78% - 80%) */}
          <div className="absolute left-[78%] top-0 bottom-0 w-[2%] bg-amber-500/10 border-l border-amber-500/30"></div>

          {/* Hi Alarm Active Zone (>80%) */}
          <div className="absolute left-[80%] top-0 bottom-0 right-0 bg-amber-500/20 border-l border-amber-500/50 flex items-center justify-center text-[10px] text-amber-300 font-mono">
            HiAlm ON (&gt;80%)
          </div>

          {/* Current Needle Indicator */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50 z-10 transition-all duration-75 flex flex-col items-center justify-between"
            style={{ left: `${Math.min(100, Math.max(0, engFilt))}%` }}
          >
            <div className="w-2.5 h-2 bg-teal-400 rounded-b"></div>
            <div className="w-2.5 h-2 bg-teal-400 rounded-t"></div>
          </div>
        </div>

        {/* Ticks and Markers */}
        <div className="relative h-6 text-[11px] font-mono text-slate-500">
          <span className="absolute left-0">0%</span>
          <span className="absolute left-[20%] -translate-x-1/2 text-blue-400 font-bold">20% Set</span>
          <span className="absolute left-[22%] -translate-x-1/2 text-blue-300">22% Rst</span>
          <span className="absolute left-[50%] -translate-x-1/2 text-slate-400">50%</span>
          <span className="absolute left-[78%] -translate-x-1/2 text-amber-300">78% Rst</span>
          <span className="absolute left-[80%] -translate-x-1/2 text-amber-400 font-bold">80% Set</span>
          <span className="absolute right-0">100%</span>
        </div>
      </div>

      {/* SR Flip-Flop Live State Logic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Hi Alarm SR Latch */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          hiAlm ? 'bg-amber-950/30 border-amber-500/50' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between font-bold text-slate-300 mb-2">
            <span>Khối Chốt SR - HiAlm (Mức Cao)</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
              hiAlm ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              Q = {hiAlm ? 'TRUE' : 'FALSE'}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className={`flex justify-between ${engFilt > 80.0 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
              <span>Chân S1 (Set): IN &gt; 80.0%</span>
              <span>{engFilt > 80.0 ? '1 (Active)' : '0'}</span>
            </div>
            <div className={`flex justify-between ${engFilt < 78.0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <span>Chân R (Reset): IN &lt; 78.0%</span>
              <span>{engFilt < 78.0 ? '1 (Active)' : '0'}</span>
            </div>
            <div className="text-[10px] font-sans text-slate-400 pt-1 border-t border-slate-800">
              Trong khoảng [78% .. 80%]: Cả S1 và R đều bằng 0 → SR giữ nguyên trạng thái trước đó!
            </div>
          </div>
        </div>

        {/* Lo Alarm SR Latch */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          loAlm ? 'bg-blue-950/30 border-blue-500/50' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between font-bold text-slate-300 mb-2">
            <span>Khối Chốt SR - LoAlm (Mức Thấp)</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
              loAlm ? 'bg-blue-400 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              Q = {loAlm ? 'TRUE' : 'FALSE'}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className={`flex justify-between ${engFilt < 20.0 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <span>Chân S1 (Set): IN &lt; 20.0%</span>
              <span>{engFilt < 20.0 ? '1 (Active)' : '0'}</span>
            </div>
            <div className={`flex justify-between ${engFilt > 22.0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <span>Chân R (Reset): IN &gt; 22.0%</span>
              <span>{engFilt > 22.0 ? '1 (Active)' : '0'}</span>
            </div>
            <div className="text-[10px] font-sans text-slate-400 pt-1 border-t border-slate-800">
              Trong khoảng [20% .. 22%]: Cả S1 và R đều bằng 0 → SR giữ nguyên trạng thái trước đó!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
