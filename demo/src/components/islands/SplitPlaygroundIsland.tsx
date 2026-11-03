import React, { useState, useEffect, useRef } from 'react';
import { PortalProvider } from '../common/PortalProvider';
import { FormDemo } from '../structs/formDemoStruct';
import { Counter } from '../structs/counterStruct';
import { DialogToastDemo } from '../structs/dialogToastStruct';
import { ReactivityDemo } from '../structs/reactivityStruct';
import { AsyncSearchDemo } from '../structs/asyncSearchStruct';
import { PLAYGROUND_SCENARIOS, type PlaygroundScenario } from '../../data/codeSnippets';

export function SplitPlaygroundIsland() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('form');
  const [activeCodeTab, setActiveCodeTab] = useState<'contract' | 'model' | 'integration'>('contract');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const scenario: PlaygroundScenario =
    PLAYGROUND_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? PLAYGROUND_SCENARIOS[0];

  const currentCode =
    activeCodeTab === 'contract'
      ? scenario.contractCode
      : activeCodeTab === 'model'
      ? scenario.modelCode
      : scenario.integrationCode;

  const handleCopy = async () => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    copyTimerRef.current = setTimeout(() => {
      setCopyStatus('idle');
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Scenario Selector Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {PLAYGROUND_SCENARIOS.map((s) => {
          const isSelected = s.id === selectedScenarioId;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedScenarioId(s.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <span>{s.title}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                  isSelected ? 'bg-sky-700/60 text-white' : 'bg-slate-800 text-sky-400'
                }`}
              >
                {s.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scenario Description Banner */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
        <h3 className="text-base font-semibold text-white">{scenario.title}</h3>
        <p className="mt-1 text-sm text-slate-400">{scenario.description}</p>
      </div>

      {/* Split-Screen 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Panel: Code & Contracts */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
          {/* Code Sub-Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveCodeTab('contract')}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  activeCodeTab === 'contract'
                    ? 'bg-slate-800 text-sky-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Contract (ComponentStruct)
              </button>
              <button
                onClick={() => setActiveCodeTab('model')}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  activeCodeTab === 'model'
                    ? 'bg-slate-800 text-sky-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Model Logic (ComponentDef)
              </button>
              <button
                onClick={() => setActiveCodeTab('integration')}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  activeCodeTab === 'integration'
                    ? 'bg-slate-800 text-sky-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Astro React Export
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy Code'}
            </button>
          </div>

          {/* Syntax Code Display */}
          <div className="p-4 overflow-x-auto flex-1 font-mono text-xs leading-relaxed text-slate-200">
            <pre className="text-sky-300/90">{currentCode}</pre>
          </div>
        </div>

        {/* Right Panel: Live Interactive Preview */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Interactive Preview (Dynstruct-MUI Island)
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">client:load</span>
          </div>

          <div className="flex-1">
            <PortalProvider>
              {selectedScenarioId === 'form' && <FormDemo />}
              {selectedScenarioId === 'counter' && <Counter />}
              {selectedScenarioId === 'overlays' && <DialogToastDemo />}
              {selectedScenarioId === 'reactivity' && <ReactivityDemo />}
              {selectedScenarioId === 'async' && <AsyncSearchDemo />}
            </PortalProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
