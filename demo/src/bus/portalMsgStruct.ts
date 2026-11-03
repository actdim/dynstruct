import { type MsgStruct } from '@actdim/msgmesh/contracts';
import { type BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';

export type DemoCatalogItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  rating: number;
  badge?: string;
};

export type CatalogFilterPayload = {
  query?: string;
  category?: string;
  minRating?: number;
};

export const DEFAULT_FILTER: CatalogFilterPayload = {
  query: '',
  category: undefined,
  minRating: 4.0,
};

export type DemoCustomChannels = {
  'CATALOG.FILTER': {
    in: CatalogFilterPayload;
  };
  'NOTICE.TOAST': {
    in: {
      id: string;
      message: string;
      severity?: 'success' | 'info' | 'warning' | 'error';
      duration?: number;
    };
  };
  'DIALOG.OPEN': {
    in: {
      dialogId: string;
      title: string;
      content: string;
    };
  };
  'DRAWER.TOGGLE': {
    in: {
      open: boolean;
    };
  };
  'RPC.SEARCH': {
    in: {
      query: string;
    };
    out: {
      items: DemoCatalogItem[];
    };
  };
};

export type DemoMsgStruct = BaseAppMsgStruct & MsgStruct<DemoCustomChannels>;
