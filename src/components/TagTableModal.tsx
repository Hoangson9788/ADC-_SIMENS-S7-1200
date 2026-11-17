import React, { useState } from 'react';
import { PLCTag } from '../types';
import { X, Copy, Check, Table, Download } from 'lucide-react';

interface TagTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: PLCTag[];
}

export const TagTableModal: React.FC<TagTableModalProps> = ({ isOpen, onClose, tags }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyTags = () => {
    const text = tags.map(t => `${t.name}\t${t.dataType}\t${t.address}\t${t.comment}`).join('\n');
    navigator.clipboard.writeText(`Name\tData type\tAddress\tComment\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Bảng Ký Hiệu PLC Tags Chuẩn Cho Dự Án Lab 3 (S7-1200)
              </h3>
              <p className="text-xs text-slate-400">
                Khai báo trong "PLC tags" của TIA Portal để sử dụng cho toàn bộ các Task 1 đến 10
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

        {/* Action Bar */}
        <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Tổng cộng: <strong className="text-white">{tags.length} biến</strong> (Input, Output, Memory Word & DWord)
          </span>
          <button
            onClick={handleCopyTags}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép bảng!' : 'Sao chép dạng bảng TIA Portal'}</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Tên Tag (Name)</th>
                  <th className="py-2.5 px-4">Kiểu Dữ Liệu (Data Type)</th>
                  <th className="py-2.5 px-4">Địa Chỉ (Address)</th>
                  <th className="py-2.5 px-4">Ghi Chú & Nhiệm Vụ (Comment)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {tags.map((tag, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="py-2 px-4 text-white font-bold">{tag.name}</td>
                    <td className="py-2 px-4 text-teal-400 font-semibold">{tag.dataType}</td>
                    <td className="py-2 px-4 text-cyan-300">{tag.address}</td>
                    <td className="py-2 px-4 text-slate-400 font-sans text-xs">{tag.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>* Mẹo: Trong TIA Portal, mở PLC Tags và nhấn Ctrl+V để dán trực tiếp.</span>
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
