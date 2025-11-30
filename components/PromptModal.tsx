
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Layers, X, Loader2, ArrowRight, Activity, Terminal } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  mode: 'create' | 'morph';
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, mode, onClose, onSubmit }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await onSubmit(prompt);
      setPrompt('');
      // Modal closing is handled by parent to coordinate with loader
    } catch (err) {
      console.error(err);
      setError('Protocol Error: Input rejected.');
      setIsLoading(false);
    }
  };

  const isCreate = mode === 'create';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-in fade-in zoom-in duration-200 scale-95 sm:scale-100 overflow-hidden ring-1 ring-black/5">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-900 text-white`}>
                {isCreate ? <Terminal size={20} strokeWidth={2} /> : <Activity size={20} strokeWidth={2} />}
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-900">
                    {isCreate ? 'Define Construct' : 'Reshape Geometry'}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Input Shape Parameters
                </p>
            </div>
          </div>
          <button 
            onClick={!isLoading ? onClose : undefined}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all disabled:opacity-50"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="relative">
                <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isCreate 
                    ? "Describe the structure..." 
                    : "Describe the transformation..."}
                disabled={isLoading}
                className="w-full h-32 resize-none bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all placeholder:text-slate-400 mb-4"
                autoFocus
                />
                <div className="absolute bottom-6 right-4 text-[10px] font-bold text-slate-300 pointer-events-none uppercase tracking-wider">
                    BILL Protocol Input
                </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-2 border border-rose-100">
                <Activity size={14} /> {error}
              </div>
            )}

            <div className="flex justify-end items-center gap-4">
               {isLoading && (
                   <span className="text-xs font-semibold text-slate-400 animate-pulse">
                       Computing shape vector...
                   </span>
               )}
              <button 
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all
                  ${isLoading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 hover:bg-black shadow-lg hover:shadow-xl active:scale-95'}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    Execute
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
