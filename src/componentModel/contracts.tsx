import { MsgBus, MsgHeaders, MsgStruct } from '@actdim/msgmesh/msgBusCore';

export type BaseComponentContext<TMsgStruct extends MsgStruct = MsgStruct> = {
    msgBus: MsgBus<TMsgStruct>;
    currentId?: string;
};

export type TreeNode = {
    id: string;
    parentId?: string;
    children: Set<string>;
};

// ComponentContext
export type ComponentRegistryContext<TMsgStruct extends MsgStruct = MsgStruct> =
    BaseComponentContext<TMsgStruct> & {
        register: (id: string, parentId?: string) => void;
        unregister: (id: string) => void;
        getParent: (id: string) => string | undefined;
        getChildren: (id: string) => string[];
        getChainUp: (id: string) => string[];
        getChainDown: (id: string) => string[];
        getHierarchyPath: (id: string) => string;
        getNodeMap: () => Map<string, TreeNode>;
    };

export type ComponentMsgHeaders = MsgHeaders & {};
