import React, { useState } from 'react';
import {
  LadderBoxElement,
  LadderCoilElement,
  LadderCompareElement,
  LadderContactElement,
  LadderElement,
  LivePLCState,
  TaskLadderProgram,
} from '../types';
import { evaluateElementFlow, formatLadderAsText } from '../utils/ladderEvaluator';
import { Copy, Check, Eye, Layers } from 'lucide-react';

interface LadderDiagramProps {
  program: TaskLadderProgram;
  liveState: LivePLCState;
}

const WireSegment: React.FC<{ energized: boolean; monitorOn: boolean; widthClass?: string }> = ({
  energized,
  monitorOn,
  widthClass = 'w-5 sm:w-7',
}) => (
  <div
    className={`h-[2px] ${widthClass} shrink-0 transition-colors duration-100 ${
      monitorOn && energized ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]' : 'bg-slate-600'
    }`}
  />
);

const ContactNode: React.FC<{
  el: LadderContactElement;
  monitorOn: boolean;
  powerIn: boolean;
  liveState: LivePLCState;
}> = ({ el, monitorOn, powerIn, liveState }) => {
  const isClosed = el.active(liveState);
  const energized = monitorOn && powerIn && isClosed;

  return (
    <div className="flex flex-col items-center shrink-0 min-w-[78px]">
      <span className="text-[10px] font-mono text-teal-300 font-semibold leading-tight mb-0.5 whitespace-nowrap">
        {el.tag}
      </span>
      <div className="flex items-center">
        <WireSegment energized={powerIn} monitorOn={monitorOn} widthClass="w-2.5" />
        <div
          className={`px-2 py-1 border-x-2 font-mono text-xs font-bold leading-none transition-colors ${
            energized
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
              : monitorOn && isClosed
                ? 'border-emerald-500/60 text-emerald-400'
                : 'border-slate-400 text-slate-300'
          }`}
        >
          {el.variant === 'NO' ? '  ' : ' / '}
        </div>
        <WireSegment energized={powerIn && isClosed} monitorOn={monitorOn} widthClass="w-2.5" />
      </div>
      {el.address && (
        <span className="text-[9px] font-mono text-slate-500 mt-0.5 whitespace-nowrap">{el.address}</span>
      )}
    </div>
  );
};

