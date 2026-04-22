// import { FC, PropsWithChildren, ReactNode } from 'react';
import { BaseAppMsgStruct } from '@/appDomain/appContracts';
import {
    $CG_IN,
    $CG_OUT,
    Msg,
    MsgBus,
    MsgHeaders,
    MsgProviderParams,
    MsgStruct,
    MsgSubParams,
    OutStruct,
} from '@actdim/msgmesh/contracts';
import { HasKeys, MaybeKeyOf, MaybePromise, Require, Skip } from '@actdim/utico/typeCore';

export type BaseContext<
    TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct,
    TMsgHeaders extends MsgHeaders = MsgHeaders,
> = {
    msgBus: MsgBus<TMsgStruct, TMsgHeaders>;
    abortSignal?: AbortSignal;
};

export type ComponentTreeNode = {
    id: string;
    regType: string;
    parentId?: string;
    children: Set<string>;
};

// ComponentContext
export type ComponentRegistryContext<
    TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct,
    TMsgHeaders extends MsgHeaders = MsgHeaders,
> = BaseContext<TMsgStruct, TMsgHeaders> & {
    currentId?: string;
    register: (id: string, regType: string, parentId?: string) => void;
    unregister: (id: string) => void;
    getParent: (id: string) => string | undefined;
    getChildren: (id: string) => string[];
    getChainUp: (id: string) => string[];
    getChainDown: (id: string) => string[];
    getHierarchyPath: (id: string) => string;
    getNextId: (regType: string) => string;
    getNodeMap: () => Map<string, ComponentTreeNode>;
};

export type ComponentMsgHeaders = MsgHeaders & {};

export enum ComponentMsgFilter {
    None = 0,
    // AcceptFrom...
    FromAncestors = 1 << 0,
    FromDescendants = 1 << 1,
}

export type MsgChannelGroupProviderParams<
    TStruct extends MsgStruct = MsgStruct,
    TChannel extends keyof TStruct = keyof TStruct,
    // typeof $CG_IN,
    TGroup extends keyof TStruct[TChannel] = keyof TStruct[TChannel],
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TScope = any,
> = Skip<
    MsgProviderParams<TStruct, TChannel, TGroup>,
    'channel' | 'group' | 'callback' | 'filter'
> & {
    // resolve
    callback?: (
        msgIn: Msg<TStruct, TChannel, TGroup, TMsgHeaders>,
        headers: TMsgHeaders,
        scope: TScope,
    ) => MaybePromise<OutStruct<TStruct, TChannel>>;
    filter?: (msg: Msg<TStruct, TChannel, TGroup, TMsgHeaders>, scope: TScope) => boolean;
    componentFilter?: ComponentMsgFilter;
};

export type MsgChannelGroupSubscriberParams<
    TStruct extends MsgStruct = MsgStruct,
    TChannel extends keyof TStruct = keyof TStruct,
    // typeof $CG_IN
    TGroup extends keyof TStruct[TChannel] = keyof TStruct[TChannel],
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TScope = any,
> = Skip<MsgSubParams<TStruct, TChannel, TGroup>, 'channel' | 'group' | 'callback' | 'filter'> & {
    callback?: (msg: Msg<TStruct, TChannel, TGroup, TMsgHeaders>, scope: TScope) => void;
    filter?: (msg: Msg<TStruct, TChannel, TGroup, TMsgHeaders>, scope: TScope) => boolean;
    componentFilter?: ComponentMsgFilter;
};

// MsgScope
export type MsgBrokerScope<
    TStruct extends MsgStruct /*= MsgStruct*/,
    TKeysToProvide extends keyof TStruct = keyof TStruct,
    TKeysToSubscribe extends keyof TStruct = keyof TStruct,
    TKeysToPublish extends keyof TStruct = keyof TStruct,
> = {
    provide?: TKeysToProvide;
    subscribe?: TKeysToSubscribe;
    publish?: TKeysToPublish;
};

export type ComponentPropStruct = Record<string, any>;
// export type ComponentPropStruct = {
//     [prop: string]: any;
// };

