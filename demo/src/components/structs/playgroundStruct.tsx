import React from 'react';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { FormDemo } from './formDemoStruct';
import { Counter } from './counterStruct';
import { DialogToastDemo } from './dialogToastStruct';
import { ReactivityDemo } from './reactivityStruct';
import { AsyncSearchDemo } from './asyncSearchStruct';
import { PLAYGROUND_SCENARIOS, type PlaygroundScenario } from '../../data/codeSnippets';
import { type DemoMsgStruct } from '../../bus/portalMsgStruct';

export type PlaygroundStruct = ComponentStruct<
  DemoMsgStruct,
  {
    props: {
      selectedScenarioId: string;
      activeCodeTab: 'contract' | 'model' | 'integration';
      copyStatus: 'idle' | 'copied' | 'failed';
    };
    actions: {
      selectScenario: (id: string) => void;
      setCodeTab: (tab: 'contract' | 'model' | 'integration') => void;
      copyCode: () => void;
    };
  }
>;

export const usePlayground = (params: ComponentParams<PlaygroundStruct>): Component<PlaygroundStruct> => {
  let c: Component<PlaygroundStruct>;
  let m: ComponentModel<PlaygroundStruct>;

  const def: ComponentDef<PlaygroundStruct> = {
    regType: 'Playground',
    props: {
      selectedScenarioId: 'form',
      activeCodeTab: 'contract',
      copyStatus: 'idle',
    },
    actions: {
      selectScenario: (id: string) => {
        m.selectedScenarioId = id;
      },
      setCodeTab: (tab: 'contract' | 'model' | 'integration') => {
        m.activeCodeTab = tab;
      },
      copyCode: async () => {
        const scenario: PlaygroundScenario =
          PLAYGROUND_SCENARIOS.find((s) => s.id === m.selectedScenarioId) ?? PLAYGROUND_SCENARIOS[0];
        const code =
          m.activeCodeTab === 'contract'
            ? scenario.contractCode
            : m.activeCodeTab === 'model'
            ? scenario.modelCode
            : scenario.integrationCode;
        try {
          await navigator.clipboard.writeText(code);
          m.copyStatus = 'copied';
        } catch {
          m.copyStatus = 'failed';
        }
        setTimeout(() => {
          m.copyStatus = 'idle';
        }, 1500);
      },
    },
    view: () => {
      const scenario: PlaygroundScenario =
        PLAYGROUND_SCENARIOS.find((s) => s.id === m.selectedScenarioId) ?? PLAYGROUND_SCENARIOS[0];

      const currentCode =
        m.activeCodeTab === 'contract'
          ? scenario.contractCode
          : m.activeCodeTab === 'model'
          ? scenario.modelCode
          : scenario.integrationCode;

      return (
        <div className="flex flex-col gap-6">
          {/* Scenario Selector Pills */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            {PLAYGROUND_SCENARIOS.map((s) => {
              const isSelected = s.id === m.selectedScenarioId;
              return (
                <button
                  key={s.id}
                  onClick={() => m.selectScenario(s.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{s.title}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                      isSelected
                        ? 'bg-sky-700/60 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {s.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scenario Description Banner */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 p-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{scenario.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{scenario.description}</p>
          </div>

          {/* Split-Screen 2-Column Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Panel: Code & Contracts */}
            <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden shadow-xl">
              {/* Code Sub-Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-2.5">
                <div className="flex gap-1">
                  <button
                    onClick={() => m.setCodeTab('contract')}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      m.activeCodeTab === 'contract'
                        ? 'bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Contract (ComponentStruct)
                  </button>
                  <button
                    onClick={() => m.setCodeTab('model')}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      m.activeCodeTab === 'model'
                        ? 'bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Model Logic (ComponentDef)
                  </button>
                  <button
                    onClick={() => m.setCodeTab('integration')}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      m.activeCodeTab === 'integration'
                        ? 'bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Astro React Export
                  </button>
                </div>

                <button
                  onClick={m.copyCode}
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {m.copyStatus === 'copied' ? 'Copied!' : m.copyStatus === 'failed' ? 'Copy failed' : 'Copy Code'}
                </button>
              </div>

              {/* Syntax Code Display */}
              <div className="p-4 overflow-x-auto flex-1 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <pre className="text-sky-700 dark:text-sky-300/90">{currentCode}</pre>
              </div>
            </div>

            {/* Right Panel: Live Interactive Preview */}
            <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Live Interactive Preview (Dynstruct-MUI Island)
                  </span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">client:load</span>
              </div>

              <div className="flex-1">
                {m.selectedScenarioId === 'form' && <FormDemo />}
                {m.selectedScenarioId === 'counter' && <Counter />}
                {m.selectedScenarioId === 'overlays' && <DialogToastDemo />}
                {m.selectedScenarioId === 'reactivity' && <ReactivityDemo />}
                {m.selectedScenarioId === 'async' && <AsyncSearchDemo />}
              </div>
            </div>
          </div>
        </div>
      );
    },
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};

export const Playground = toReact(usePlayground);
Playground.displayName = 'Playground';
