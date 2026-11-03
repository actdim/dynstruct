import formDemoSrc from '../components/structs/formDemoStruct.tsx?raw';
import counterSrc from '../components/structs/counterStruct.tsx?raw';
import dialogToastSrc from '../components/structs/dialogToastStruct.tsx?raw';
import reactivitySrc from '../components/structs/reactivityStruct.tsx?raw';
import asyncSearchSrc from '../components/structs/asyncSearchStruct.tsx?raw';

export interface PlaygroundScenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  contractCode: string;
  modelCode: string;
  integrationCode: string;
}

/**
 * Extracts a region delimited by // #region <name> and // #endregion <name>
 * from a raw TypeScript source file, dedenting the contained code.
 */
export function extractRegion(source: string, region: 'contract' | 'model' | 'integration'): string {
  const startTag = `// #region ${region}`;
  const endTag = `// #endregion ${region}`;

  const startIndex = source.indexOf(startTag);
  if (startIndex === -1) {
    throw new Error(`Missing "${startTag}" in source.`);
  }
  const contentStart = startIndex + startTag.length;
  const endIndex = source.indexOf(endTag, contentStart);
  if (endIndex === -1) {
    throw new Error(`Missing "${endTag}" in source.`);
  }

  const rawLines = source.substring(contentStart, endIndex).split('\n');

  while (rawLines.length > 0 && rawLines[0].trim() === '') {
    rawLines.shift();
  }
  while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
    rawLines.pop();
  }

  let minIndent = Infinity;
  for (const line of rawLines) {
    if (line.trim().length > 0) {
      const match = line.match(/^[ \t]*/);
      const indent = match ? match[0].length : 0;
      if (indent < minIndent) {
        minIndent = indent;
      }
    }
  }

  if (minIndent === Infinity || minIndent === 0) {
    return rawLines.join('\n');
  }

  return rawLines.map((line) => (line.length >= minIndent ? line.slice(minIndent) : line)).join('\n');
}

export const PLAYGROUND_SCENARIOS: PlaygroundScenario[] = [
  {
    id: 'form',
    title: 'Complex Form & Validation',
    badge: 'dynstruct-mui',
    description: 'Contract-driven form with dynamic validation, reactive error states, and msgmesh toast notifications.',
    contractCode: extractRegion(formDemoSrc, 'contract'),
    modelCode: extractRegion(formDemoSrc, 'model'),
    integrationCode: extractRegion(formDemoSrc, 'integration'),
  },
  {
    id: 'counter',
    title: 'Reactive Model & Actions',
    badge: 'Reactivity',
    description: 'Fine-grained MobX state mutations without boilerplate reducers, hooks, or re-render churn.',
    contractCode: extractRegion(counterSrc, 'contract'),
    modelCode: extractRegion(counterSrc, 'model'),
    integrationCode: extractRegion(counterSrc, 'integration'),
  },
  {
    id: 'overlays',
    title: 'Overlays & Toast Stack',
    badge: 'MsgMesh',
    description: 'Modal dialogs, notifications, and drawers coordinated cleanly through decoupled event channels.',
    contractCode: extractRegion(dialogToastSrc, 'contract'),
    modelCode: extractRegion(dialogToastSrc, 'model'),
    integrationCode: extractRegion(dialogToastSrc, 'integration'),
  },
  {
    id: 'reactivity',
    title: 'Reactivity Modes (deep / shallow / ref)',
    badge: 'Advanced',
    description: 'Demonstrating transparent auto-wrapping, shallow array tracking, and immutable ref properties.',
    contractCode: extractRegion(reactivitySrc, 'contract'),
    modelCode: extractRegion(reactivitySrc, 'model'),
    integrationCode: extractRegion(reactivitySrc, 'integration'),
  },
  {
    id: 'async',
    title: 'Async RPC & Search Provider',
    badge: 'RPC Bus',
    description: 'Request/response RPC pattern over MsgMesh with search debouncing and cancellation.',
    contractCode: extractRegion(asyncSearchSrc, 'contract'),
    modelCode: extractRegion(asyncSearchSrc, 'model'),
    integrationCode: extractRegion(asyncSearchSrc, 'integration'),
  },
];
