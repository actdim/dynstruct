import { createMsgBus } from '@actdim/msgmesh/core';
import { type MsgBus } from '@actdim/msgmesh/contracts';
import { type DemoMsgStruct } from './portalMsgStruct';

const PORTAL_CHANNEL_CONFIG = {
  'CATALOG.FILTER': { replayBufferSize: 1 },
} as const;

let _clientBus: MsgBus<DemoMsgStruct> | null = null;

/**
 * Returns an isolated MsgBus instance per call (per island render) during SSR
 * or a persistent singleton in the browser runtime for cross-island coordination.
 */
export function getPortalMsgBus(): MsgBus<DemoMsgStruct> {
  if (typeof window === 'undefined') {
    return createMsgBus<DemoMsgStruct>(PORTAL_CHANNEL_CONFIG);
  }

  if (!_clientBus) {
    _clientBus = createMsgBus<DemoMsgStruct>(PORTAL_CHANNEL_CONFIG);
  }

  return _clientBus;
}
