import { MsgBus, MsgSubOptions, PromiseOptions } from '@actdim/msgmesh/contracts';
import {
    runInAction,
    toJS,
    autorun,
    IReactionDisposer,
    observable,
    action,
    computed,
    isObservable,
    untracked,
} from 'mobx';
import type {
    BaseComponentModel,
    Binding,
    BlurEventHandler,
    ChangeEventHandler,
    Component,
    ComponentDef,
    ComponentModel,
    ComponentMsgHeaders,
    ComponentParams,
    ComponentProp,
    ComponentPropState,
    ComponentState,
    ComponentStruct,
    EffectController,
    EffectFn,
    HtmlInputProps,
    MsgChannelGroupProviderParams,
    MsgChannelGroupSubscriberParams,
    PropEventHandlers,
    PropValueChangeHandler,
    PropValueChangingHandler,
    ValidationResult,
    Validator,
    ValueChangeHandler,
    ValueChangingHandler,
    ValueConverter,
} from './contracts';
import {
    $isBinding,
    $isComponentProp,
    $ON_CHANGE,
    $ON_CHANGING,
    $ON_GET,
    ComponentMsgFilter,
    isBinding,
    isComponentProp,
} from './contracts';
import {
    Func,
    getByKeyPath,
    KeyPath,
    KeyPathValue,
    Mutable,
    setByKeyPath,
} from '@actdim/utico/typeCore';
import { capitalize, isReactObject } from './util';
import { isPlainObject } from '@actdim/utico/typeUtils';

// onReactionError((err, derivation) => {
//     console.error(`Reaction "${derivation.name_}" error:`, err);
// });

const blankView = () => null;

// Internal: marks a binding created for a React prop at the React boundary (toReact). Like a React prop,
// it is controlled by the parent while its value is defined; `undefined` falls back to the model value
// (the `def.props` default, or what the component itself wrote).
export const $reactProp = Symbol('reactProp');

// Service params: never stored in the model; always taken from the latest render.
export const SERVICE_PARAM_KEYS: ReadonlySet<string> = new Set(['$events', '$id', '$key']);

/**
 * Path of the first React object (element, portal, memo/forwardRef type, context) inside `value`, or `null`.
 * Descends into plain objects and arrays, skipping paths for which `isOpaque(path)` is true.
 *
 * React objects must never be converted to observables or proxied: their DEV internals (e.g. `_debugTask.run`, a
 * native method that requires its receiver) break behind a proxy, which surfaces whenever a debugger is attached.
 * They are allowed only where the model stores values as is: `prop({ reactive: 'ref' })` (also `false` and
 * `'shallow'` item content) - there is no auto-detection.
 */
function findReactValuePath(
    value: unknown,
    path: string,
    isOpaque: (path: string) => boolean,
    seen = new WeakSet<object>(),
): string | null {
    if (isReactObject(value)) {
        return path;
    }
    if (!Array.isArray(value) && !isPlainObject(value)) {
        return null;
    }
    if (seen.has(value as object)) {
        return null;
    }
    seen.add(value as object);
    for (const [key, item] of Object.entries(value as object)) {
        const itemPath = `${path}.${key}`;
        if (isOpaque(itemPath)) {
            continue;
        }
        const found = findReactValuePath(item, itemPath, isOpaque, seen);
        if (found) {
            return found;
        }
    }

    return null;
}

function isProxyableValue(value: unknown): value is object {
    return isPlainObject(value) || Array.isArray(value);
}

export function toPlain<T>(value: T) {
    return toJS(value) as T;
}

export function bind<T, TFrom = any>(
    get: () => T,
    set?: (value: T) => void,
    converter?: ValueConverter<T, TFrom>,
): Binding {
    return {
        get: get,
        set: set,
        converter: converter,
        readOnly: !set,
        [$isBinding]: true,
    };
}

export function bindProp<T extends object, P extends KeyPath<T, boolean>>(
    target: () => T,
    path: P,
): Binding {
    return {
        get: () => getByKeyPath(target(), path),
        set: (value: KeyPathValue<T, P>) => {
            setByKeyPath(target(), path, value);
        },
        [$isBinding]: true,
    };
}

// export function bindProp<
//     T extends ComponentModel<any>,
//     P extends Exclude<KeyPath<T, boolean>, '$' | `$.${string}`>,
// >(target: () => T, path: P): Binding;
// export function bindProp<T extends object, P extends KeyPath<T, boolean>>(target: () => T, path: P): Binding;
// export function bindProp(target: () => any, path: any): Binding {
//     return {
//         get: () => getByKeyPath(target(), path),
//         set: (value: any) => {
//             setByKeyPath(target(), path, value);
//         },
//         [$isBinding]: true,
//     };
// }

