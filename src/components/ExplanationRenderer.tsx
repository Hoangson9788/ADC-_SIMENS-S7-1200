import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { parseExplanationBlocks } from '../utils/explanationParser';

interface ExplanationRendererProps {
  text: string;
}

export const ExplanationRenderer: React.FC<ExplanationRendererProps> = ({ text }) => {
  const blocks = parseExplanationBlocks(text);

  return (
    <div className="space-y-3 text-xs sm:text-[13px] leading-relaxed text-slate-300">
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case 'title':
            return (
              <div
                key={idx}
                className="text-xs font-bold tracking-wide text-teal-300 uppercase pt-1"
              >
                {block.text}
              </div>
            );

          case 'heading':
            return (
              <h4
                key={idx}
                className="text-sm font-bold text-white pt-3 first:pt-0 border-b border-slate-800/80 pb-1.5"
              >
                {block.text}
              </h4>
            );

          case 'formula':
            return (
              <div
                key={idx}
                className="my-2 px-4 py-3 rounded-xl bg-slate-900 border border-teal-500/35 text-teal-200 font-mono text-xs sm:text-sm flex flex-wrap items-center gap-x-1.5 gap-y-2 overflow-x-auto shadow-inner"
              >
                {block.tokens.map((tok, tIdx) =>
                  tok.kind === 'text' ? (
                    <span key={tIdx} className="whitespace-pre-wrap text-slate-100 font-semibold">
                      {tok.value}
                    </span>
                  ) : (
                    <span
                      key={tIdx}
                      className="inline-flex flex-col items-center justify-center align-middle px-1.5 mx-0.5"
                    >
                      <span className="text-teal-300 font-bold pb-0.5 px-1 border-b border-teal-400/70 whitespace-nowrap">
                        {tok.numerator}
                      </span>
                      <span className="text-cyan-300 font-bold pt-0.5 px-1 whitespace-nowrap">
                        {tok.denominator}
                      </span>
                    </span>
                  )
                )}
              </div>
            );

          case 'warning':
            return (
              <div
                key={idx}
                className="my-2 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start gap-2.5 text-xs leading-relaxed"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{block.text}</span>
              </div>
            );

          case 'bullet':
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-teal-400 font-bold mt-0.5 shrink-0">•</span>
                <span>{block.text}</span>
              </div>
            );

          case 'subbullet':
            return (
              <div key={idx} className="flex items-start gap-2 pl-6 text-slate-300">
                <span className="text-cyan-400 font-mono mt-0.5 shrink-0">+</span>
                <span>{block.text}</span>
              </div>
            );

          case 'paragraph':
            return (
              <p key={idx} className="text-slate-300">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
};