const CompareNode: React.FC<{
  el: LadderCompareElement;
  monitorOn: boolean;
  powerIn: boolean;
  liveState: LivePLCState;
}> = ({ el, monitorOn, powerIn, liveState }) => {
  const isTrue = el.active(liveState);
  const energized = monitorOn && powerIn && isTrue;
  const readout = el.liveReadout ? el.liveReadout(liveState) : null;

  return (
    <div className="flex items-center shrink-0">
      <div
        className={`rounded-md border px-2.5 py-1.5 text-[10px] font-mono bg-slate-900 min-w-[110px] transition-colors ${
          energized
            ? 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.18)]'
            : 'border-slate-700'
        }`}
      >
        <div
          className={`text-center font-bold border-b pb-0.5 mb-1 whitespace-nowrap ${
            energized ? 'text-emerald-300 border-emerald-500/40' : 'text-sky-300 border-slate-800'
          }`}
        >
          {el.op === 'IN_RANGE' ? 'IN_RANGE' : `CMP ${el.op}`} ({el.dataType})
        </div>
        {el.op === 'IN_RANGE' ? (
          <div className="space-y-0.5 text-[10px] text-slate-300 whitespace-nowrap">
            <div>MIN: {el.in1}</div>
            <div className="text-white font-semibold">
              VAL: {el.in2} {monitorOn && readout ? `(${readout})` : ''}
            </div>
            <div>MAX: {el.in3}</div>
          </div>
        ) : (
          <div className="space-y-0.5 text-[10px] text-slate-300 whitespace-nowrap">
            <div className="text-white font-semibold">
              {el.in1} {monitorOn && readout ? `(${readout})` : ''}
            </div>
            <div className="text-slate-400">
              {el.op} {el.in2}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CoilNode: React.FC<{
  el: LadderCoilElement;
  monitorOn: boolean;
  powerIn: boolean;
  liveState: LivePLCState;
}> = ({ el, monitorOn, powerIn, liveState }) => {
  const isActive = el.active(liveState);
  const energized = monitorOn && (isActive || powerIn);
  const symbol = el.variant === 'SET' ? '( S )' : el.variant === 'RESET' ? '( R )' : '(   )';

  return (
    <div className="flex flex-col items-center shrink-0 min-w-[82px]">
      <span className="text-[10px] font-mono text-amber-300 font-semibold leading-tight mb-0.5 whitespace-nowrap">
        "{el.tag}"
      </span>
      <div
        className={`px-2 py-0.5 rounded-full border font-mono text-xs font-bold leading-none transition-colors whitespace-nowrap ${
          energized
            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.45)]'
            : 'border-slate-500 bg-slate-900 text-slate-400'
        }`}
      >
        {symbol}
      </div>
      {el.address && (
        <span className="text-[9px] font-mono text-slate-500 mt-0.5 whitespace-nowrap">{el.address}</span>
      )}
    </div>
  );
};

const BoxNode: React.FC<{
  el: LadderBoxElement;
  monitorOn: boolean;
  powerIn: boolean;
  liveState: LivePLCState;
}> = ({ el, monitorOn, powerIn, liveState }) => {
  const boxActive = el.active ? el.active(liveState) : powerIn;
  const energized = monitorOn && boxActive;

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <div
        className={`rounded-lg border bg-slate-900 min-w-[215px] text-[10px] font-mono overflow-hidden transition-colors ${
          energized ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.18)]' : 'border-slate-700'
        }`}
      >
        {/* Box Header */}
        <div
          className={`px-2.5 py-1 border-b flex items-center justify-between font-bold ${
            energized
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800/80 border-slate-700 text-teal-300'
          }`}
        >
          <span>{el.instruction}</span>
          {el.subLabel && <span className="text-[9px] text-slate-400 font-normal">{el.subLabel}</span>}
        </div>

        {/* EN / ENO Row */}
        <div className="flex items-center justify-between px-2 py-0.5 text-[9px] text-slate-500 border-b border-slate-800/70">
          <span className={monitorOn && powerIn ? 'text-emerald-400 font-bold' : ''}>EN</span>
          <span className={energized ? 'text-emerald-400 font-bold' : ''}>ENO</span>
        </div>

        {/* Pins Grid */}
        <div className="p-2 flex items-start justify-between gap-4">
          {/* Input Pins */}
          <div className="space-y-1">
            {el.inputs.map((inp) => (
              <div key={inp.pin} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sky-400 font-bold">{inp.pin}:</span>
                <span className="text-slate-200">{inp.label}</span>
                {monitorOn && inp.liveValue && (
                  <span className="text-emerald-300 font-bold">[{inp.liveValue(liveState)}]</span>
                )}
              </div>
            ))}

            {/* Aux Rung Inputs (e.g. R pin on SR block) */}
            {el.auxInputs?.map((aux) => {
              const auxTrue = aux.elements.every((sub) => evaluateElementFlow(sub, liveState, true));
              return (
                <div key={aux.pin} className="pt-1 mt-1 border-t border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={`font-bold ${monitorOn && auxTrue ? 'text-rose-400' : 'text-amber-400'}`}>
                      {aux.pin}:
                    </span>
                    <span className="text-slate-300">
                      {aux.elements.map((sub, i) =>
                        sub.kind === 'compare' ? (
                          <span key={i}>
                            {sub.in1} {sub.op} {sub.in2}
                            {monitorOn && sub.liveReadout ? ` (${sub.liveReadout(liveState)})` : ''}
                          </span>
                        ) : null
                      )}
                    </span>
                    {monitorOn && (
                      <span className={`font-bold ${auxTrue ? 'text-rose-400' : 'text-slate-500'}`}>
                        [{auxTrue ? '1' : '0'}]
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Output Pins */}
          <div className="space-y-1 text-right">
            {el.outputs.map((out) => (
              <div key={out.pin} className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                {monitorOn && out.liveValue && (
                  <span className="text-emerald-300 font-bold">[{out.liveValue(liveState)}]</span>
                )}
                <span className="text-slate-200">{out.label}</span>
                <span className="text-amber-400 font-bold">:{out.pin}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const RungRenderer: React.FC<{
  elements: LadderElement[];
  monitorOn: boolean;
  liveState: LivePLCState;
  initialPower?: boolean;
}> = ({ elements, monitorOn, liveState, initialPower = true }) => {
  let runningPower = initialPower;

  return (
    <div className="flex items-center">
      {elements.map((el, idx) => {
        const powerIntoEl = runningPower;
        const powerOutEl = evaluateElementFlow(el, liveState, powerIntoEl);
        runningPower = powerOutEl;

        return (
          <React.Fragment key={idx}>
            {idx > 0 && <WireSegment energized={powerIntoEl} monitorOn={monitorOn} widthClass="w-4 sm:w-6" />}

            {el.kind === 'contact' && (
              <ContactNode el={el} monitorOn={monitorOn} powerIn={powerIntoEl} liveState={liveState} />
            )}

            {el.kind === 'compare' && (
              <CompareNode el={el} monitorOn={monitorOn} powerIn={powerIntoEl} liveState={liveState} />
            )}

            {el.kind === 'coil' && (
              <CoilNode el={el} monitorOn={monitorOn} powerIn={powerIntoEl} liveState={liveState} />
            )}

            {el.kind === 'box' && (
              <BoxNode el={el} monitorOn={monitorOn} powerIn={powerIntoEl} liveState={liveState} />
            )}

            {el.kind === 'branch' && (
              <div className="flex flex-col justify-center gap-2 border-l-2 border-r-2 border-slate-600 px-2.5 py-2 rounded-sm bg-slate-900/40 shrink-0">
                {el.branches.map((branchRung, bIdx) => (
                  <div key={bIdx} className="flex items-center">
                    <RungRenderer
                      elements={branchRung}
                      monitorOn={monitorOn}
                      liveState={liveState}
                      initialPower={powerIntoEl}
                    />
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const LadderDiagram: React.FC<LadderDiagramProps> = ({ program, liveState }) => {
  const [monitorOn, setMonitorOn] = useState<boolean>(true);
  const [copiedLad, setCopiedLad] = useState<boolean>(false);

  const handleCopyLad = () => {
    navigator.clipboard.writeText(formatLadderAsText(program));
    setCopiedLad(true);
    setTimeout(() => setCopiedLad(false), 2000);
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white font-mono">
              Chương trình Ladder Logic (LAD) — {program.obBlock}
            </div>
            <div className="text-[11px] text-slate-400">
              Hiển thị chuẩn các Network theo TIA Portal · Đường màu xanh là dòng năng lượng đang dẫn (Online Monitor)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMonitorOn((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
              monitorOn
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Monitor: {monitorOn ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleCopyLad}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap"
          >
            {copiedLad ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLad ? 'Đã chép LAD!' : 'Sao chép LAD'}</span>
          </button>
        </div>
      </div>

      {/* Networks List */}
      <div className="p-4 space-y-4">
        {program.networks.map((net) => (
          <div key={net.id} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold text-teal-300 font-mono">{net.title}</span>
              <span className="text-[11px] text-slate-400">{net.comment}</span>
            </div>

            <div className="p-3.5 overflow-x-auto space-y-3 bg-slate-950/70">
              {net.rungs.map((rung, rIdx) => (
                <div key={rIdx} className="flex items-center min-w-max py-1">
                  {/* Left Power Rail */}
                  <div
                    className={`w-1 self-stretch min-h-[40px] rounded-sm shrink-0 ${
                      monitorOn ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  <WireSegment energized={true} monitorOn={monitorOn} widthClass="w-4 sm:w-6" />

                  {/* Rung Elements */}
                  <RungRenderer elements={rung} monitorOn={monitorOn} liveState={liveState} />

                  {/* Trailing wire to Right Rail */}
                  <div className="flex-1 min-w-[20px]">
                    <WireSegment energized={false} monitorOn={false} widthClass="w-full" />
                  </div>
                  {/* Right Power Rail */}
                  <div className="w-1 self-stretch min-h-[40px] bg-slate-700 rounded-sm shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