export function prop<T = any>(prop: Partial<ComponentProp<T>>) {
    prop = {
        ...prop,
        [$isComponentProp]: true,
    };
    if (prop.validator) {
        if (!prop.validator.hasOwnProperty('onChange' satisfies keyof Validator)) {
            prop.validator.onChange = true;
        }
    }
    return prop as ComponentProp<T>;
}

export type ComponentModelEventHandlers = {
    onPropChanging?: PropValueChangingHandler<PropertyKey>;
    onPropChange?: PropValueChangeHandler<PropertyKey>;
} & Record<PropertyKey, PropEventHandlers>;

export async function validate<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TPropPath extends KeyPath<TStruct['props'], boolean> = KeyPath<TStruct['props'], boolean>,
>(
    component: Component<TStruct, TMsgHeaders>,
    def: ComponentDef<TStruct, TMsgHeaders>,
    params?: ComponentParams<TStruct>,
    path?: TPropPath,
) {
    const propState = component.model.$.propState;
    const model = component.model as TStruct['props'];

    type ValidationResults = Partial<Record<TPropPath, ValidationResult>>;

    function mergeResults(validationResults: ValidationResults) {
        if (validationResults) {
            for (const [key, val] of Object.entries(validationResults)) {
                const path = key as TPropPath;
                const result = (val as ValidationResult) || { isValid: true };
                let record = propState[path] as Mutable<ComponentPropState>;
                if (record) {
                    runInAction(() => {
                        record.validation = result;
                    });
                } else {
                    record = observable({
                        validation: result,
                        get error() {
                            const v = (this as ComponentPropState).validation;
                            return v && !v.isValid ? v.message : undefined;
                        },
                    } satisfies ComponentPropState);
                    runInAction(() => {
                        propState[path] = record;
                    });
                }
            }
        }
    }

    if (path) {
        const prop = def.props?.[path];
        if (isComponentProp(prop)) {
            const validator = prop.validator;
            if (validator?.validate) {
                const val = getByKeyPath(model, path);
                const result = await Promise.resolve(validator.validate(val));
                mergeResults({ [path]: result } as ValidationResults);
            }
        }
    } else {
        let handler = params?.$events?.onValidate;
        if (handler) {
            let results = (await Promise.resolve(handler(component))) as ValidationResults;
            mergeResults(results);
        }

        handler = def.events?.onValidate;
        if (handler) {
            let results = (await Promise.resolve(handler(component))) as ValidationResults;
            mergeResults(results);
        }

        if (def.props) {
            for (const [key, prop] of Object.entries(def.props)) {
                const path = key as TPropPath;
                if (isComponentProp(prop)) {
                    const validator = prop.validator;
                    if (validator?.validate) {
                        const val = getByKeyPath(model, path);
                        const result = await Promise.resolve(validator.validate(val));
                        mergeResults({ [path]: result } as ValidationResults);
                    }
                }
            }
        }
    }
}

export function mapToEdit<
    TElement extends HTMLElement = HTMLInputElement,
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
    TPropPath extends KeyPath<TStruct['props'], boolean> = KeyPath<TStruct['props'], boolean>,
>(
    component: Component<TStruct, TMsgHeaders>,
    def: ComponentDef<TStruct, TMsgHeaders>,
    params?: ComponentParams<TStruct>,
    path?: TPropPath,
    exclude?: (keyof HtmlInputProps)[],
) {
    const model = component.model as TStruct['props'];
    if (!exclude) {
        exclude = [];
    }

    const inputProps: Mutable<Partial<HtmlInputProps<TElement>>> = {};
    if (exclude.indexOf('value') < 0) {
        inputProps.value = getByKeyPath(model, path) ?? '';
    }
    if (exclude.indexOf('onBlur') < 0) {
        const onBlurFactory = (path: TPropPath): BlurEventHandler<TElement> => {
            return async (evt) => {
                const prop = def.props?.[path];
                if (isComponentProp(prop) && prop.validator?.onBlur) {
                    validate(component, def, params, path);
                }
            };
        };
        inputProps.onBlur = onBlurFactory(path);
    }
    if (exclude.indexOf('onChange') < 0) {
        const onChangeFactory = (path: TPropPath): ChangeEventHandler<TElement> => {
            return (evt) => {
                // HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement etc
                setByKeyPath(
                    model,
                    path,
                    (evt.target as unknown as { value: string }).value as any,
                );
            };
        };
        inputProps.onChange = onChangeFactory(path);
    }
    return inputProps;
}

