import React from 'react';
import { PortalProvider } from '../common/PortalProvider';
import { type DemoCatalogItem } from '../../bus/portalMsgStruct';
import { SsrCatalog } from '../structs/ssrCatalogStruct';

interface SsrCatalogIslandProps {
  initialItems: DemoCatalogItem[];
  ssrTimestamp: string;
}

export function SsrCatalogIsland({ initialItems, ssrTimestamp }: SsrCatalogIslandProps) {
  return (
    <PortalProvider>
      <SsrCatalog initialItems={initialItems} ssrTimestamp={ssrTimestamp} />
    </PortalProvider>
  );
}
