import React from 'react';
import { TaskData } from '../types';
import { 
  CheckCircle2, 
  Cpu, 
  HelpCircle, 
  Calculator, 
  Gauge, 
  GitBranch, 
  Activity, 
  ChevronRight 
} from 'lucide-react';

interface TaskOverviewProps {
  tasks: TaskData[];
  selectedTaskId: number;
  onSelectTask: (id: number) => void;
}

export const TaskOverview: React.FC<TaskOverviewProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
}) => {
  const getCategoryIcon = (category: TaskData['category']) => {
    switch (category) {
      case 'hardware':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'theory':
        return <HelpCircle className="w-4 h-4 text-sky-400" />;
      case 'math':
        return <Calculator className="w-4 h-4 text-emerald-400" />;
      case 'control':
        return <Gauge className="w-4 h-4 text-teal-400" />;
      case 'grafcet':
        return <GitBranch className="w-4 h-4 text-indigo-400" />;
      case 'derivative':
        return <Activity className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Danh Sách 10 Bài Tập Thực Hành Lab 3 (S7-1200)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chọn bài tập để xem mã nguồn LAD/SCL, giải thích lý thuyết chi tiết và mô phỏng tương tác
          </p>
        </div>
        <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-800/60">
          10 / 10 Bài Đã Giải
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {tasks.map(task => {
          const isSelected = task.id === selectedTaskId;
          return (
            <button
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-teal-500/15 border-teal-400 ring-1 ring-teal-400 text-white shadow-md shadow-teal-950'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3 overflow-hidden">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  isSelected 
                    ? 'bg-teal-500 text-slate-950 font-bold border-teal-400' 
                    : 'bg-slate-900 text-teal-300 border-slate-800'
                }`}>
                  <span className="font-mono text-xs font-bold">{task.id}</span>
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {task.learningOutcome}
                    </span>
                    <span className="text-[10px] text-slate-500">Trang {task.pdfPage}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate mt-0.5">
                    {task.titleVi}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {task.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-teal-400 translate-x-0.5' : 'text-slate-600'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