export type ComponentMethodStruct = Record<string, Function>;
// export type ComponentMethodStruct = {
//     [action: string]: Function;
// };

// export type ComponentRefStruct = Record<string, ComponentStruct<TMsgStruct, T>>;
export type ComponentRefStruct = {
    [name: string]:
        | ComponentStruct<any>
        | ((params: unknown) => ComponentStruct<any>)
        | ((params: unknown) => unknown);
};

export type ComponentStructBase<
    TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct,
    TPropStruct extends ComponentPropStruct = ComponentPropStruct,    
    TMsgScope extends MsgBrokerScope<TMsgStruct> = MsgBrokerScope<TMsgStruct>,
> = {
    props?: TPropStruct;
    actions?: ComponentMethodStruct;
    effects?: string[] | string | undefined;
    children?: ComponentRefStruct;
    // msgs?
    msgScope?: TMsgScope;
};

// ComponentShape
export type ComponentStruct<
    TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct,
    T extends ComponentStructBase<TMsgStruct> = ComponentStructBase<TMsgStruct>,
> = T & {
    msg: TMsgStruct;
};

export type MsgBroker<
    TStructToProvide extends MsgStruct = MsgStruct,
    TStructToSubscribe extends MsgStruct = MsgStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TScope = any,
> = Require<
    {
        // providers
        provide?: Require<
            {
                [TChannel in keyof TStructToProvide]: {
                    [TGroup in keyof Skip<
                        TStructToProvide[TChannel],
                        // typeof $CG_OUT
                        keyof TStructToProvide[TChannel]
                    >]?: MsgChannelGroupProviderParams<
                        TStructToProvide,
                        TChannel,
                        TGroup,
                        TMsgHeaders,
                        TScope
                    >;
                };
            },
            HasKeys<TStructToProvide>
        >;
        // subscribers
        subscribe?: Require<
            {
                [TChannel in keyof TStructToSubscribe]: {
                    [TGroup in keyof TStructToSubscribe[TChannel]]?: MsgChannelGroupSubscriberParams<
                        TStructToSubscribe,
                        TChannel,
                        TGroup,
                        TMsgHeaders,
                        TScope
                    >;
                };
            },
            HasKeys<TStructToSubscribe>
        >;
    },
    HasKeys<TStructToProvide & TStructToSubscribe>
>;

export type ValueConverter<TTo, TFrom> = {
    // ConvertFrom
    convert(value: TFrom): TTo;
    // ConvertTo
    convertBack(value: TTo): TFrom;
};

export type ValidationResult = {
    valid: boolean;
    message: string;
};

export type Validator<T> = {
    options: {
        blur: boolean;
    };
    validate: (value: T) => MaybePromise<ValidationResult>;
};

export const $isBinding = Symbol('isBinding'); // brand

export type Binding<T = any, TFrom = any> = {
    // getter
    readonly get: () => T;
    // setter
    readonly set?: (value: T) => void;
    readonly converter?: ValueConverter<T, TFrom>;
    readonly validator?: Validator<T>;
    readonly readOnly?: boolean;
    [$isBinding]: true;
};

export function isBinding(obj: any): obj is Binding {
    return typeof obj == 'object' && obj && obj[$isBinding] === true;
}

export type ComponentPropSource<T> = T | Binding<T>;

export type ComponentPropParams<TPropStruct extends ComponentPropStruct> = {
    [P in keyof TPropStruct]?: ComponentPropSource<TPropStruct[P]>;
} & {
    key?: string | number | null | undefined;
};

// export const $ON_PROP_CHANGING = "onPropChanging" as const;
// export const $ON_PROP_CHANGE = "onPropChange" as const;

export const $ON_GET = 'onGet' as const;
// export const $ON_BEFORE_SET = "onBeforeSet" as const;
export const $ON_CHANGING = 'onChanging' as const;
export const $ON_CHANGE = 'onChange' as const;
// export const $ON_SET = "onSet" as const;

