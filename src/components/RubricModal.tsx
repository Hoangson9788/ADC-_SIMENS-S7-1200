import React, { useState } from 'react';
import { TaskData } from '../types';
import { X, CheckCircle2, Award, Printer, User, Calendar } from 'lucide-react';

interface RubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskData[];
}

export const RubricModal: React.FC<RubricModalProps> = ({ isOpen, onClose, tasks }) => {
  const [studentName, setStudentName] = useState('Nguyễn Văn An - MSSV: 2011xxx');
  const [supervisor, setSupervisor] = useState('TS. / ThS. Giảng viên Hướng dẫn');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Phiếu Đánh Giá Thực Hành Lab 3 (Evaluation Rubric)
              </h3>
              <p className="text-xs text-slate-400">
                Theo mẫu đánh giá môn học Khoa Cơ Khí - Bộ môn Cơ Điện Tử (ĐHBK TP.HCM)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Evaluation Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-900">
          {/* Header Info Block */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" /> Tên Sinh Viên (Student's Name):
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-teal-400" /> Cán Bộ Hướng Dẫn (Supervisor):
              </label>
              <input
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          {/* Total Scores Highlight */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/50 to-emerald-950/50 border border-teal-500/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-teal-300 uppercase tracking-wide">
                Tổng Điểm Đạt Được (Total Scores)
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Mỗi bài hoàn thành đạt 1 điểm (check mark ✓), không hoàn thành (X)
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              10 / 10 <span className="text-sm font-sans font-normal text-slate-300">Điểm</span>
            </div>
          </div>

          {/* 10-Task Rubric Table Matching PDF exactly */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Bảng Đánh Giá Chi Tiết 10 Tasks (Rubric Table):
            </div>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-16 text-center">Task</th>
                    <th className="py-2.5 px-3">Tên Bài & Nội Dung Trọng Tâm</th>
                    <th className="py-2.5 px-3 w-28 text-center">Chuẩn L.O.</th>
                    <th className="py-2.5 px-3 w-24 text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 w-20 text-center">Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-900/50">
                      <td className="py-2 px-3 text-center font-mono font-bold text-white">
                        {task.id}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-white">{task.titleVi}</div>
                        <div className="text-[11px] text-slate-400">{task.title}</div>
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400">
                        {task.learningOutcome}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-xs font-mono">
                          ✓ ĐẠT
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-teal-300">
                        1.0
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Phiếu Chấm (Print Rubric)</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
