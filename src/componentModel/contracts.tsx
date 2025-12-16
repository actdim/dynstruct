import { MsgBus, MsgBusStruct } from '@actdim/msgmesh/msgBusCore';

export type BaseComponentContext<TMsgBusStruct extends MsgBusStruct = MsgBusStruct> = {
    msgBus: MsgBus<TMsgBusStruct>;
    currentId?: string;
};

// ComponentContext
export type ComponentRegistryContext<TMsgBusStruct extends MsgBusStruct = MsgBusStruct> =
    BaseComponentContext<TMsgBusStruct> & {
        register: (id: string, parentId?: string) => void;
        unregister: (id: string) => void;
        getParent: (id: string) => string | undefined;
        getChildren: (id: string) => string[];
        getChainUp: (id: string) => string[];
        getChainDown: (id: string) => string[];
        getHierarchyPath: (id?: string) => string;
    };
