import React from 'react';
import { PortalProvider } from '../common/PortalProvider';
import { ShowcaseGallery } from '../structs/showcaseStruct';

export function ShowcaseGalleryIsland() {
  return (
    <PortalProvider>
      <ShowcaseGallery />
    </PortalProvider>
  );
}
