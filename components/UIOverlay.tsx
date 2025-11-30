
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect, useRef } from 'react';
import { AppState, SavedModel, BillArtifact } from '../types';
import { Box, Bird, Cat, Rabbit, Users, Code2, Plus, RefreshCw, FolderOpen, ChevronUp, FileJson, History, Play, Pause, Info, Hammer, Loader2, Activity } from 'lucide-react';

interface UIOverlayProps {
  voxelCount: number;
  appState: AppState;
  currentBaseModel: string;
  customBuilds: SavedModel[];
  customRebuilds: SavedModel[];
  isAutoRotate: boolean;
  isInfoVisible: boolean;
  isGenerating: boolean;
  billArtifact: BillArtifact | null;
  onDismantle: () => void;
  onRebuild: (type: 'Eagle' | 'Cat' | 'Rabbit' | 'Twins') => void;
  onNewScene: (type: 'Eagle') => void;
  onSelectCustomBuild: (model: SavedModel) => void;
  onSelectCustomRebuild: (model: SavedModel) => void;
  onPromptCreate: () => void;
  onPromptMorph: () => void;
  onShowJson: () => void;
  onImportJson: () => void;
  onToggleRotation: () => void;
  onToggleInfo: () => void;
}

const LOADING_MESSAGES = [
    "Parsing shape vector...",
    "Removing fog...",
    "Correcting misconceptions...",
    "Stabilizing confidence...",
    "Generating geometry...",
    "Applying BILL protocol..."
];

