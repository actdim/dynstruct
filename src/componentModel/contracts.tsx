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
import { FC, PropsWithChildren, ReactNode } from 'react';

export type BaseContext<TMsgStruct extends MsgStruct = MsgStruct> = {
    msgBus: MsgBus<TMsgStruct>;
};

export type ComponentTreeNode = {
    id: string;
    regType: string;
    parentId?: string;
    children: Set<string>;
};

// ComponentContext
export type ComponentRegistryContext<TMsgStruct extends MsgStruct = MsgStruct> =
    BaseContext<TMsgStruct> & {
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
    TGroup extends keyof TStruct[TChannel] = typeof $CG_IN, // keyof TStruct[TChannel]
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
    TGroup extends keyof TStruct[TChannel] = typeof $CG_IN, // keyof TStruct[TChannel]
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
    // consume
    subscribe?: TKeysToSubscribe;
    // produce
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
    [name: string]: ComponentStruct | ((params: any) => ComponentStruct);
};

export type ComponentStructBase<
    TMsgStruct extends MsgStruct = MsgStruct,
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
    TMsgStruct extends MsgStruct = MsgStruct,
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
                        typeof $CG_OUT
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
        abortController?: AbortController;
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

export const $isBinding = Symbol('$isBinding'); // brand

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

export type ComponentPropSource<T> = T | Binding<T>;

export type ComponentPropParams<TPropStruct extends ComponentPropStruct> = {
    [P in keyof TPropStruct]?: ComponentPropSource<TPropStruct[P]>;
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

export type ComponentEvents<TStruct extends ComponentStruct = ComponentStruct> = {
    onPropChanging?: PropValueChangingHandler<keyof TStruct['props']>;
    onPropChange?: PropValueChangeHandler<keyof TStruct['props']>;
    onInit?: (component: Component<TStruct>) => void;
    onLayout?: (component: Component<TStruct>) => void;
    onReady?: (component: Component<TStruct>) => void;
    onLayoutDestroy?: (component: Component<TStruct>) => void; // onLayoutCleanup
    onDestroy?: (component: Component<TStruct>) => void; // onDispose/onCleanup
    onError?: (component: Component<TStruct>, error: any) => void;
} & {
    [P in keyof TStruct['props'] as `${typeof $ON_GET}${Capitalize<P & string>}`]?: () => TStruct['props'][P];
} & {
    [P in keyof TStruct['props'] as `${typeof $ON_CHANGING}${Capitalize<P & string>}`]?: ValueChangingHandler<
        TStruct['props']
    >;
} & {
    [P in keyof TStruct['props'] as `${typeof $ON_CHANGE}${Capitalize<P & string>}`]?: ValueChangeHandler<
        TStruct['props']
    >;
};

// AllHTMLAttributes<JSX.Element>

export type ComponentViewProps = {
    render?: boolean;
} & PropsWithChildren;

// ComponentRenderImplFn
export type ComponentViewImplFn<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = (props: ComponentViewProps, component?: Component<TStruct, TMsgHeaders>) => ReactNode; // JSX.Element

// ComponentRenderFn
export type ComponentViewFn = (props: ComponentViewProps) => ReactNode; // JSX.Element

export type ComponentMsgBroker<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = MsgBroker<
    Pick<TStruct['msg'], MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['provide']>>,
    Pick<TStruct['msg'], MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['subscribe']>>,
    TMsgHeaders,
    Component<TStruct, TMsgHeaders>
>;

export type EffectFn<
    TStruct extends ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = (component: Component<TStruct, TMsgHeaders>) => void | (() => void);

export type ComponentDef<
    TStruct extends ComponentStruct,
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
    events?: ComponentEvents<TStruct>;
    // msgs?
    msgBroker?: ComponentMsgBroker<TStruct, TMsgHeaders>;
    msgBus?: MsgBus<TStruct['msg'], TMsgHeaders>;
    view?: ComponentViewImplFn<TStruct, TMsgHeaders>;
};

export type ComponentDefChildren<TRefStruct extends ComponentRefStruct> = Require<
    {
        [P in keyof TRefStruct]: TRefStruct[P] extends (params: infer TParams) => infer T
            ? T extends ComponentStruct
                ? (params: TParams) => Component<T>
                : never
            : TRefStruct[P] extends ComponentStruct
              ? Component<TRefStruct[P]>
              : never;
    },
    HasKeys<TRefStruct>
>;

export type ComponentChildren<TRefStruct extends ComponentRefStruct> = {
    readonly [P in keyof TRefStruct as TRefStruct[P] extends Function
        ? `${Capitalize<P & string>}`
        : P]: TRefStruct[P] extends (params: infer TParams) => infer T
        ? T extends ComponentStruct
            ? FC<ComponentParams<T> & TParams>
            : never
        : TRefStruct[P] extends ComponentStruct
          ? Component<TRefStruct[P]>
          : never;
};

export type ComponentMsgStruct<TStruct extends ComponentStruct = ComponentStruct> = Pick<
    TStruct['msg'],
    | MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['provide']>
    | MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['subscribe']>
    | MaybeKeyOf<TStruct['msg'], TStruct['msgScope']['publish']>
>;

// style?: CSSProperties;
// classNames?: string[];
export type ComponentBase<
    TStruct extends ComponentStruct = ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
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
    readonly effects: Record<string, EffectController>;
    readonly View: ComponentViewFn;
};

export type ComponentModel<TStruct extends ComponentStruct = ComponentStruct> = TStruct['props'] &
    Readonly<TStruct['actions']> & {
        // readonly __id?: string;
        // readonly __key?: string;
        readonly $id?: string;
        readonly $key?: string;
    };

export type Component<
    TStruct extends ComponentStruct = ComponentStruct,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    readonly model: ComponentModel<TStruct>;
    readonly children: ComponentChildren<TStruct['children']>;
} & ComponentBase<TStruct, TMsgHeaders>;

export type PropEventHandlers = {
    onGet?: () => any;
    onChanging?: (oldValue: any, newValue: any) => boolean;
    onChange?: (value: any) => void;
};

export type ComponentParams<TStruct extends ComponentStruct = ComponentStruct> =
    ComponentPropParams<TStruct['props']> &
        ComponentEvents<TStruct> & {
            $id?: string;
            $key?: string;
        }; // & PropsWithChildren?

export type EffectController = {
    start: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    restart: () => void;
};