export type PropValueChangingHandler<TProp = PropertyKey> = (
    prop: TProp,
    oldValue: any,
    newValue: any,
) => boolean;

export type PropValueChangeHandler<TProp = PropertyKey> = (prop: TProp, value: any) => void;

// BeforeValueSetHandler
export type ValueChangingHandler<T = any> = (oldValue: T, newValue: T) => boolean;
// ValueSetHandler
export type ValueChangeHandler<T = any> = (value: T) => void;

export type ComponentEvents<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    onPropChanging?: PropValueChangingHandler<keyof TStruct['props']>;
    onPropChange?: PropValueChangeHandler<keyof TStruct['props']>;
    // onPreMount
    onInit?: (component: Component<TStruct, TMsgHeaders>) => MaybePromise<void>;
    // onMount
    onLayoutReady?: (component: Component<TStruct, TMsgHeaders>) => MaybePromise<void>;
    // onPostMount
    onReady?: (component: Component<TStruct, TMsgHeaders>) => MaybePromise<void>;
    // onPreUnmount
    onLayoutDestroy?: (component: Component<TStruct, TMsgHeaders>) => MaybePromise<void>; // onLayoutCleanup
    // onUnmount
    onDestroy?: (component: Component<TStruct, TMsgHeaders>) => MaybePromise<void>; // onDispose/onCleanup
    // onError
    onCatch?: (component: Component<TStruct, TMsgHeaders>, error: unknown, info?: unknown) => void;
} & {
    [P in keyof TStruct['props'] as `${typeof $ON_GET}${Capitalize<P & string>}`]?: () => TStruct['props'][P];
} & {
    [P in keyof TStruct['props'] as `${typeof $ON_CHANGING}${Capitalize<P & string>}`]?: ValueChangingHandler<
        TStruct['props'][P]
    >;
} & {
    [P in keyof TStruct['props'] as `${typeof $ON_CHANGE}${Capitalize<P & string>}`]?: ValueChangeHandler<
        TStruct['props'][P]
    >;
};

// AllHTMLAttributes<JSX.Element>

export type ComponentViewProps = {
    render?: boolean;
    children?: unknown;
};

// ComponentRenderImplFn
export type ComponentViewImplFn<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = (props: ComponentViewProps, component?: Component<TStruct, TMsgHeaders>) => unknown;

export type ComponentMsgBroker<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = MsgBroker<
    Pick<TStruct['msg'], MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['provide']>>,
    Pick<TStruct['msg'], MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['subscribe']>>,
    TMsgHeaders,
    Component<TStruct, TMsgHeaders>
>;

export type EffectFn<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = (component: Component<TStruct, TMsgHeaders>) => void | (() => void);

export type ComponentDef<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    // typeId
    regType?: string;
    props?: Require<TStruct['props'], HasKeys<TStruct['props']>>;
    actions?: Require<TStruct['actions'], HasKeys<TStruct['actions']>>;
    effects?: keyof TStruct['effects'] extends never
        ? never
        : Record<
              TStruct['effects'] extends string ? TStruct['effects'] : TStruct['effects'][number],
              EffectFn<TStruct, TMsgHeaders>
          >;
    children?: ComponentDefChildren<TStruct['children']>;
    events?: ComponentEvents<TStruct, TMsgHeaders>;
    // msgs?
    msgBroker?: ComponentMsgBroker<TStruct, TMsgHeaders>;
    msgBus?: MsgBus<TStruct['msg'], TMsgHeaders>;
    view?: ComponentViewImplFn<TStruct, TMsgHeaders>;
    fallbackView?: ComponentViewImplFn<TStruct, TMsgHeaders>;
    // useErrorFallback/catchComponentErrors
    useErrorBoundary?: boolean;
};

export type ComponentDefChildren<TRefStruct extends ComponentRefStruct> = Require<
    {
        [P in keyof TRefStruct]: TRefStruct[P] extends (params: infer TParams) => infer T
            ? T extends ComponentStruct<any>
                ? (params: TParams) => Component<T>
                : (params: TParams) => T // ReactNode for example
            : TRefStruct[P] extends ComponentStruct<any>
              ? Component<TRefStruct[P]>
              : never;
    },
    HasKeys<TRefStruct>
