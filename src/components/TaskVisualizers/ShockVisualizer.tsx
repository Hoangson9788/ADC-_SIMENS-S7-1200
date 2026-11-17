import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Zap, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  Check, 
  Server, 
  Code2,
  Table
} from 'lucide-react';
import { ShockDataRecord } from '../../types';

interface ShockVisualizerProps {
  roc: number;
  shockAlm: boolean;
  sampleTimeMs: number;
  setSampleTimeMs: (ms: number) => void;
  onFlickFast: () => void;
  engFilt: number;
}

export const ShockVisualizer: React.FC<ShockVisualizerProps> = ({
  roc,
  shockAlm,
  sampleTimeMs,
  setSampleTimeMs,
  onFlickFast,
  engFilt,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [dataLogs, setDataLogs] = useState<ShockDataRecord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'stream' | 'real_plc_guide'>('stream');
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);
  const prevValRef = useRef<number>(engFilt);
  const startTimeRef = useRef<number>(Date.now());
  const logCounterRef = useRef<number>(0);

  // Real-time logger effect (captures data points every 100ms or when changes occur)
  useEffect(() => {
    if (!isRecording) return;

    const interval = window.setInterval(() => {
      const now = new Date();
      const elapsed = Date.now() - startTimeRef.current;
      const tsSec = sampleTimeMs / 1000.0;
      const current = engFilt;
      const prev = prevValRef.current;
      const absRoc = Math.abs(roc);

      logCounterRef.current += 1;
      const newRecord: ShockDataRecord = {
        id: logCounterRef.current,
        timestamp: now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0'),
        elapsedMs: elapsed,
        currentVal: Math.round(current * 100) / 100,
        prevVal: Math.round(prev * 100) / 100,
        tsSec: tsSec,
        roc: Math.round(roc * 10) / 10,
        absRoc: Math.round(absRoc * 10) / 10,
        shockAlm: shockAlm,
      };

      setDataLogs(prevLogs => {
        const nextLogs = [newRecord, ...prevLogs];
        // Keep max 200 records in memory
        return nextLogs.slice(0, 200);
      });

      prevValRef.current = current;
    }, 150);

    return () => clearInterval(interval);
  }, [isRecording, engFilt, roc, shockAlm, sampleTimeMs]);

  // Export to CSV for Excel
  const handleExportCSV = () => {
    if (dataLogs.length === 0) return;

    // Header with UTF-8 BOM for Microsoft Excel compatibility
    const header = 'STT,Thoi_Gian,Thoi_Gian_Troi_ms,Gia_Tri_Hien_Tai_Pct,Gia_Tri_Truoc_Pct,Chu_Ky_Ts_s,RoC_Pct_s,Tri_Tuyet_Doi_RoC,Canh_Bao_ShockAlm\n';
    const rows = dataLogs
      .slice()
      .reverse()
      .map(r => `${r.id},${r.timestamp},${r.elapsedMs},${r.currentVal},${r.prevVal},${r.tsSec},${r.roc},${r.absRoc},${r.shockAlm ? 'TRUE' : 'FALSE'}`)
      .join('\n');

    const csvContent = '\uFEFF' + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `S7_1200_Task10_ShockLog_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to TXT for Text Editor / Notepad
  const handleExportTXT = () => {
    if (dataLogs.length === 0) return;

    const maxRoc = Math.max(...dataLogs.map(r => r.absRoc), 0);
    const shockCount = dataLogs.filter(r => r.shockAlm).length;

    let txt = '========================================================================================\n';
    txt += '   SIEMENS S7-1200 PLC LAB 3 - TASK 10: REAL-TIME SHOCK & ROC DATA LOG REPORT\n';
    txt += '   Bo mon Co Dien Tu - Khoa Co Khi - DH Bach Khoa TP.HCM (HCMUT - VNU)\n';
    txt += '========================================================================================\n';
    txt += `Ngay gio xuat: ${new Date().toLocaleString('vi-VN')}\n`;
    txt += `Tong so mau ghi nhan: ${dataLogs.length} mau\n`;
    txt += `Chu ky lay mau Ts: ${sampleTimeMs} ms (${(sampleTimeMs / 1000).toFixed(3)} s)\n`;
    txt += `Nguong canh bao soc: 30.0 %/s\n`;
    txt += `Gia tri |RoC| cuc dai: ${maxRoc.toFixed(1)} %/s\n`;
    txt += `So lan kich hoat ShockAlm: ${shockCount} lan\n`;
    txt += '----------------------------------------------------------------------------------------\n';
    txt += 'STT   | Thoi Gian    | Elapsed(ms) | Current(%) | Prev(%) | RoC(%/s) | |RoC| | ShockAlm\n';
    txt += '----------------------------------------------------------------------------------------\n';

    dataLogs.slice().reverse().forEach(r => {
      txt += `${String(r.id).padEnd(6)}| ${r.timestamp.padEnd(13)}| ${String(r.elapsedMs).padStart(11)} | ${r.currentVal.toFixed(1).padStart(10)} | ${r.prevVal.toFixed(1).padStart(7)} | ${r.roc.toFixed(1).padStart(8)} | ${r.absRoc.toFixed(1).padStart(5)} | ${r.shockAlm ? 'ALARM ON' : 'OFF'}\n`;
    });

    txt += '========================================================================================\n';
    txt += 'Ket thuc file du lieu Task 10.\n';

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `S7_1200_Task10_ShockLog_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCsvClipboard = () => {
    if (dataLogs.length === 0) return;
    const header = 'STT\tThoi_Gian\tThoi_Gian_ms\tCurrent_Val\tPrev_Val\tTs_s\tRoC\tAbs_RoC\tShockAlm\n';
    const rows = dataLogs
      .slice(0, 50)
      .map(r => `${r.id}\t${r.timestamp}\t${r.elapsedMs}\t${r.currentVal}\t${r.prevVal}\t${r.tsSec}\t${r.roc}\t${r.absRoc}\t${r.shockAlm}`)
      .join('\n');

    navigator.clipboard.writeText(header + rows);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const maxRecordedRoc = Math.max(...dataLogs.map(r => r.absRoc), 0);
  const shockEventsCount = dataLogs.filter(r => r.shockAlm).length;

  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            Giám sát Tốc độ Biến thiên (RoC) & Xuất Dữ liệu Real-time (Task 10)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Ghi nhận luồng dữ liệu thời gian thực và xuất ra file Excel (.CSV) hoặc Text (.TXT)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
            shockAlm 
              ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse shadow-lg shadow-rose-950' 
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <AlertOctagon className={`w-3.5 h-3.5 ${shockAlm ? 'text-rose-400' : 'text-slate-600'}`} />
            ShockAlm (%Q0.1): {shockAlm ? 'TRIP (> 30 %/s)' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* Main Scope / Gauge Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left: RoC Gauge & Trip Status */}
        <div className="md:col-span-5 bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tốc độ Biến thiên Hiện tại (Current RoC)
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-4xl font-extrabold font-mono tracking-tight ${
                shockAlm ? 'text-rose-400' : 'text-teal-300'
              }`}>
                {roc > 0 ? `+${roc.toFixed(1)}` : roc.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-slate-400">%/giây (%/s)</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Độ lớn tuyệt đối: |RoC| = {Math.abs(roc).toFixed(1)} %/s · Max: {maxRecordedRoc.toFixed(1)} %/s
            </div>
          </div>

          {/* Threshold Comparison Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Ngưỡng báo sốc (Threshold)</span>
              <span className="font-mono text-rose-400 font-bold">30.0 %/s</span>
            </div>
            <div className="h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-75 ${
                  Math.abs(roc) > 30.0 ? 'bg-rose-500' : 'bg-teal-400'
                }`}
                style={{ width: `${Math.min(100, (Math.abs(roc) / 60) * 100)}%` }}
              ></div>
              <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-rose-400"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 %/s</span>
              <span className="text-rose-400">Ngưỡng 30 %/s</span>
              <span>60+ %/s</span>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={onFlickFast}
            className="w-full py-2.5 px-3 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950"
          >
            <Zap className="w-4 h-4 text-rose-400" />
            <span>Xoay Núm Cực Nhanh (Kích Sốc RoC &gt; 30%/s)</span>
          </button>
        </div>

        {/* Right: Sampling Period Ts & Configuration */}
        <div className="md:col-span-7 bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Chu kỳ lấy mẫu Ts (Cấu hình OB30 Cyclic Interrupt)</span>
            </div>
            <span className="text-[11px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
              Ts = {sampleTimeMs} ms ({(sampleTimeMs / 1000).toFixed(3)} s)
            </span>
          </div>

          {/* Ts Switcher */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400 block">
              Chọn chu kỳ lấy mẫu để kiểm chứng yêu cầu đề bài:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSampleTimeMs(10)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  sampleTimeMs === 10
                    ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs text-white">Ts = 10 ms (Chuẩn đề bài)</div>
                <div className="text-[11px] font-mono mt-1 opacity-80">
                  RoC = (Current - Prev) / 0.010
                </div>
              </button>

              <button
                onClick={() => setSampleTimeMs(20)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  sampleTimeMs === 20
                    ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs text-white">Ts = 20 ms (Gấp đôi chu kỳ)</div>
                <div className="text-[11px] font-mono mt-1 opacity-80">
                  RoC = (Current - Prev) / 0.020
                </div>
              </button>
            </div>
          </div>

          {/* Summary Metric Stats */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Mẫu Đã Ghi</div>
              <div className="text-lg font-bold text-teal-300">{dataLogs.length}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Số Lần Sốc</div>
              <div className="text-lg font-bold text-rose-400">{shockEventsCount}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Max |RoC|</div>
              <div className="text-lg font-bold text-amber-300">{maxRecordedRoc.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Data Logger Controls & Export Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Bảng Ghi Dữ Liệu Thời Gian Thực & Xuất File (Real-time Logger)
            </span>
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isRecording
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isRecording ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRecording ? 'Tạm Dừng Ghi' : 'Tiếp Tục Ghi'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={dataLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel (.CSV)</span>
            </button>

            <button
              onClick={handleExportTXT}
              disabled={dataLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất Text (.TXT)</span>
            </button>

            <button
              onClick={handleCopyCsvClipboard}
              disabled={dataLogs.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Sao chép dạng bảng vào Clipboard"
            >
              {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCsv ? 'Đã chép!' : 'Chép bảng'}</span>
            </button>

            <button
              onClick={() => setDataLogs([])}
              disabled={dataLogs.length === 0}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
              title="Xóa bộ đệm dữ liệu"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-tab Switcher: Live Stream vs Real PLC DataLog Guide */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveSubTab('stream')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              activeSubTab === 'stream' 
                ? 'bg-slate-800 text-teal-300 border border-slate-700' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Luồng Dữ Liệu Online ({dataLogs.length} bản ghi)
          </button>
          <button
            onClick={() => setActiveSubTab('real_plc_guide')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'real_plc_guide' 
                ? 'bg-slate-800 text-teal-300 border border-slate-700' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-teal-400" />
            <span>Cách Xuất File Trên PLC S7-1200 Thực Tế (DataLog & Trace)</span>
          </button>
        </div>

        {/* Sub-tab 1: Live Stream Table */}
        {activeSubTab === 'stream' && (
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 w-12 text-center">#</th>
                  <th className="py-2 px-3 w-28">Thời Gian</th>
                  <th className="py-2 px-3 text-right">Elapsed</th>
                  <th className="py-2 px-3 text-right">Current (%)</th>
                  <th className="py-2 px-3 text-right">Prev (%)</th>
                  <th className="py-2 px-3 text-right">RoC (%/s)</th>
                  <th className="py-2 px-3 text-right">|RoC|</th>
                  <th className="py-2 px-3 text-center">ShockAlm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {dataLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      Chưa có dữ liệu nào được ghi nhận. Vui lòng bật "Tiếp tục ghi" hoặc xoay núm biến trở.
                    </td>
                  </tr>
                ) : (
                  dataLogs.slice(0, 50).map(r => (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-slate-900/60 transition-colors ${
                        r.shockAlm ? 'bg-rose-950/30 text-rose-200 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-1.5 px-3 text-center text-slate-500">{r.id}</td>
                      <td className="py-1.5 px-3 text-slate-400">{r.timestamp}</td>
                      <td className="py-1.5 px-3 text-right text-slate-500">{r.elapsedMs} ms</td>
                      <td className="py-1.5 px-3 text-right text-teal-300 font-semibold">{r.currentVal.toFixed(1)}%</td>
                      <td className="py-1.5 px-3 text-right text-slate-400">{r.prevVal.toFixed(1)}%</td>
                      <td className={`py-1.5 px-3 text-right font-bold ${r.shockAlm ? 'text-rose-400' : 'text-slate-300'}`}>
                        {r.roc > 0 ? `+${r.roc.toFixed(1)}` : r.roc.toFixed(1)}
                      </td>
                      <td className={`py-1.5 px-3 text-right ${r.absRoc > 30.0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                        {r.absRoc.toFixed(1)}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.shockAlm ? 'bg-rose-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {r.shockAlm ? 'ALARM ON' : 'OFF'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-tab 2: Complete Guide on Physical PLC S7-1200 */}
        {activeSubTab === 'real_plc_guide' && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
              <Server className="w-4 h-4 text-teal-400" />
              <span>3 Phương Pháp Xuất Dữ Liệu Task 10 Sang Excel / Text Trên PLC Siemens Thật</span>
            </div>

            {/* Method 1: DataLogCreate & DataLogWrite */}
            <div className="space-y-2">
              <h5 className="font-bold text-teal-300 text-xs">
                1. Dùng tập lệnh Data Log tích hợp sẵn của S7-1200 (DataLogCreate & DataLogWrite):
              </h5>
              <p>
                PLC S7-1200 có sẵn các khối hàm ghi dữ liệu vào bộ nhớ Flash hoặc thẻ nhớ SIMATIC Memory Card dưới định dạng file <code>.CSV</code> chuẩn của Excel:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                <li><strong>DataLogCreate</strong>: Tạo file CSV với tên file (e.g. <code>'Shock_Log'</code>), số lượng bản ghi tối đa (ví dụ 10,000 dòng), và cấu trúc cột định nghĩa trong một Struct DB.</li>
                <li><strong>DataLogWrite</strong>: Gọi mỗi khi có sự kiện sốc hoặc chu kỳ lấy mẫu để ghi 1 dòng mới vào file.</li>
                <li><strong>Cách tải về máy tính</strong>: Bật tính năng <strong>Web Server</strong> của CPU S7-1200 trong Device Configuration → Vào trình duyệt gõ IP PLC (ví dụ <code>http://192.168.0.1</code>) → Chọn mục <strong>Data Logs</strong> → Nhấn Download file <code>Shock_Log.csv</code> mở trực tiếp bằng Excel!</li>
              </ul>

              <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-teal-200">
                <div className="text-slate-500 text-[10px] mb-1">// Mã SCL mẫu gọi DataLogWrite khi phát hiện sốc:</div>
                <code>
                  IF "ShockAlm" AND NOT "Prev_ShockAlm" THEN<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;"DataLogWrite_Instance"(REQ := TRUE, ID := "Log_ID");<br />
                  END_IF;
                </code>
              </div>
            </div>

            {/* Method 2: TIA Portal Trace */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h5 className="font-bold text-teal-300 text-xs">
                2. Dùng tính năng TIA Portal Trace (Đo lường & Lưu đồ thị tốc độ cao):
              </h5>
              <p>
                Đây là công cụ chuẩn đoán mạnh nhất không cần viết thêm dòng code nào:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                <li>Trong cây dự án TIA Portal → Mở thư mục <strong>Traces</strong> → Chọn <strong>Add new trace</strong>.</li>
                <li>Chọn tín hiệu cần đo: <code>"RoC"</code>, <code>"ShockAlm"</code>, <code>"AI0_PCT"</code>.</li>
                <li>Đặt chu kỳ lấy mẫu (Sampling): Chọn <strong>OB30 (Cyclic Interrupt)</strong> để lấy mẫu chính xác từng 10ms.</li>
                <li>Điều kiện kích hoạt (Trigger): Kích hoạt khi <code>"ShockAlm" == TRUE</code> (hoặc kích hoạt thủ công).</li>
                <li>Sau khi đo xong → Nhấp chuột phải vào đồ thị → Chọn <strong>Export trace data</strong> → Chọn định dạng <code>.CSV</code> để mở trên Excel.</li>
              </ul>
            </div>

            {/* Method 3: OPC UA / PC Communication */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <h5 className="font-bold text-teal-300 text-xs">
                3. Đọc qua giao tiếp máy tính (Python / Node-RED / OPC UA / Excel Data Streamer):
              </h5>
              <p className="text-slate-400">
                Có thể dùng thư viện <code>python-snap7</code> kết nối tới cổng Ethernet 102 của S7-1200 để đọc trực tiếp vùng nhớ <code>%MD32</code> (RoC) và <code>%Q0.1</code> (ShockAlm) mỗi 10ms rồi ghi thẳng vào file <code>.csv</code> hoặc kết nối Microsoft Excel Data Streamer.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
