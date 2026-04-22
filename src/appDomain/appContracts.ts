import { BaseSecurityMsgStruct, SecurityTypeRegistry } from "@/appDomain/securityContracts";
import { KeysOf } from "@actdim/utico/typeCore";
import { TypeRegistry } from "@/di/diContracts";
import { CommonAppMsgStruct, NavRoutes } from "./commonContracts";

export type BaseContainerRegistry = TypeRegistry<[SecurityTypeRegistry]>;

// TTypeRegistry extends BaseContainerRegistry = BaseContainerRegistry
export type BaseAppMsgStruct<TNavRoutes extends NavRoutes = NavRoutes, TTypeRegistry extends BaseContainerRegistry = BaseContainerRegistry> = CommonAppMsgStruct<TNavRoutes, TTypeRegistry>
    & BaseSecurityMsgStruct;

export type BaseApiConfig = {
    url?: string;
    versions?: string[];
};

export type BaseAppMsgChannels<TChannel extends keyof BaseAppMsgStruct | Array<keyof BaseAppMsgStruct>> = KeysOf<BaseAppMsgStruct, TChannel>;