>;

export type RenderFn<P> = {
    (props: P): any; // ReactNode | Promise<ReactNode>
    displayName?: string | undefined;
};

export type ComponentChildren<TRefStruct extends ComponentRefStruct> = {
    readonly [P in keyof TRefStruct as TRefStruct[P] extends Function
        ? `${Capitalize<P & string>}`
        : P]: TRefStruct[P] extends (params: infer TParams) => infer T
        ? T extends ComponentStruct<any>
            ? RenderFn<ComponentParams<T> & TParams>
            : (params: TParams) => T // ReactNode for example
        : TRefStruct[P] extends ComponentStruct<any>
          ? Component<TRefStruct[P]>
          : never;
};

export type ComponentMsgStruct<TStruct extends ComponentStruct<any> = ComponentStruct<any>> = Pick<
    TStruct['msg'],
    | MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['provide']>
    | MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['subscribe']>
    | MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['publish']>
>;

export type ComponentParams<TStruct extends ComponentStruct<any> = ComponentStruct<any>> =
    ComponentPropParams<TStruct['props']> &
        ComponentEvents<TStruct> & {
            $id?: string;
            $key?: string;
        }; // & PropsWithChildren?

// ComponentRenderFn
export type ComponentViewFn = (props: ComponentViewProps) => any; // ReactNode

export const $isComponent = Symbol('isComponent'); // brand
// style?: CSSProperties;
// classNames?: string[];
export type ComponentBase<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    readonly [$isComponent]: true;
    readonly id: string;
    readonly key: string;
    readonly regType: string;
    readonly parentId: string;
    // getHierarchyPath?
    readonly getHierarchyId: () => string;
    readonly getParent: () => string | undefined;
    readonly getChildren: () => string[];
    readonly getChainUp: () => string[];
    readonly getChainDown: () => string[];
    readonly getNodeMap: () => Map<string, ComponentTreeNode>;
    readonly bindings: Map<PropertyKey, Binding>;
    readonly msgBus: MsgBus<ComponentMsgStruct<TStruct>, TMsgHeaders>;
    readonly msgBroker: ComponentMsgBroker<TStruct>;
    readonly effects: keyof TStruct['effects'] extends never
        ? never
        : Record<
              TStruct['effects'] extends string ? TStruct['effects'] : TStruct['effects'][number],
              EffectController
          >;
    readonly View: ComponentViewFn;
    readonly run: <TFunc extends () => MaybePromise<any>>(
        handler: TFunc,
        silent: boolean,
    ) => ReturnType<TFunc>;
    readonly abortSignal: AbortSignal;
    readonly [Symbol.dispose]: () => void;
};

export function isComponent(obj: any): obj is ComponentBase {
    return typeof obj == 'object' && obj && obj[$isComponent] === true;
}

export type ComponentModel<TStruct extends ComponentStruct<any> = ComponentStruct<any>> = TStruct['props'] &
    Readonly<TStruct['actions']>;

export type Component<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    readonly model: ComponentModel<TStruct>;
    readonly children: ComponentChildren<TStruct['children']>;
} & ComponentBase<TStruct, TMsgHeaders>;

export type ComponentImpl<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TInternals = unknown,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = Component<TStruct, TMsgHeaders> & {
    internals?: TInternals;
};

export type PropEventHandlers = {
    onGet?: () => any;
    onChanging?: (oldValue: any, newValue: any) => boolean;
    onChange?: (value: any) => void;
};

export type EffectController = {
    pause: () => void;
    resume: () => void;
    stop: () => void;
};

export const $SYSTEM_TOPIC = 'dynstruct' as const;

// export type CommonAppContext<TMsgStruct extends CommonAppMsgStruct = CommonAppMsgStruct> = BaseContext<TMsgStruct>;
export type BaseAppContext<TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct> =
    BaseContext<TMsgStruct>;
