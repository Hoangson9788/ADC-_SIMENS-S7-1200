import React from 'react';
import { Cpu, FileText } from 'lucide-react';

interface HeaderProps {
  activeTab: 'simulation' | 'tasks' | 'hmi' | 'esp32';
  setActiveTab: (tab: 'simulation' | 'tasks' | 'hmi' | 'esp32') => void;
  completedCount: number;
  totalTasks: number;
  onOpenRubric: () => void;
  onOpenTags: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  completedCount,
  totalTasks,
  onOpenRubric,
  onOpenTags,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a href="#" className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-900/30 text-white">
            <Cpu className="w-4 h-4" />
          </span>
          <span>S7-1200 LAB 3</span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'simulation' ? 'text-teal-400 border-b-2 border-teal-400 pb-1' : 'text-slate-400'
            }`}
          >
            Mô phỏng PLC
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'tasks' ? 'text-teal-400 border-b-2 border-teal-400 pb-1' : 'text-slate-400'
            }`}
          >
            10 Bài tập
          </button>
          <button
            onClick={() => setActiveTab('hmi')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'hmi' ? 'text-teal-400 border-b-2 border-teal-400 pb-1' : 'text-slate-400'
            }`}
          >
            HMI &amp; PLCSIM
          </button>
          <button
            onClick={() => setActiveTab('esp32')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'esp32' ? 'text-teal-400 border-b-2 border-teal-400 pb-1' : 'text-slate-400'
            }`}
          >
            ESP32 &amp; IoT
          </button>
          <button
            onClick={onOpenTags}
            className="transition-colors whitespace-nowrap shrink-0 text-slate-400 hover:text-white"
          >
            Bảng Tags
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenRubric}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="hidden sm:inline">Phiếu chấm </span>Rubric ({completedCount}/{totalTasks})
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