export function defineByKeyPath<
    T,
    P extends KeyPath<T, boolean, MaxDepth>,
    MaxDepth extends number = 3,
>(obj: T, path: P, descriptor: PropertyDescriptor & ThisType<KeyPathValue<T, P>>): void {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((acc: any, key) => acc?.[key], obj);
    if (target !== null) Object.defineProperty(target, last, descriptor);
}

export function observableWithPaths<T extends object>(
    value: T,
    annotationMap: Record<string, any>,
    options?: Parameters<typeof observable.object>[2],
): T {
    const topLevel: Record<string, any> = {};
    const nested: Record<string, Record<string, any>> = {};

    for (const [keyPath, annotation] of Object.entries(annotationMap)) {
        const dotIdx = keyPath.indexOf('.');
        if (dotIdx < 0) {
            topLevel[keyPath] = annotation;
        } else {
            const first = keyPath.slice(0, dotIdx);
            const rest = keyPath.slice(dotIdx + 1);
            (nested[first] ??= {})[rest] = annotation;
        }
    }

    for (const [key, nestedAnnotations] of Object.entries(nested)) {
        const nestedObj = value[key];
        if (nestedObj !== null && typeof nestedObj === 'object' && !Array.isArray(nestedObj)) {
            value[key] = observableWithPaths(nestedObj, nestedAnnotations, {
                ...options,
                deep: false,
            });
            topLevel[key] ??= observable.ref;
        }
    }

    return observable(value, topLevel, options);
}

