import React from 'react';
import { PortalProvider } from '../common/PortalProvider';
import { CatalogList } from '../structs/catalogListStruct';

export function CrossIslandList() {
  return (
    <PortalProvider>
      <CatalogList />
    </PortalProvider>
  );
}
