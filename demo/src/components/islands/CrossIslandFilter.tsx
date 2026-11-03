import React from 'react';
import { PortalProvider } from '../common/PortalProvider';
import { CatalogFilter } from '../structs/catalogFilterStruct';

export function CrossIslandFilter() {
  return (
    <PortalProvider>
      <CatalogFilter />
    </PortalProvider>
  );
}