export function createModel<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(
    component: Component<TStruct, TMsgHeaders>,
    def: ComponentDef<TStruct, TMsgHeaders>,
    params?: ComponentParams<TStruct>,
) {
    const state: ComponentState = {
        bindings: {},
        isDisabled: false,
        isReadOnly: false,
        isVisible: true,
        isValid: true,
        pendingRequestCount: 0,
        errors: [],
        propState: {},
    };

    let model: TStruct['props'] = {
        ['$' satisfies keyof BaseComponentModel]: state,
    };

    type TPropPath = KeyPath<TStruct['props'], boolean>;

    // DEV: a write to a prop bound without a setter is invisible to readers (they read through the binding).
    const reportedReadOnlyWrites = new Set<string>();
    function hasChangeHandler(path: string) {
        const key = `${$ON_CHANGE}${capitalize(path)}`;
        const events = [params.$events, def.events] as Array<Record<string, unknown> | undefined>;

        return events.some((e) => !!e?.[key] || !!e?.onPropChange);
    }
    function reportReadOnlyWrite(path: string, binding: Binding) {
        if (reportedReadOnlyWrites.has(path)) {
            return;
        }
        const isReactProp = Boolean(Reflect.get(binding, $reactProp));
        if (isReactProp && binding.get() === undefined) {
            // uncontrolled: the parent passes no value, the component owns the prop
            return;
        }
        if (isReactProp && hasChangeHandler(path)) {
            // controlled with a change handler: the parent decides
            return;
        }
        reportedReadOnlyWrites.add(path);
        console.warn(
            `[dynstruct] Prop '${path}' of '${component.regType}' (${component.id}) is bound read-only ` +
            (isReactProp ? '(a React prop controlled by the parent)' : '(bind() without a setter)') +
            `; the write is not visible to readers. Use bindProp / bind(get, set)` +
            (isReactProp ? `, or let the parent update it via $events.onChange${capitalize(path)}.` : '.'),
        );
    }

    const annotationMap: Record<PropertyKey, any> = {};
    if (def.props) {
        for (const key of Object.getOwnPropertyNames(def.props)) {
            const descriptor = Object.getOwnPropertyDescriptor(def.props, key);
            const path = key as TPropPath;
            let prop: any;
            let value: any;
            const hasGetterOnly =
                typeof descriptor.get === 'function' && descriptor.set === undefined;
            try {
                prop = def.props[key];
            } catch {}
            // workaround to support ComponentProp from getter
            if (isComponentProp(prop)) {
                // record reactive annotation before potential continue
                if (prop.reactive === false) annotationMap[key] = false;
                else if (prop.reactive === 'shallow') annotationMap[key] = observable.shallow;
                else if (prop.reactive === 'ref') annotationMap[key] = observable.ref;
                // keyOf<ComponentProp>('initialValue')
                if (prop.hasOwnProperty('initialValue' satisfies keyof ComponentProp)) {
                    value = prop.initialValue;
                } else if (prop.reactive === 'ref' && !key.includes('.')) {
                    // MobX applies annotations to existing keys only: a key added later would get the
                    // default deep enhancer, so a top-level ref prop must exist from the start
                    value = undefined;
                } else {
                    continue;
                }
            } else {
                if (hasGetterOnly) {
                    defineByKeyPath(model, path, descriptor);
                    annotationMap[key] = computed;
                    continue;
                } else {
                    value = prop;
                    annotationMap[key] = observable.deep;
                }
            }
            setByKeyPath(model, path, value);
        }
    }

    if (def.actions) {
        for (const [key, fn] of Object.entries(def.actions)) {
            Reflect.set(model, key, fn);
        }
    }

    for (const [key, val] of Object.entries(params)) {
        if (SERVICE_PARAM_KEYS.has(key)) {
            continue;
        }
        // a computed (getter-only) prop cannot take a value: ignore the param instead of failing the creation.
        // Uses the classification above: a getter returning a ComponentProp (`get x() { return prop(...) }`) is a
        // regular prop and takes its param.
        if (annotationMap[key] === computed) {
            if (import.meta.env.DEV) {
                console.warn(
                    `[dynstruct] Param for the computed prop '${key}' of '${component.regType}' is ignored: ` +
                    `computed props are derived from the model and cannot be set.`,
                );
            }
            continue;
        }
        if (isBinding(val)) {
            state.bindings[key] = val;
        } else {
            setByKeyPath(model, key as TPropPath, val as KeyPathValue<TStruct['props'], TPropPath>);
        }
    }

    if (def.actions) {
        for (const prop of Object.keys(def.actions)) {
            annotationMap[prop] = action;
        }
    }

    annotationMap['$' satisfies keyof BaseComponentModel] = observable.deep;

    // Paths whose values the model stores as is (never converted or proxied): `ref`, `false`, and the items of a
    // `'shallow'` container. React values are allowed only there.
    function isOpaquePath(path: string): boolean {
        const parts = path.split('.');
        for (let i = parts.length; i > 0; i--) {
            const annotation = annotationMap[parts.slice(0, i).join('.')];
            if (annotation === observable.ref || annotation === false) {
                return true;
            }
            if (annotation === observable.shallow && i < parts.length) {
                return true;
            }
        }

        return false;
    }

    // DEV: a React value in a deep-reactive prop is a hard error (no auto-detection, no silent ref conversion).
    function assertNoReactValue(path: string, value: unknown) {
        // observable values are already in a model and were checked when they were stored there
        if (!import.meta.env.DEV || isOpaquePath(path) || isObservable(value)) {
            return;
        }
        // untracked: the scan must not subscribe a running effect / reaction to the scanned data
        const found = untracked(() => findReactValuePath(value, path, isOpaquePath));
        if (found) {
            const root = path.split('.')[0];
            throw new Error(
                `[dynstruct] Prop '${found}' of '${component.regType}' holds a React value (element, component type, ` +
                `portal). React values are allowed only in props declared with prop({ reactive: 'ref' }): declare ` +
                `'${root}' as a ref prop, or move the content into a child component.`,
            );
        }
    }

    for (const key of Object.keys(model)) {
        if (key === '$' || def.actions?.[key]) {
            continue;
        }
        // read data descriptors only: getters (computed props) must not run before the model exists
        const descriptor = Object.getOwnPropertyDescriptor(model, key);
        if (descriptor && 'value' in descriptor) {
            assertNoReactValue(key, descriptor.value);
        }
    }

    function getNestedAnnotations(basePath: string): Record<string, any> | undefined {
        const prefix = basePath + '.';
        const result: Record<string, any> = {};
        let found = false;
        for (const [keyPath, annotation] of Object.entries(annotationMap)) {
            if (keyPath.startsWith(prefix)) {
                result[keyPath.slice(prefix.length)] = annotation;
                found = true;
            }
        }
        return found ? result : undefined;
    }

    model = observableWithPaths(model, annotationMap, {
        deep: true,
    });

    function createEventHandlers() {
        const onGetKeys = new Map<string, string>();
        function resolveOnGetEventHandler(prop: string) {
            let key = onGetKeys.get(prop);
            if (!key) {
                key = `${$ON_GET}${capitalize(prop)}`;
                onGetKeys.set(prop, key);
            }
            let handler = params.$events?.[key] || def.events?.[key];
            return handler;
        }

        function resolveOnChangingEventHandler(prop: string) {
            const key = `${$ON_CHANGING}${capitalize(prop)}`;
            return ((oldValue: any, newValue: any) => {
                let result = true;
                let handler = params.$events?.[key] as ValueChangingHandler<any>;
                if (handler) {
                    result = handler(oldValue, newValue);
                }
                if (result) {
                    handler = def.events?.[key] as ValueChangingHandler<any>;
                    if (handler) {
                        result = handler(oldValue, newValue);
                    }
                }
                return result;
            }) as ValueChangingHandler;
        }

        function resolveOnChangeEventHandler(prop: string) {
            const key = `${$ON_CHANGE}${capitalize(prop)}`;
            return ((value: any) => {
                (params.$events?.[key] as ValueChangeHandler<any>)?.(value);
                (def.events?.[key] as ValueChangeHandler<any>)?.(value);
            }) as ValueChangeHandler;
        }

        // Always installed: params.$events may be replaced on later renders,
        // so handlers are resolved at call time rather than at model creation.
        const commonHandlers: Pick<ComponentModelEventHandlers, 'onPropChanging' | 'onPropChange'> =
            {
                onPropChanging: (prop, oldValue, newValue) => {
                    let result = true;
                    let handler = params.$events?.onPropChanging;
                    if (handler) {
                        result = handler(String(prop), oldValue, newValue);
                    }
                    if (result) {
                        handler = def.events?.onPropChanging;
                        if (handler) {
                            result = handler(String(prop), oldValue, newValue);
                        }
                    }
                    return result;
                },
                onPropChange: (prop, value) => {
                    params.$events?.onPropChange?.(String(prop), value);
                    def.events?.onPropChange?.(String(prop), value);
                },
            };

        const propHandlers: Record<PropertyKey, PropEventHandlers> = {};

        if (def.props) {
            for (const prop of Object.keys(def.props)) {
                propHandlers[prop] = {
                    // resolved on every read (see commonHandlers)
                    get onGet() {
                        return resolveOnGetEventHandler(prop);
                    },
                    onChanging: resolveOnChangingEventHandler(prop),
                    onChange: resolveOnChangeEventHandler(prop),
                };
            }
        }

        return { ...commonHandlers, ...propHandlers } as ComponentModelEventHandlers;
    }

    const handlers = createEventHandlers();

    const deepProxyCache = new WeakMap<object, Map<string, object>>();

    function isNumericKey(key: string | symbol): key is string {
        return typeof key === 'string' && key !== '' && !isNaN(Number(key));
    }

    function createDeepProxy<T extends object>(obj: T, basePath = ''): T {
        if (!isProxyableValue(obj)) return obj;
        let pathMap = deepProxyCache.get(obj);
        if (!pathMap) {
            pathMap = new Map();
            deepProxyCache.set(obj, pathMap);
        }
        if (pathMap.has(basePath)) return pathMap.get(basePath) as T;

        let proxy: T;

        if (Array.isArray(obj)) {
            proxy = new Proxy(obj, {
                get(target, key, receiver) {
                    if (key === 'toJSON') return () => toPlain(target);
                    const val = Reflect.get(target, key, receiver);
                    if (isNumericKey(key) && isProxyableValue(val)) {
                        const childPath = basePath ? `${basePath}.${key}` : key;
                        return createDeepProxy(val as object, childPath);
                    }
                    // bind methods to target so MobX's internal this-binding is preserved
                    if (typeof val === 'function') return val.bind(target);
                    return val;
                },
                set(target, key, val, receiver) {
                    if (isNumericKey(key)) {
                        const fullPath = basePath ? `${basePath}.${key}` : key;
                        assertNoReactValue(fullPath, val);
                        if (
                            isPlainObject(val) &&
                            !isObservable(val) &&
                            isObservable(Reflect.get(target, key, receiver))
                        ) {
                            const nestedAnnotations = getNestedAnnotations(fullPath);
                            val = nestedAnnotations
                                ? observableWithPaths(val, nestedAnnotations, { deep: false })
                                : observable(val);
                        }
                    }
                    return runInAction(() => Reflect.set(target, key, val, receiver));
                },
            }) as T;
        } else {
            proxy = new Proxy(obj, {
                get(target, key, receiver) {
                    if (key === 'toJSON') return () => toPlain(target);
                    const childPath = basePath ? `${basePath}.${String(key)}` : String(key);
                    const binding = state.bindings[childPath] as Binding | undefined;
                    if (binding?.get) {
                        const raw = binding.get();
                        return binding.converter ? binding.converter.convert(raw) : raw;
                    }
                    const val = Reflect.get(target, key, receiver);
                    if (isProxyableValue(val)) {
                        const annotation = annotationMap[childPath];
                        if (annotation === false) return val;
                        if (annotation === observable.shallow) return val;
                        if (annotation === observable.ref) return val;
                        return createDeepProxy(val as object, childPath);
                    }
                    return val;
                },
                set(target, key, val, receiver) {
                    const fullPath = basePath ? `${basePath}.${String(key)}` : String(key);
                    assertNoReactValue(fullPath, val);
                    if (
                        isPlainObject(val) &&
                        !isObservable(val) &&
                        isObservable(Reflect.get(target, key, receiver))
                    ) {
                        const nestedAnnotations = getNestedAnnotations(fullPath);
                        val = nestedAnnotations
                            ? observableWithPaths(val, nestedAnnotations, { deep: false })
                            : observable(val);
                    }
                    const result = runInAction(() => Reflect.set(target, key, val, receiver));
                    const binding = state.bindings[fullPath] as Binding | undefined;
                    if (binding?.set) {
                        const outVal = binding.converter ? binding.converter.convertBack(val) : val;
                        binding.set(outVal);
                    } else if (import.meta.env.DEV && binding) {
                        reportReadOnlyWrite(fullPath, binding);
                    }
                    handlers.onPropChange?.(fullPath, val);
                    const prop = def.props?.[fullPath];
                    if (isComponentProp(prop) && prop.validator && prop.validator.onChange) {
                        validate(
                            component,
                            def,
                            params,
                            fullPath as KeyPath<TStruct['props'], boolean>,
                        );
                    }
                    return result;
                },
            });
        }
        pathMap.set(basePath, proxy);
        return proxy;
    }

    model = new Proxy(model, {
        get(obj, key, receiver) {
            if (key === 'toJSON') return () => toPlain(obj);

            const onGet = handlers?.[key]?.onGet;
            if (onGet) return onGet();

            const binding = state.bindings[key as TPropPath];

            const val = Reflect.get(obj, key, receiver);
            if (binding?.get) {
                const raw = binding.get();
                if (!(raw === undefined && Reflect.get(binding, $reactProp))) {
                    return binding.converter ? binding.converter.convert(raw) : raw;
                }
            }

            if (val && typeof val === 'object') {
                const annotation = annotationMap[key];
                if (annotation === false) return val;
                if (annotation === observable.shallow) return val;
                if (annotation === observable.ref) return val;
                return createDeepProxy(val, String(key));
            }

            return val;
        },

        set(obj, key, val, receiver) {
            const oldVal = Reflect.get(obj, key);

            // before-change hooks
            const onChanging = handlers?.[key]?.onChanging;
            if (onChanging && onChanging(oldVal, val) === false) {
                return true;
            }

            if (handlers?.onPropChanging && handlers.onPropChanging(key, oldVal, val) === false) {
                return true;
            }

            // bindings
            const binding = state.bindings[key as TPropPath];
            // A React boundary prop with a defined value is controlled by the parent: like a controlled React
            // input, the write is not stored, change handlers still fire (the parent updates it via onChangeX).
            const isControlled =
                !!binding && !binding.set && !!Reflect.get(binding, $reactProp) && binding.get() !== undefined;

            if (!isControlled && typeof key === 'string' && key !== '$') {
                assertNoReactValue(key, val);
            }

            if (isPlainObject(val) && !isObservable(val) && isObservable(oldVal)) {
                const nestedAnnotations = getNestedAnnotations(String(key));
                val = nestedAnnotations
                    ? observableWithPaths(val, nestedAnnotations, { deep: false })
                    : observable(val);
            }

            const result = isControlled
                ? true
                : runInAction(() => {
                    return Reflect.set(obj, key, val, receiver);
                });

            if (binding?.set) {
                const outVal = binding.converter ? binding.converter.convertBack(val) : val;
                binding.set(outVal);
            } else if (import.meta.env.DEV && binding) {
                reportReadOnlyWrite(String(key), binding);
            }

            // after-change hooks
            handlers?.[key]?.onChange?.(val);
            handlers.onPropChange?.(key, val);

            const prop = def.props?.[key as string];
            if (isComponentProp(prop) && prop.validator && prop.validator.onChange) {
                validate(
                    component,
                    def,
                    params,
                    key as KeyPath<TStruct['props'], boolean>,
                );
            }

            return result;
        },
    });

    return model as ComponentModel<TStruct>;
}

