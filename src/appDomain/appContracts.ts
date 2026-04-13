import { $C_ERROR, ErrorPayload, MsgStruct } from "@actdim/msgmesh/contracts";
import { BaseSecurityDomainConfig, BaseSecurityMsgStruct, SecurityTypeRegistry } from "@/appDomain/securityContracts";
import { ReactNode } from "react";
import { KeysOf } from "@actdim/utico/typeCore";
import { BaseContext } from "@/componentModel/contracts";
import { StoreItem } from "@actdim/utico/store/storeContracts";
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

// BaseApp(Domain)Options
export type BaseAppDomainConfig<
    TSecurityDomainConfig extends BaseSecurityDomainConfig = BaseSecurityDomainConfig,
    TApiConfig extends BaseApiConfig = BaseApiConfig
> = {
    id: string;
    name?: string;
    baseUrl: string;
    security: TSecurityDomainConfig;
    defaultApi?: string;
    apis: Record<string, TApiConfig>;
    // HATEOAS? (React Admin)
};

export type BaseAppMsgChannels<TChannel extends keyof BaseAppMsgStruct | Array<keyof BaseAppMsgStruct>> = KeysOf<BaseAppMsgStruct, TChannel>;

export type BaseAppContext<TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct> = BaseContext<TMsgStruct> & {
    // securityProvider: SecurityProvider;        
};