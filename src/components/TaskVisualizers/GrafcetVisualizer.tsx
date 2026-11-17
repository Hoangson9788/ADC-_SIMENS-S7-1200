import React from 'react';
import { Flame, Snowflake, Sun, CheckCircle2, ArrowRight } from 'lucide-react';

interface GrafcetVisualizerProps {
  temperature: number;
  setTemperature: React.Dispatch<React.SetStateAction<number>>;
  qCold: boolean;
  qNormal: boolean;
  qHot: boolean;
  setVoltage: React.Dispatch<React.SetStateAction<number>>;
}

export const GrafcetVisualizer: React.FC<GrafcetVisualizerProps> = ({
  temperature,
  setTemperature,
  qCold,
  qNormal,
  qHot,
  setVoltage,
}) => {
  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            Sơ đồ SFC / GRAFCET & Logic Đèn Báo Nhiệt độ (Task 8 & 9)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân loại 3 vùng nhiệt độ: COLD (&lt; 15°C) · NORMAL (15°C .. 30°C) · HOT (&gt; 30°C)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Nhiệt độ hiện tại:</span>
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-teal-300 font-mono font-bold text-sm">
            {temperature.toFixed(1)} °C
          </span>
        </div>
      </div>

      {/* 3 Physical Output Indicator Lamps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Lamp COLD */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
          qCold 
            ? 'bg-sky-950/60 border-sky-400 text-sky-200 shadow-lg shadow-sky-950 ring-1 ring-sky-400' 
            : 'bg-slate-900/60 border-slate-800 text-slate-500'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            qCold ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-400/50' : 'bg-slate-800 text-slate-600'
          }`}>
            <Snowflake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">COLD (Lạnh)</span>
              <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">%Q1.0</span>
            </div>
            <div className="text-xs mt-0.5">
              Điều kiện: T &lt; 15.0 °C
            </div>
          </div>
        </div>

        {/* Lamp NORMAL */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
          qNormal 
            ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-950 ring-1 ring-emerald-400' 
            : 'bg-slate-900/60 border-slate-800 text-slate-500'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            qNormal ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-400/50' : 'bg-slate-800 text-slate-600'
          }`}>
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">NORMAL (Ổn định)</span>
              <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">%Q1.1</span>
            </div>
            <div className="text-xs mt-0.5">
              Điều kiện: 15.0 °C ≤ T ≤ 30.0 °C
            </div>
          </div>
        </div>

        {/* Lamp HOT */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
          qHot 
            ? 'bg-rose-950/60 border-rose-400 text-rose-200 shadow-lg shadow-rose-950 ring-1 ring-rose-400' 
            : 'bg-slate-900/60 border-slate-800 text-slate-500'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            qHot ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-400/50' : 'bg-slate-800 text-slate-600'
          }`}>
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">HOT (Nóng)</span>
              <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">%Q1.2</span>
            </div>
            <div className="text-xs mt-0.5">
              Điều kiện: T &gt; 30.0 °C
            </div>
          </div>
        </div>
      </div>

      {/* Interactive GRAFCET (IEC 60848) Diagram */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 overflow-x-auto">
        <div className="text-xs font-semibold text-slate-300 mb-2">
          Sơ đồ Tuần tự GRAFCET (IEC 60848 Standard Sequential Function Chart):
        </div>
        
        <svg viewBox="0 0 760 220" className="w-full h-auto min-w-[620px] font-mono">
          {/* STEP 1: COLD (Initial Step - Double Border) */}
          <g transform="translate(60, 40)">
            {/* Outer rect for initial step */}
            <rect 
              x="0" y="0" width="70" height="60" rx="4" 
              fill={qCold ? '#0284c7' : '#0f172a'} 
              stroke={qCold ? '#38bdf8' : '#334155'} 
              strokeWidth="2" 
            />
            {/* Inner rect */}
            <rect 
              x="5" y="5" width="60" height="50" rx="3" 
              fill={qCold ? '#0369a1' : '#1e293b'} 
              stroke={qCold ? '#bae6fd' : '#475569'} 
              strokeWidth="1.5" 
            />
            <text x="35" y="35" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">1</text>
            <text x="35" y="80" fill={qCold ? '#38bdf8' : '#94a3b8'} fontSize="11" textAnchor="middle">COLD</text>

            {/* Action Box */}
            <line x1="70" y1="30" x2="105" y2="30" stroke="#64748b" strokeWidth="2" />
            <rect x="105" y="10" width="110" height="40" rx="4" fill="#090d16" stroke="#0ea5e9" strokeWidth="1.5" />
            <text x="160" y="27" fill="#67e8f9" fontSize="11" fontWeight="bold" textAnchor="middle">Q1.0 := 1</text>
            <text x="160" y="42" fill="#94a3b8" fontSize="9" textAnchor="middle">Non-stored (N)</text>
          </g>

          {/* Transition 1 -> 2: Temperature >= 15.0 */}
          <g transform="translate(230, 70)">
            <line x1="0" y1="0" x2="50" y2="0" stroke="#64748b" strokeWidth="2" />
            <line x1="25" y1="-10" x2="25" y2="10" stroke={temperature >= 15.0 ? '#34d399' : '#64748b'} strokeWidth="3" />
            <text x="25" y="-14" fill={temperature >= 15.0 ? '#34d399' : '#94a3b8'} fontSize="10" textAnchor="middle">
              T &gt;= 15.0 °C
            </text>
            {/* Return Transition 2 -> 1: Temperature < 15.0 */}
            <text x="25" y="24" fill={temperature < 15.0 ? '#38bdf8' : '#64748b'} fontSize="9" textAnchor="middle">
              (Ngược: T &lt; 15.0)
            </text>
          </g>

          {/* STEP 2: NORMAL (Single Border) */}
          <g transform="translate(320, 40)">
            <rect 
              x="0" y="0" width="60" height="60" rx="4" 
              fill={qNormal ? '#059669' : '#0f172a'} 
              stroke={qNormal ? '#34d399' : '#334155'} 
              strokeWidth="2" 
            />
            <text x="30" y="36" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">2</text>
            <text x="30" y="80" fill={qNormal ? '#34d399' : '#94a3b8'} fontSize="11" textAnchor="middle">NORMAL</text>

            {/* Action Box */}
            <line x1="60" y1="30" x2="95" y2="30" stroke="#64748b" strokeWidth="2" />
            <rect x="95" y="10" width="110" height="40" rx="4" fill="#090d16" stroke="#10b981" strokeWidth="1.5" />
            <text x="150" y="27" fill="#6ee7b7" fontSize="11" fontWeight="bold" textAnchor="middle">Q1.1 := 1</text>
            <text x="150" y="42" fill="#94a3b8" fontSize="9" textAnchor="middle">Non-stored (N)</text>
          </g>

          {/* Transition 2 -> 3: Temperature > 30.0 */}
          <g transform="translate(480, 70)">
            <line x1="0" y1="0" x2="50" y2="0" stroke="#64748b" strokeWidth="2" />
            <line x1="25" y1="-10" x2="25" y2="10" stroke={temperature > 30.0 ? '#f87171' : '#64748b'} strokeWidth="3" />
            <text x="25" y="-14" fill={temperature > 30.0 ? '#f87171' : '#94a3b8'} fontSize="10" textAnchor="middle">
              T &gt; 30.0 °C
            </text>
            {/* Return Transition 3 -> 2: Temperature <= 30.0 */}
            <text x="25" y="24" fill={temperature <= 30.0 ? '#34d399' : '#64748b'} fontSize="9" textAnchor="middle">
              (Ngược: T &lt;= 30.0)
            </text>
          </g>

          {/* STEP 3: HOT (Single Border) */}
          <g transform="translate(570, 40)">
            <rect 
              x="0" y="0" width="60" height="60" rx="4" 
              fill={qHot ? '#e11d48' : '#0f172a'} 
              stroke={qHot ? '#fb7185' : '#334155'} 
              strokeWidth="2" 
            />
            <text x="30" y="36" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">3</text>
            <text x="30" y="80" fill={qHot ? '#fb7185' : '#94a3b8'} fontSize="11" textAnchor="middle">HOT</text>

            {/* Action Box */}
            <line x1="60" y1="30" x2="95" y2="30" stroke="#64748b" strokeWidth="2" />
            <rect x="95" y="10" width="110" height="40" rx="4" fill="#090d16" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="150" y="27" fill="#fda4af" fontSize="11" fontWeight="bold" textAnchor="middle">Q1.2 := 1</text>
            <text x="150" y="42" fill="#94a3b8" fontSize="9" textAnchor="middle">Non-stored (N)</text>
          </g>

          {/* Return Links Arrows below */}
          <path d="M 330 110 L 330 160 L 105 160 L 105 110" stroke="#64748b" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
          <text x="215" y="175" fill="#94a3b8" fontSize="9" textAnchor="middle">Vòng tuần hoàn 2 chiều đảm bảo chỉ 1 bước tích cực</text>
        </svg>
      </div>

      {/* Quick Test Presets matching PDF */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-slate-400 font-semibold">Mốc thử nghiệm theo đề bài:</span>
        {[
          { t: 10, label: '10 °C → Q1.0 = ON (COLD)', active: Math.abs(temperature - 10) < 0.5 },
          { t: 22, label: '22 °C → Q1.1 = ON (NORMAL)', active: Math.abs(temperature - 22) < 0.5 },
          { t: 35, label: '35 °C → Q1.2 = ON (HOT)', active: Math.abs(temperature - 35) < 0.5 },
        ].map(item => (
          <button
            key={item.t}
            onClick={() => {
              setTemperature(item.t);
              setVoltage(item.t / 5);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              item.active 
                ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