export function toHtmlId(url: string): string {
    let parts = url
        .split('/')
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment));

    const raw = parts.join('-');
    // sanitize
    let id = raw
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9\-_:.+#]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[^a-zA-Z]+/, '-')
        // .replace(/:/g, '-')
        // .replace(/\./g, '_')
        // .replace(/#/g, '-')
        .replace(/[+#]$/, '-');
    return id;
}

/**
 * Source location (`url:line:col`, query string removed) of a stack frame line, or `null`.
 * Supports V8 (`at fn (url:1:2)`, `at url:1:2`) and Firefox/Safari (`fn@url:1:2`, `@url:1:2`) formats.
 */
export function parseStackFrameLocation(line: string): string | null {
    const frame = line.trim();
    let location: string | undefined;
    const inParens = frame.match(/\(([^()]+)\)\s*$/);
    if (inParens) {
        location = inParens[1];
    } else if (frame.startsWith('at ')) {
        location = frame.slice(3).trim();
    } else {
        const at = frame.lastIndexOf('@');
        location = at >= 0 ? frame.slice(at + 1) : undefined;
    }
    if (!location || !/:\d+(:\d+)?$/.test(location)) {
        return null;
    }

    return location.replace(/\?[^:]*/, '');
}

/**
 * Best-effort source location of the frame `depth` (V8 numbering: 1 = this function, 2 = its caller, ...).
 * Debug use only: never throws, returns `null` when the stack is unavailable or unrecognized.
 */
export function getComponentSourceByCaller(depth = 2): string | null {
    try {
        const lines = new Error().stack?.split('\n') ?? [];
        // V8 starts with the "Error" header line, Firefox/Safari start with the first frame
        const frames = lines.length > 0 && parseStackFrameLocation(lines[0]) === null ? lines.slice(1) : lines;
        const line = frames[depth - 1];

        return line ? parseStackFrameLocation(line) : null;
    } catch {
        return null;
    }
}

export function getComponentNameByCaller(depth = 2): string | null {
    const err = new Error();
    const stack = err.stack?.split('\n');
    if (!stack || stack.length <= depth) {
        return null;
    }
    const line = stack[depth].trim();
    const match = line.match(/^at\s+([^\s(]+)/);
    if (!match) {
        return null;
    }
    const fnName = match[1];
    const hookMatch = fnName.match(/^use(.+)/);
    if (hookMatch) {
        return hookMatch[1];
    }
    return fnName;
}

export function registerMsgBroker<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(component: Component<TStruct, TMsgHeaders>) {
    const providers = component?.msgBroker.provide;
    if (providers) {
        for (const [channel, providerGroups] of Object.entries(providers)) {
            if (!providerGroups) continue;
            for (const [g, p] of Object.entries(providerGroups)) {
                if (!p) continue;
                // Build new params instead of mutating the definition:
                // registration repeats on every (re)mount (e.g. StrictMode).
                const providerParams = { ...(p as MsgChannelGroupProviderParams) };
                const callback = providerParams.callback;
                if (callback) {
                    providerParams.callback = (msg, headers) => {
                        return callback(msg, headers, component);
                    };
                }
                const filter = providerParams.filter;
                const componentFilter = providerParams.componentFilter || ComponentMsgFilter.None;
                providerParams.filter = (msg) => {
                    let result = true;
                    if (componentFilter & ComponentMsgFilter.FromAncestors) {
                        const ancestorIds = component.getChainUp();
                        result = ancestorIds?.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && componentFilter & ComponentMsgFilter.FromDescendants) {
                        const descendantIds = component.getChainDown();
                        result = descendantIds?.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && filter) {
                        result = filter(msg, component);
                    }
                    return result;
                };

                component.msgBus.provide({
                    ...p,
                    callback: providerParams.callback,
                    filter: providerParams.filter,
                    channel: channel,
                    group: g,
                });
            }
        }
    }
    const subscribers = component?.msgBroker?.subscribe;
    if (subscribers) {
        for (const [channel, subscriberGroups] of Object.entries(subscribers)) {
            if (!subscriberGroups) continue;
            for (const [g, s] of Object.entries(subscriberGroups)) {
                if (!s) continue;
                const subscriberParams = { ...(s as MsgChannelGroupSubscriberParams) };
                const callback = subscriberParams.callback;
                if (callback) {
                    subscriberParams.callback = (msg) => {
                        return callback(msg, component);
                    };
                }
                const filter = subscriberParams.filter;
                const componentFilter = subscriberParams.componentFilter || ComponentMsgFilter.None;
                subscriberParams.filter = (msg) => {
                    let result = true;
                    if (componentFilter & ComponentMsgFilter.FromAncestors) {
                        const ancestorIds = component.getChainUp();
                        result = ancestorIds?.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && componentFilter & ComponentMsgFilter.FromDescendants) {
                        const descendantIds = component.getChainDown();
                        result = descendantIds?.indexOf(msg.headers?.sourceId) >= 0;
                    }
                    if (result && filter) {
                        result = filter(msg, component);
                    }
                    return result;
                };

                component.msgBus.on({
                    ...s,
                    callback: subscriberParams.callback,
                    filter: subscriberParams.filter,
                    channel: channel,
                    group: g,
                });
            }
        }
    }
}

export function normalizePayload<T>(input: T): T {
    if (input === null || typeof input !== 'object') {
        return input;
    }

    if (isObservable(input)) {
        return toPlain(input);
    }

    if (Array.isArray(input)) {
        return input.map(normalizePayload) as T;
    }

    // class instances (File, Blob, Date, Map, AbortSignal, ...) are passed as is: copying their own enumerable keys
    // would turn them into empty objects
    if (!isPlainObject(input)) {
        return input;
    }

    const result: any = {};

    for (const key of Object.keys(input)) {
        const value = input[key];

        if (isObservable(value)) {
            result[key] = toPlain(value);
            continue;
        }

        if (isPlainObject(value)) {
            result[key] = structuredClone(value);
            continue;
        }

        result[key] = normalizePayload(value);
    }

    return result;
}

export function getComponentMsgBus<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(component: Component<TStruct, TMsgHeaders>, msgBus: MsgBus<TStruct['msg'], TMsgHeaders>) {
    const headerSetter = (headers?: TMsgHeaders) => {
        if (headers && headers.sourceId == undefined) {
            headers.sourceId = component.id;
        }
    };

    type OpParams = {
        headers?: TMsgHeaders;
        options?: PromiseOptions | MsgSubOptions;
        payload?: unknown;
        callback?: Func;
    };

    function getParams<TParams extends OpParams>(params: TParams, hasHeaders = false) {
        if (hasHeaders && !params.headers) {
            params.headers = {} as TMsgHeaders;
        }
        headerSetter?.(params.headers);
        if (params.payload != undefined) {
            params.payload = normalizePayload(params.payload);
        }
        if (!params.options) {
            params.options = {};
        }
        let abortSignal = component.abortSignal;
        if (params.options.abortSignal) {
            abortSignal = AbortSignal.any([params.options.abortSignal, abortSignal]);
        }
        params.options.abortSignal = abortSignal;
        return params;
    }

    return {
        config: msgBus.config,
        on: (params) => {
            return msgBus.on(getParams(params, false));
        },
        once: (params) => {
            return msgBus.once(getParams(params, false));
        },
        stream: (params) => {
            return msgBus.stream(getParams(params, false));
        },
        provide: (params) => {
            return msgBus.provide(getParams(params, true));
        },
        send: (params) => {
            return msgBus.send(getParams(params, true));
        },
        request: (params) => {
            component.model.$.pendingRequestCount++;
            return component
                .run(() => msgBus.request(getParams(params, true)), false)
                .finally(() => {
                    component.model.$.pendingRequestCount--;
                });
        },
    } as typeof component.msgBus;
}

export function createEffect<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
>(
    component: Component<TStruct, TMsgHeaders>,
    name: string,
    fn: EffectFn<TStruct, TMsgHeaders>,
): EffectController {
    let disposer: IReactionDisposer | null = null;

    const paused = observable.box(false);

    const start = () => {
        if (disposer) {
            return;
        }
        runInAction(() => {
            paused.set(false);
            disposer = autorun(
                () => {
                    if (!paused.get()) {
                        fn(component);
                    }
                },
                {
                    name: `${component.id}/effects/${name}`,
                },
            );
        });
    };

    const stop = () => {
        disposer?.();
        disposer = null;
    };

    const pause = () => {
        runInAction(() => {
            paused.set(true);
        });
    };

    const resume = () => {
        runInAction(() => {
            paused.set(false);
        });
    };

    start();

    return { pause, resume, stop };
}
