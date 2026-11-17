import React from 'react';
import { Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

interface WiringVisualizerProps {
  voltage: number;
}

export const WiringVisualizer: React.FC<WiringVisualizerProps> = ({ voltage }) => {
  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Sơ đồ Nguyên lý Đấu dây Biến trở vào CPU S7-1200 (Task 1)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Đấu nối tín hiệu áp 0–10V vào chân AI0 và nối chung cực âm (Common Ground 2M & M)
          </p>
        </div>
        <div className="bg-emerald-950/60 border border-emerald-500/50 px-2.5 py-1 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>VOM: {voltage.toFixed(2)} V</span>
        </div>
      </div>

      {/* SVG Wiring Schematic */}
      <div className="relative bg-slate-900 rounded-xl p-4 border border-slate-800 overflow-x-auto">
        <svg viewBox="0 0 800 320" className="w-full h-auto min-w-[650px] font-mono">
          <defs>
            <linearGradient id="wireRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
            <linearGradient id="wireCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="wireBlack" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>

          {/* Block 1: 24VDC Power Supply / 10V Divider */}
          <rect x="30" y="40" width="160" height="220" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <text x="110" y="70" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">POWER SUPPLY</text>
          <text x="110" y="88" fill="#94a3b8" fontSize="11" textAnchor="middle">24 VDC / 10 V Ref</text>

          {/* Terminals of Power Supply */}
          <circle cx="160" cy="120" r="7" fill="#ef4444" />
          <text x="145" y="124" fill="#fca5a5" fontSize="11" textAnchor="end">L+ (+10V)</text>

          <circle cx="160" cy="200" r="7" fill="#64748b" />
          <text x="145" y="204" fill="#cbd5e1" fontSize="11" textAnchor="end">M (0V)</text>

          {/* Block 2: Potentiometer (Biến trở chia áp) */}
          <rect x="270" y="50" width="180" height="200" rx="10" fill="#1e293b" stroke="#0ea5e9" strokeWidth="2" />
          <text x="360" y="80" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">POTENTIOMETER</text>
          <text x="360" y="98" fill="#94a3b8" fontSize="11" textAnchor="middle">Biến trở 10kΩ</text>

          {/* Potentiometer Dial Symbol */}
          <circle cx="360" cy="150" r="30" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
          <line 
            x1="360" 
            y1="150" 
            x2={360 + 22 * Math.cos((voltage / 10 * 270 - 135) * Math.PI / 180)} 
            y2={150 + 22 * Math.sin((voltage / 10 * 270 - 135) * Math.PI / 180)} 
            stroke="#22d3ee" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          <text x="360" y="195" fill="#22d3ee" fontSize="12" fontWeight="bold" textAnchor="middle">
            {voltage.toFixed(2)} V
          </text>

          {/* Potentiometer Terminals */}
          <circle cx="270" cy="120" r="6" fill="#ef4444" />
          <circle cx="450" cy="150" r="6" fill="#06b6d4" />
          <circle cx="270" cy="200" r="6" fill="#64748b" />
          <text x="440" y="135" fill="#67e8f9" fontSize="11" textAnchor="end">Wiper (Ra)</text>

          {/* Block 3: S7-1200 CPU Analog Inputs */}
          <rect x="550" y="30" width="220" height="250" rx="10" fill="#090d16" stroke="#14b8a6" strokeWidth="2" />
          <text x="660" y="60" fill="#2dd4bf" fontSize="13" fontWeight="bold" textAnchor="middle">S7-1200 CPU 1214C</text>
          <text x="660" y="78" fill="#94a3b8" fontSize="11" textAnchor="middle">Analog Terminals (AI 2)</text>

          {/* CPU Terminals */}
          <g transform="translate(560, 95)">
            <rect x="0" y="0" width="200" height="170" rx="6" fill="#1e293b" />
            
            {/* Terminal 2M */}
            <circle cx="20" cy="30" r="7" fill="#64748b" />
            <text x="35" y="34" fill="#f8fafc" fontSize="11" fontWeight="bold">2M (Analog GND)</text>

            {/* Terminal 0 (AI0) */}
            <circle cx="20" cy="70" r="7" fill="#06b6d4" />
            <text x="35" y="74" fill="#38bdf8" fontSize="11" fontWeight="bold">0 (AI0 / A+) %IW64</text>

            {/* Terminal 1 (AI1) */}
            <circle cx="20" cy="110" r="7" fill="#475569" />
            <text x="35" y="114" fill="#94a3b8" fontSize="11">1 (AI1 / B+) %IW66</text>

            {/* Terminal M */}
            <circle cx="20" cy="145" r="7" fill="#64748b" />
            <text x="35" y="149" fill="#94a3b8" fontSize="11">M (Power Ground)</text>
          </g>

          {/* WIRES (ĐƯỜNG DÂY NỐI) */}
          {/* Wire 1: Red L+ to Pot VCC */}
          <path d="M 160 120 L 270 120" stroke="url(#wireRed)" strokeWidth="3" fill="none" strokeDasharray="4 2" />
          <text x="215" y="112" fill="#ef4444" fontSize="10" textAnchor="middle">+10V / +VCC</text>

          {/* Wire 2: Ground Power supply to Pot GND */}
          <path d="M 160 200 L 270 200" stroke="url(#wireBlack)" strokeWidth="3" fill="none" />
          <text x="215" y="215" fill="#94a3b8" fontSize="10" textAnchor="middle">0V (GND)</text>

          {/* Wire 3: Cyan Wiper to AI0 Terminal 0 */}
          <path d="M 450 150 C 490 150, 520 165, 580 165" stroke="url(#wireCyan)" strokeWidth="3.5" fill="none" />
          <text x="515" y="148" fill="#22d3ee" fontSize="10" textAnchor="middle">Tín hiệu 0-10V</text>

          {/* Wire 4: Common Ground Pot GND to 2M and CPU M */}
          <path d="M 270 200 C 350 200, 480 220, 580 125" stroke="url(#wireBlack)" strokeWidth="3" fill="none" strokeDasharray="3 3" />
          <path d="M 580 125 L 580 240" stroke="url(#wireBlack)" strokeWidth="2" fill="none" />
          <text x="490" y="215" fill="#94a3b8" fontSize="9" textAnchor="middle">Common GND (2M nối M)</text>
        </svg>
      </div>

      {/* Safety Notice Callout */}
      <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-bold text-amber-300">Lưu ý an toàn thực nghiệm:</span> Ngõ vào Analog tích hợp trên CPU S7-1200 chỉ nhận điện áp tối đa <strong>10 VDC</strong>. Nếu dùng nguồn 24VDC cấp cho biến trở, bắt buộc phải có cầu phân áp hạn chế điện áp ra chân Wiper không vượt quá 10V. Chân <strong>2M</strong> phải được nối chung với chân <strong>M (0V)</strong> của nguồn để chống trôi điện thế (Floating ground) gây sai lệch bộ ADC!
        </div>
      </div>
    </div>
  );
};
