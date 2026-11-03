import React from 'react';
import { PortalProvider } from '../common/PortalProvider';
import { Playground } from '../structs/playgroundStruct';

export function SplitPlaygroundIsland() {
  return (
    <PortalProvider>
      <Playground />
    </PortalProvider>
  );
}