export const UIOverlay: React.FC<UIOverlayProps> = ({
  voxelCount,
  appState,
  currentBaseModel,
  customBuilds,
  customRebuilds,
  isAutoRotate,
  isInfoVisible,
  isGenerating,
  billArtifact,
  onDismantle,
  onRebuild,
  onNewScene,
  onSelectCustomBuild,
  onSelectCustomRebuild,
  onPromptCreate,
  onPromptMorph,
  onShowJson,
  onImportJson,
  onToggleRotation,
  onToggleInfo
}) => {
  const isStable = appState === AppState.STABLE;
  const isDismantling = appState === AppState.DISMANTLING;
  
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    if (isGenerating) {
        const interval = setInterval(() => {
            setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 1500);
        return () => clearInterval(interval);
    } else {
        setLoadingMsgIndex(0);
    }
  }, [isGenerating]);
  
  const isEagle = currentBaseModel === 'Eagle';

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none font-sans">
      
      {/* --- Top Bar (Stats & Tools) --- */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        
        {/* Global Scene Controls */}
        <div className="pointer-events-auto flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <DropdownMenu 
                    icon={<FolderOpen size={18} />}
                    label="Files"
                    color="dark"
                >
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presets</div>
                    <DropdownItem onClick={() => onNewScene('Eagle')} icon={<Bird size={14}/>} label="Eagle" />
                    <DropdownItem onClick={onPromptCreate} icon={<Plus size={14}/>} label="New Construct" highlight />
                    <div className="h-px bg-slate-100 my-1" />
                    
                    {customBuilds.length > 0 && (
                        <>
                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Files</div>
                            {customBuilds.map((model, idx) => (
                                <DropdownItem 
                                    key={`build-${idx}`} 
                                    onClick={() => onSelectCustomBuild(model)} 
                                    icon={<History size={14}/>} 
                                    label={model.name} 
                                    truncate
                                />
                            ))}
                            <div className="h-px bg-slate-100 my-1" />
                        </>
                    )}

                    <DropdownItem onClick={onImportJson} icon={<FileJson size={14}/>} label="Import JSON" />
                </DropdownMenu>

                <div className="flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl border border-slate-200 text-slate-500 font-bold h-[46px]">
                    <Box size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-700 font-mono">{voxelCount} units</span>
                </div>
            </div>

            {/* BILL ANALYSIS CARD */}
            {billArtifact && !isGenerating && (
                <div className="w-[320px] bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-slate-200 animate-in slide-in-from-left-5 fade-in duration-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Analysis</span>
                        <Activity size={14} className="text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">
                        {billArtifact.analysis}
                    </p>
                    <div className="grid grid-cols-4 gap-1">
                         <StatBox label="C" value={billArtifact.shapeVector.c} tooltip="Correctness" />
                         <StatBox label="M" value={billArtifact.shapeVector.m} tooltip="Misconception" />
                         <StatBox label="F" value={billArtifact.shapeVector.f} tooltip="Fog" />
                         <StatBox label="K" value={billArtifact.shapeVector.k} tooltip="Confidence" />
                    </div>
                </div>
            )}
        </div>

        {/* Utilities */}
        <div className="pointer-events-auto flex gap-2">
            <TactileButton
                onClick={onToggleInfo}
                active={isInfoVisible}
                icon={<Info size={18} strokeWidth={2.5} />}
                label="Info"
                compact
            />
            <TactileButton
                onClick={onToggleRotation}
                active={isAutoRotate}
                icon={isAutoRotate ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                label={isAutoRotate ? "Pause" : "Play"}
                compact
            />
            <TactileButton
                onClick={onShowJson}
                active={false}
                icon={<Code2 size={18} strokeWidth={2.5} />}
                label="Code"
            />
        </div>
      </div>

      {/* --- Loading Indicator --- */}
      {isGenerating && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
              <div className="bg-white/95 backdrop-blur-md border border-slate-200 px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[300px]">
                  <div className="relative">
                      <div className="absolute inset-0 bg-slate-200 rounded-full animate-ping opacity-20"></div>
                      <Loader2 size={32} className="text-slate-900 animate-spin" />
                  </div>
                  <div className="text-center">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-1">Processing</h3>
                      <p className="text-slate-500 font-mono text-xs transition-all duration-300">
                          {LOADING_MESSAGES[loadingMsgIndex]}
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* --- Bottom Control Center --- */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center items-end pointer-events-none">
        
        <div className="pointer-events-auto transition-all duration-500 ease-in-out transform">
            
            {/* STATE 1: STABLE -> DISMANTLE */}
            {isStable && (
                 <div className="animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <BigActionButton 
                        onClick={onDismantle} 
                        icon={<Hammer size={24} strokeWidth={2} />} 
                        label="DISMANTLE" 
                     />
                 </div>
            )}

            {/* STATE 2: DISMANTLED -> REBUILD */}
            {isDismantling && !isGenerating && (
                <div className="flex items-end gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <DropdownMenu 
                        icon={<RefreshCw size={20} />}
                        label="Reconstruct"
                        color="dark"
                        direction="up"
                        big
                     >
                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Targets</div>
                        
                        {isEagle && (
                            <>
                                <DropdownItem onClick={() => onRebuild('Cat')} icon={<Cat size={16}/>} label="Cat" />
                                <DropdownItem onClick={() => onRebuild('Rabbit')} icon={<Rabbit size={16}/>} label="Rabbit" />
                                <DropdownItem onClick={() => onRebuild('Twins')} icon={<Users size={16}/>} label="Eagles x2" />
                                <div className="h-px bg-slate-100 my-1" />
                            </>
                        )}

                        {customRebuilds.length > 0 && (
                            <>
                                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">History</div>
                                {customRebuilds.map((model, idx) => (
                                    <DropdownItem 
                                        key={`rebuild-${idx}`} 
                                        onClick={() => onSelectCustomRebuild(model)} 
                                        icon={<History size={16}/>} 
                                        label={model.name}
                                        truncate 
                                    />
                                ))}
                                <div className="h-px bg-slate-100 my-1" />
                            </>
                        )}

                        <DropdownItem onClick={onPromptMorph} icon={<Activity size={16}/>} label="New Target..." highlight />
                     </DropdownMenu>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

// --- Components ---

const StatBox: React.FC<{ label: string, value: number, tooltip: string }> = ({ label, value, tooltip }) => (
    <div className="flex flex-col items-center bg-slate-50 rounded-lg p-2 border border-slate-100" title={tooltip}>
        <span className="text-[10px] font-bold text-slate-400">{label}</span>
        <span className="text-xs font-mono font-bold text-slate-700">{value.toFixed(2)}</span>
    </div>
);

interface TactileButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  compact?: boolean;
}

const TactileButton: React.FC<TactileButtonProps> = ({ onClick, disabled, active, icon, label, compact }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all duration-100
        border shadow-sm
        ${compact ? 'p-3' : 'px-4 py-3'}
        ${disabled 
          ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed shadow-none' 
          : active 
            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-200 ring-offset-1' 
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'}
      `}
    >
      {icon}
      {!compact && <span>{label}</span>}
    </button>
  );
};

const BigActionButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string}> = ({ onClick, icon, label }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-900 hover:bg-black text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-white/50"
        >
            <div className="mb-1 opacity-90">{icon}</div>
            <div className="text-[10px] font-bold tracking-widest">{label}</div>
        </button>
    )
}

// --- Dropdown Components ---

interface DropdownProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    color: 'dark' | 'light';
    direction?: 'up' | 'down';
    big?: boolean;
}

const DropdownMenu: React.FC<DropdownProps> = ({ icon, label, children, color, direction = 'down', big }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const baseStyles = "flex items-center gap-2 font-bold shadow-sm transition-all active:scale-95";
    const sizeStyles = big 
        ? "px-8 py-3 text-sm rounded-full bg-slate-900 text-white hover:bg-black shadow-xl ring-4 ring-white/50" 
        : "px-4 py-2.5 text-sm rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300";

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`${baseStyles} ${sizeStyles}`}
            >
                {icon}
                {label}
                <ChevronUp size={14} className={`opacity-50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${direction === 'down' ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`
                    absolute left-0 ${direction === 'up' ? 'bottom-full mb-3' : 'top-full mt-3'} 
                    w-60 max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1 animate-in fade-in zoom-in duration-200 z-50
                `}>
                    {children}
                </div>
            )}
        </div>
    )
}

const DropdownItem: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, highlight?: boolean, truncate?: boolean }> = ({ onClick, icon, label, highlight, truncate }) => {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left
                ${highlight 
                    ? 'bg-slate-900 text-white hover:bg-black' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
            `}
        >
            <div className="shrink-0 opacity-75">{icon}</div>
            <span className={truncate ? "truncate w-full" : ""}>{label}</span>
        </button>
    )
}
