// import { createViewModel } from "@/componentModel";
import {
    reaction,
    observe,
    Lambda,
    IReactionPublic,
    IReactionOptions,
    IReactionDisposer,
    IObjectDidChange,
    // IArrayChange,
    IArraySplice,
    IMapDidChange,
    autorun,
    IAutorunOptions
} from "mobx";
import { deepObserve, IDisposer } from "mobx-utils";

export type IObjectChange<T> = IObjectDidChange & {
    name: keyof T;
    object: T;
};
export class DisposableComponent implements Disposable {
    // finalizers
    protected readonly finalizers: IDisposer[];

    protected isDisposed: boolean;

    public handlers: Set<Promise<any>>;

    constructor() {
        this.isDisposed = false;
        this.finalizers = [];
        this.handlers = new Set<Promise<any>>();
    }

    protected deepObserve<T = any>(
        target: T,
        // | IArrayChange
        listener: (change: IObjectDidChange | IArraySplice | IMapDidChange, path: string, root: T) => void
    ): IDisposer {
        const releaser = deepObserve(target, listener);
        this.registerFinalizers(releaser);
        return releaser;
    }

    protected autorun(view: (r: IReactionPublic) => any, opts?: IAutorunOptions): IReactionDisposer {
        const releaser = autorun(view, opts);
        this.registerFinalizers(releaser);
        return releaser;
    }

    protected observe<T = Object>(object: T, listener: (change: IObjectChange<T>) => void, registerDisposer = true): Lambda {
        const releaser = observe(object, listener);
        if (registerDisposer) {
            this.registerFinalizers(releaser);
        }
        return releaser;
    }

    public async allHandlersAsync(): Promise<void> {
        await Promise.all(this.handlers);
    }

    protected validateState() {
        if (this.isDisposed) {
            throw new Error("Cannot access a disposed object");
        }
    }
    
    protected observeAsync<T = Object>(
        object: T,
        listener: (change: IObjectChange<T>) => Promise<any>,
        registerDisposer = true,
        handlers = this.handlers
    ): Lambda {
        this.validateState();        
        const releaser = observe(object, (change) => {
            let task: Promise<any> = null;
            task = (async () => {
                await listener(change as IObjectChange<T>);
                handlers.delete(task);
            })();
            handlers.add(task);
        });
        if (registerDisposer) {
            this.registerFinalizers(releaser);
        }
        return releaser;
    }

    protected multiObserve(
        objects: Object[],
        listener: (change: IObjectDidChange) => void,
        fireImmediately?: boolean,
        registerDisposer = (d: () => void) => {
            this.registerFinalizer(d);
        }
    ): Lambda[] {
        const releasers: Lambda[] = [];
        for (const object of objects) {
            const releaser = observe(object, listener, fireImmediately);
            releasers.push(releaser);
            if (registerDisposer) {
                registerDisposer(releaser);
            }
        }
        return releasers;
    }

    protected reaction<T>(
        expression: (r: IReactionPublic) => T,
        effect: (arg: T, prev: T, r: IReactionPublic) => void,
        opts?: IReactionOptions<T, boolean>
    ): IReactionDisposer {
        const releaser = reaction(expression, effect, opts);
        this.registerFinalizers(releaser);
        return releaser;
    }

    protected multiReaction<T>(
        expressions: ((r: IReactionPublic) => T)[],
        effect: (arg: T, prev: T, r: IReactionPublic) => void,
        opts: IReactionOptions<T, boolean> = undefined,
        registerDisposer = (d: () => void) => {
            this.registerFinalizer(d);
        }
    ): IReactionDisposer[] {
        const releasers: IReactionDisposer[] = [];
        if (!opts) {
            opts = undefined;
        }
        for (const expression of expressions) {
            const releaser = reaction(expression, effect, opts);
            releasers.push(releaser);
            if (registerDisposer) {
                registerDisposer(releaser);
            }
        }

        return releasers;
    }

    // registerDisposers
    protected registerFinalizers(...actions: (() => void)[]) {
        this.finalizers.push(...actions);
    }

    // registerDisposer
    protected registerFinalizer(action: () => void) {
        this.registerFinalizers(action);
        return action;
    }

    protected registerDisposable(disposable: Disposable) {
        return this.registerFinalizer(disposable[Symbol.dispose].bind(disposable));
    }

    [Symbol.dispose]() {
        if (this === undefined) {
            console.error('undefined "this"');
        }
        if (!this.isDisposed) {
            for (const d of this.finalizers) {
                try {
                    d && d();
                } catch (err) {
                    throw err; // for debug
                }
            }
            this.finalizers.length = 0;
            // while (this.finalizers.length) {
            //     const d = this.finalizers.pop();
            //     d && d();
            // }
            this.isDisposed = true;
        }
    }
}

// export class Model extends DisposableComponent {
    
//     public isBusy: boolean = true; // isLoading

//     protected async withBusyAsync<T>(asyncAction: () => Promise<T>) {
//         transaction(() => {
//             this.isBusy = true;
//         });
//         try {
//             return await asyncAction();
//         } finally {
//             transaction(() => {
//                 this.isBusy = false;
//             });
//         }
//     }

//     protected withBusy<T>(action: () => T) {
//         transaction(() => {
//             this.isBusy = true;
//         });
//         try {
//             return action();
//         } finally {
//             transaction(() => {
//                 this.isBusy = false;
//             });
//         }
//     }
// }
