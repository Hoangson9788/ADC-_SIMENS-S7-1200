import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PLCSimulator } from './components/PLCSimulator';
import { TaskOverview } from './components/TaskOverview';
import { TaskDetail } from './components/TaskDetail';
import { TagTableModal } from './components/TagTableModal';
import { RubricModal } from './components/RubricModal';
import { ESP32Visualizer } from './components/ESP32Visualizer';
import { HMIPLCSimVisualizer } from './components/HMIPLCSimVisualizer';
import { LAB_TASKS, PLC_TAGS } from './data/labData';
import {
  computeAnalogPipeline,
  evaluateCleanroomHysteresis,
  evaluateTankPumpHysteresis,
  evaluateTemperatureZone,
  computeRoC,
} from './utils/plcEngine';
import { Table, Wifi, Monitor } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulation' | 'tasks' | 'hmi' | 'esp32'>('simulation');
  const [selectedTaskId, setSelectedTaskId] = useState<number>(1);
  const [isRubricOpen, setIsRubricOpen] = useState<boolean>(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState<boolean>(false);

  // PLC Real-time Process Values
  const [voltage, setVoltage] = useState<number>(5.0); // 0.0 - 10.0 V
  const [tankLevel, setTankLevel] = useState<number>(50.0); // 0.0 - 100.0 %
  const [temperature, setTemperature] = useState<number>(22.0); // °C
  const [sampleTimeMs, setSampleTimeMs] = useState<number>(10); // 10ms or 20ms

  // Hysteresis Latches
  const [hiAlm, setHiAlm] = useState<boolean>(false);
  const [loAlm, setLoAlm] = useState<boolean>(false);
  const [pumpCmd, setPumpCmd] = useState<boolean>(false);

  // Rate of Change (RoC) and Shock Alarm
  const [roc, setRoc] = useState<number>(0.0);
  const [shockAlm, setShockAlm] = useState<boolean>(false);
  const prevValRef = useRef<number>(50.0);
  const shockTimerRef = useRef<number | null>(null);

  // Calculated Pipeline Values via plcEngine
  const { rawIW64, normPct, scaleV, engFilt } = computeAnalogPipeline(voltage);

  // Task 6: Cleanroom Hysteresis SR Logic
  useEffect(() => {
    setHiAlm((prevHi) => evaluateCleanroomHysteresis(engFilt, { hiAlm: prevHi, loAlm }).hiAlm);
    setLoAlm((prevLo) => evaluateCleanroomHysteresis(engFilt, { hiAlm, loAlm: prevLo }).loAlm);
  }, [engFilt]);

  // Task 7: Tank Pump Hysteresis SR Logic
  useEffect(() => {
    setPumpCmd((prev) => evaluateTankPumpHysteresis(tankLevel, prev));
  }, [tankLevel]);

  // Task 8 & 9: Temperature Zones
  const { qCold, qNormal, qHot } = evaluateTemperatureZone(temperature);

  // Task 10: RoC Calculation on voltage changes
  useEffect(() => {
    const currentVal = engFilt;
    const prev = prevValRef.current;
    const { roc: finalRoc, shockAlm: isShock } = computeRoC(currentVal, prev, sampleTimeMs);
    setRoc(finalRoc);

    if (isShock) {
      setShockAlm(true);
      if (shockTimerRef.current) window.clearTimeout(shockTimerRef.current);
      shockTimerRef.current = window.setTimeout(() => {
        setShockAlm(false);
      }, 1500);
    }

    prevValRef.current = currentVal;
  }, [voltage, engFilt, sampleTimeMs]);

  // Flick Fast Action to trigger shock alarm
  const handleFlickFast = () => {
    const step = voltage > 5.0 ? -4.5 : 4.5;
    const newV = Math.min(10.0, Math.max(0.0, voltage + step));
    const tsSec = sampleTimeMs / 1000.0;
    const jumpRoc = ((newV - voltage) * 10.0) / tsSec; // High derivative
    
    setRoc(jumpRoc);
    setShockAlm(true);
    setVoltage(newV);

    if (shockTimerRef.current) window.clearTimeout(shockTimerRef.current);
    shockTimerRef.current = window.setTimeout(() => {
      setShockAlm(false);
      setRoc(0);
    }, 2000);
  };

  const selectedTask = LAB_TASKS.find(t => t.id === selectedTaskId) || LAB_TASKS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        completedCount={10}
        totalTasks={10}
        onOpenRubric={() => setIsRubricOpen(true)}
        onOpenTags={() => setIsTagModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Mobile Tab Switcher (Header nav handles md+) */}
        <div className="md:hidden flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors duration-75 whitespace-nowrap shrink-0 ${
              activeTab === 'simulation'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mô phỏng PLC
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors duration-75 whitespace-nowrap shrink-0 ${
              activeTab === 'tasks'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            10 Bài tập
          </button>
          <button
            onClick={() => setActiveTab('hmi')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors duration-75 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'hmi'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className={`w-3.5 h-3.5 ${activeTab === 'hmi' ? 'text-slate-950' : 'text-teal-400'}`} />
            <span>HMI &amp; PLCSIM</span>
          </button>
          <button
            onClick={() => setActiveTab('esp32')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors duration-75 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'esp32'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className={`w-3.5 h-3.5 ${activeTab === 'esp32' ? 'text-slate-950' : 'text-indigo-400'}`} />
            <span>ESP32 &amp; IoT</span>
          </button>
          <button
            onClick={() => setIsTagModalOpen(true)}
            className="px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white transition-colors duration-75 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Table className="w-3.5 h-3.5 text-teal-400" />
            <span>Bảng Tags</span>
          </button>
        </div>

        {/* Desktop Single-Line Workspace Context Bar */}
        <div className="hidden md:flex items-center justify-between gap-4 border-b border-slate-800 pb-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-semibold text-slate-200">
              {activeTab === 'simulation' && 'Bàn thực hành Mô phỏng PLC Tổng thể (Tasks 1–10)'}
              {activeTab === 'tasks' && 'Hướng dẫn & Code TIA Portal chi tiết 10 Bài thực hành'}
              {activeTab === 'hmi' && 'Thiết kế Màn hình SIMATIC HMI KTP700 & Kết nối S7-PLCSIM'}
              {activeTab === 'esp32' && 'Truyền dữ liệu Real-time sang ESP32 & MQTT / WebSocket'}
            </span>
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <span>TIA Portal V16–V19</span>
            <span aria-hidden="true">·</span>
            <span>CPU 1214C DC/DC/DC</span>
            <span aria-hidden="true">·</span>
            <span className="text-teal-400 font-mono font-semibold">10/10 Tasks Hoàn thành</span>
          </div>
        </div>

        {/* View Mode 1: Full Simulation Workbench */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <PLCSimulator
              voltage={voltage}
              setVoltage={setVoltage}
              rawIW64={rawIW64}
              normPct={normPct}
              scaleV={scaleV}
              engFilt={engFilt}
              hiAlm={hiAlm}
              loAlm={loAlm}
              tankLevel={tankLevel}
              setTankLevel={setTankLevel}
              pumpCmd={pumpCmd}
              temperature={temperature}
              setTemperature={setTemperature}
              qCold={qCold}
              qNormal={qNormal}
              qHot={qHot}
              roc={roc}
              shockAlm={shockAlm}
              sampleTimeMs={sampleTimeMs}
              setSampleTimeMs={setSampleTimeMs}
              onFlickFast={handleFlickFast}
            />

            {/* Quick Task Navigation Grid Below Simulation */}
            <div className="pt-4 border-t border-slate-800">
              <TaskOverview
                tasks={LAB_TASKS}
                selectedTaskId={selectedTaskId}
                onSelectTask={(id) => {
                  setSelectedTaskId(id);
                  setActiveTab('tasks');
                }}
              />
            </div>
          </div>
        )}

        {/* View Mode 2: Detailed Task Deep-dive */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Task Selector Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {LAB_TASKS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    t.id === selectedTaskId
                      ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span>Task {t.id}</span>
                  <span className="text-[10px] font-normal opacity-75">({t.learningOutcome})</span>
                </button>
              ))}
            </div>

            {/* Selected Task Detailed View */}
            <TaskDetail
              task={selectedTask}
              voltage={voltage}
              setVoltage={setVoltage}
              rawIW64={rawIW64}
              normPct={normPct}
              scaleV={scaleV}
              engFilt={engFilt}
              hiAlm={hiAlm}
              loAlm={loAlm}
              tankLevel={tankLevel}
              setTankLevel={setTankLevel}
              pumpCmd={pumpCmd}
              temperature={temperature}
              setTemperature={setTemperature}
              qCold={qCold}
              qNormal={qNormal}
              qHot={qHot}
              roc={roc}
              shockAlm={shockAlm}
              sampleTimeMs={sampleTimeMs}
              setSampleTimeMs={setSampleTimeMs}
              onFlickFast={handleFlickFast}
            />
          </div>
        )}

        {/* View Mode 3: HMI KTP700 & PLCSIM Integration */}
        {activeTab === 'hmi' && (
          <HMIPLCSimVisualizer
            voltage={voltage}
            setVoltage={setVoltage}
            rawIW64={rawIW64}
            normPct={normPct}
            scaleV={scaleV}
            engFilt={engFilt}
            hiAlm={hiAlm}
            loAlm={loAlm}
            tankLevel={tankLevel}
            setTankLevel={setTankLevel}
            pumpCmd={pumpCmd}
            temperature={temperature}
            setTemperature={setTemperature}
            qCold={qCold}
            qNormal={qNormal}
            qHot={qHot}
            roc={roc}
            shockAlm={shockAlm}
            sampleTimeMs={sampleTimeMs}
            setSampleTimeMs={setSampleTimeMs}
            onFlickFast={handleFlickFast}
          />
        )}

        {/* View Mode 4: ESP32 IoT Gateway Communication */}
        {activeTab === 'esp32' && (
          <ESP32Visualizer
            voltage={voltage}
            rawIW64={rawIW64}
            engFilt={engFilt}
            roc={roc}
            shockAlm={shockAlm}
            pumpCmd={pumpCmd}
            temperature={temperature}
            sampleTimeMs={sampleTimeMs}
            onFlickFast={handleFlickFast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 bg-slate-950 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <strong className="text-slate-400">LAB 3. ANALOG SIGNAL PROCESSING INSTRUCTIONS</strong> · Khoa Cơ Khí - Bộ môn Cơ Điện Tử · HCMUT - VNU
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsTagModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Bảng Ký hiệu Tags
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsRubricOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Phiếu Chấm Rubric
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TagTableModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={PLC_TAGS}
      />

      <RubricModal
        isOpen={isRubricOpen}
        onClose={() => setIsRubricOpen(false)}
        tasks={LAB_TASKS}
      />
    </div>
  );
}
