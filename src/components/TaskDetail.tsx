import React, { useState } from 'react';
import { TaskData } from '../types';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Code2, 
  BookOpen, 
  HelpCircle, 
  PlayCircle, 
  ListOrdered,
  FileCode,
  Layers
} from 'lucide-react';
import { WiringVisualizer } from './TaskVisualizers/WiringVisualizer';
import { CleanroomHysteresisVisualizer } from './TaskVisualizers/CleanroomHysteresisVisualizer';
import { TankPumpVisualizer } from './TaskVisualizers/TankPumpVisualizer';
import { GrafcetVisualizer } from './TaskVisualizers/GrafcetVisualizer';
import { ShockVisualizer } from './TaskVisualizers/ShockVisualizer';
import { LadderDiagram } from './LadderDiagram';
import { ExplanationRenderer } from './ExplanationRenderer';
import { TASK_LADDER_PROGRAMS } from '../data/ladderNetworks';

interface TaskDetailProps {
  task: TaskData;
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
  setSampleTimeMs: (ms: number) => void;
  onFlickFast: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
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
  const [activeTab, setActiveTab] = useState<'sim' | 'code' | 'explanation' | 'steps' | 'rubric'>('sim');
  const [codeLangView, setCodeLangView] = useState<'both' | 'lad' | 'scl'>('both');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(task.sclCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const ladderProgram = TASK_LADDER_PROGRAMS[task.id];
  const liveState = {
    voltage,
    rawIW64,
    normPct,
    scaleV,
    engFilt,
    hiAlm,
    loAlm,
    tankLevel,
    pumpCmd,
    temperature,
    qCold,
    qNormal,
    qHot,
    roc,
    shockAlm,
    sampleTimeMs,
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Task Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-mono text-xs font-bold border border-teal-500/40 whitespace-nowrap shrink-0">
                TASK {task.id}
              </span>
              <span className="text-xs text-slate-400 font-mono font-medium">
                Chuẩn đầu ra: {task.learningOutcome} · Trang PDF: {task.pdfPage}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {task.titleVi}
            </h2>
            <p className="text-xs text-slate-400">
              {task.title} — {task.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">1.0 / 1.0 Điểm Rubric</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation within Task */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sim')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'sim'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Mô phỏng Trực quan</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors duration-75 whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Code Ladder (LAD) &amp; SCL</span>
          </button>

          <button
            onClick={() => setActiveTab('explanation')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'explanation'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Giải thích Chi tiết & Nguyên lý</span>
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'steps'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Các bước TIA Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('rubric')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'rubric'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tiêu chí Chấm (Rubric Check)</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6 space-y-6">
        {/* TAB 1: Task Specific Visualizer */}
        {activeTab === 'sim' && (
          <div className="space-y-4">
            {task.id === 1 && <WiringVisualizer voltage={voltage} />}

            {task.id === 2 && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-400" />
                    4 Câu Hỏi Đánh Giá Kiến Thức Kênh Analog CPU S7-1200 (Task 2)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đối chiếu câu hỏi trắc nghiệm / điền khuyết trong đề bài với lý thuyết chuẩn của Siemens
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-teal-400 font-bold text-xs">Câu hỏi 1:</span>
                    <div className="text-white font-medium">
                      What type of analog signal is supported by the basic integrated AI channels of the S7-1200 CPU?
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-teal-500/30 text-teal-300 font-mono">
                      ✓ Đáp án: <strong>Voltage 0 – 10 V DC</strong> (Tín hiệu điện áp một chiều một đầu Single-ended).
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-teal-400 font-bold text-xs">Câu hỏi 2:</span>
                    <div className="text-white font-medium">
                      How many analog input channels are typically integrated on an S7-1200 CPU (e.g., CPU1212C or CPU1214C)?
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-teal-500/30 text-teal-300 font-mono">
                      ✓ Đáp án: <strong>2 kênh</strong> (AI 0 tại địa chỉ %IW64 và AI 1 tại %IW66).
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-teal-400 font-bold text-xs">Câu hỏi 3:</span>
                    <div className="text-white font-medium">
                      What is the standard resolution of the built-in analog input channels on the S7-1200 CPU?
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-teal-500/30 text-teal-300 font-mono">
                      ✓ Đáp án: <strong>10-bit</strong> phần cứng, biểu diễn thành số nguyên 16-bit INT từ <strong>0 đến 27648</strong>.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-teal-400 font-bold text-xs">Câu hỏi 4:</span>
                    <div className="text-white font-medium">
                      If a sensor outputs 5 V into a 0–10 V analog input channel, what percentage of the input range does this represent?
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-teal-500/30 text-teal-300 font-mono">
                      ✓ Đáp án: <strong>50% dải đo</strong> (5V / 10V = 50%, giá trị raw = 50% * 27648 = 13824).
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(task.id === 3 || task.id === 4 || task.id === 5) && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400" />
                    Khối Chuyển Đổi Tín hiệu Tương Ứng (Task {task.id})
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Quan sát sự chuyển đổi trực tiếp giữa tín hiệu thô, tỷ lệ chuẩn hóa và điện áp quy đổi
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1 Box */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    task.id === 3 ? 'bg-teal-950/40 border-teal-400 ring-1 ring-teal-400' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="text-xs font-bold text-teal-400 mb-1">TASK 3: MOVE IW64</div>
                    <div className="text-2xl font-bold font-mono text-white">{rawIW64}</div>
                    <div className="text-xs text-slate-400 mt-1">Dải: 0 .. 27648 counts</div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      0V: ~0 · 5V: ~13800 · 10V: ~27648
                    </div>
                  </div>

                  {/* Step 2 Box */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    task.id === 4 ? 'bg-teal-950/40 border-teal-400 ring-1 ring-teal-400' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="text-xs font-bold text-teal-400 mb-1">TASK 4: NORM_X</div>
                    <div className="text-2xl font-bold font-mono text-white">{normPct.toFixed(4)}</div>
                    <div className="text-xs text-slate-400 mt-1">Dải: 0.0 .. 1.0 Real</div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      0V: ~0.0 · 5V: ~0.50 · 10V: ~1.0
                    </div>
                  </div>

                  {/* Step 3 Box */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    task.id === 5 ? 'bg-teal-950/40 border-teal-400 ring-1 ring-teal-400' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="text-xs font-bold text-teal-400 mb-1">TASK 5: SCALE_X</div>
                    <div className="text-2xl font-bold font-mono text-white">{scaleV.toFixed(2)} V</div>
                    <div className="text-xs text-slate-400 mt-1">Dải: 0.0 .. 10.0 V</div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      Sai số so với VOM ≤ ±0.1 V
                    </div>
                  </div>
                </div>
              </div>
            )}

            {task.id === 6 && (
              <CleanroomHysteresisVisualizer
                engFilt={engFilt}
                hiAlm={hiAlm}
                loAlm={loAlm}
                setVoltage={setVoltage}
              />
            )}

            {task.id === 7 && (
              <TankPumpVisualizer
                tankLevel={tankLevel}
                setTankLevel={setTankLevel}
                pumpCmd={pumpCmd}
                setVoltage={setVoltage}
              />
            )}

            {(task.id === 8 || task.id === 9) && (
              <GrafcetVisualizer
                temperature={temperature}
                setTemperature={setTemperature}
                qCold={qCold}
                qNormal={qNormal}
                qHot={qHot}
                setVoltage={setVoltage}
              />
            )}

            {task.id === 10 && (
              <ShockVisualizer
                roc={roc}
                shockAlm={shockAlm}
                sampleTimeMs={sampleTimeMs}
                setSampleTimeMs={setSampleTimeMs}
                onFlickFast={onFlickFast}
                engFilt={engFilt}
              />
            )}
          </div>
        )}

        {/* TAB 2: PLC Code (LAD & SCL) */}
        {activeTab === 'code' && (
          <div className="space-y-5">
            {/* Language View Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-300 font-medium">
                Ngôn ngữ lập trình TIA Portal cho <strong className="text-white">Task {task.id}</strong>:
              </div>
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs max-w-full">
                <button
                  onClick={() => setCodeLangView('both')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                    codeLangView === 'both'
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cả LAD &amp; SCL
                </button>
                <button
                  onClick={() => setCodeLangView('lad')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                    codeLangView === 'lad'
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chỉ Ladder (LAD)
                </button>
                <button
                  onClick={() => setCodeLangView('scl')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                    codeLangView === 'scl'
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chỉ SCL
                </button>
              </div>
            </div>

            {/* Interactive Visual Ladder Logic Diagram (LAD) */}
            {(codeLangView === 'both' || codeLangView === 'lad') && ladderProgram && (
              <LadderDiagram program={ladderProgram} liveState={liveState} />
            )}

            {/* SCL Code Box with Copy Button */}
            {(codeLangView === 'both' || codeLangView === 'scl') && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-xs font-bold text-white font-mono">
                      Mã nguồn Structured Control Language (SCL) — Task {task.id}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép SCL'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-teal-200 overflow-x-auto leading-relaxed selection:bg-teal-900 selection:text-white">
                  <code>{task.sclCode}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Academic Explanation */}
        {activeTab === 'explanation' && (
          <div className="bg-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white pb-3 border-b border-slate-800">
              <BookOpen className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Giải thích Nguyên lý Khoa học &amp; Kỹ thuật Chi tiết (Task {task.id})</span>
            </div>
            <ExplanationRenderer text={task.explanationVi} />
          </div>
        )}

        {/* TAB 4: TIA Portal Step-by-Step */}
        {activeTab === 'steps' && (
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white pb-3 border-b border-slate-800">
              <ListOrdered className="w-4 h-4 text-teal-400" />
              <span>Các bước Thao tác Thực hành trên Phần mềm TIA Portal (Siemens)</span>
            </div>

            <ol className="space-y-3">
              {task.tiaPortalSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                  <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-teal-500/40">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* TAB 5: Rubric Check Checklist */}
        {activeTab === 'rubric' && (
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tiêu chí Đánh giá Phiếu Chấm Thực Hành (Rubric Evaluation)</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                1 điểm / 1 bài
              </span>
            </div>

            <div className="space-y-2.5">
              {task.evaluationItems.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                      ✓
                    </span>
                    <span className="text-slate-200 font-medium">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{item.expectedCondition}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
