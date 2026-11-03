import React from 'react';
import {
  type ComponentStruct,
  type ComponentDef,
  type ComponentParams,
  type Component,
  type ComponentModel,
} from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { useFormDemo, type FormDemoStruct } from './formDemoStruct';
import { useCounter, type CounterStruct } from './counterStruct';
import { useDialogToast, type DialogToastStruct } from './dialogToastStruct';
import { useReactivity, type ReactivityStruct } from './reactivityStruct';
import { useAsyncSearch, type AsyncSearchStruct } from './asyncSearchStruct';
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
    children: {
      formDemo: () => FormDemoStruct;
      counterDemo: () => CounterStruct;
      dialogToastDemo: () => DialogToastStruct;
      reactivityDemo: () => ReactivityStruct;
      asyncSearchDemo: () => AsyncSearchStruct;
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
    children: {
      formDemo: () => useFormDemo({}),
      counterDemo: () => useCounter({}),
      dialogToastDemo: () => useDialogToast({}),
      reactivityDemo: () => useReactivity({}),
      asyncSearchDemo: () => useAsyncSearch({}),
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
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {s.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scenario Description Banner */}
          <div className="flex items-start justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-4 backdrop-blur-sm shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{scenario.title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{scenario.description}</p>
            </div>
            <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {scenario.badge}
            </span>
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

              {/* Code Display Area */}
              <div className="flex-1 overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <pre>
                  <code>{currentCode}</code>
                </pre>
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
                {m.selectedScenarioId === 'form' && <c.children.FormDemo />}
                {m.selectedScenarioId === 'counter' && <c.children.CounterDemo />}
                {m.selectedScenarioId === 'overlays' && <c.children.DialogToastDemo />}
                {m.selectedScenarioId === 'reactivity' && <c.children.ReactivityDemo />}
                {m.selectedScenarioId === 'async' && <c.children.AsyncSearchDemo />}
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
