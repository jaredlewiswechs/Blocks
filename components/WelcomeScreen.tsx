
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';

interface WelcomeScreenProps {
  visible: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible }) => {
  return (
    <div className={`
        absolute top-24 left-0 w-full pointer-events-none flex justify-center z-10 select-none
        transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) transform font-sans
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}
    `}>
      <div className="text-center flex flex-col items-center gap-4 bg-white/80 backdrop-blur-xl p-10 rounded-3xl border border-slate-200 shadow-2xl max-w-lg">
        <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Protocol v1.0 Active
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2">
                BILL
            </h1>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
                Basic Intelligent Language Layer
            </div>
        </div>
        
        <div className="h-px w-16 bg-slate-300 my-2"></div>
        
        <div className="space-y-2">
            <p className="text-lg font-medium text-slate-600 leading-relaxed">
                BILL treats every request as a structure.
            </p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Converting meaning into Shape Vectors: <br/> Correctness, Misconception, Fog, Confidence.
            </p>
        </div>
      </div>
    </div>
  );
};
