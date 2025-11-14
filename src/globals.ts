export { };

export type GlobalFlags = {
    debug?: boolean;
};

const defaultGlobalFlags: GlobalFlags = {
    debug: false
}

declare global {
    interface Window {
        __DYNSTRUCT__?: GlobalFlags;
    }

}

// getUserFlags
export function getGlobalFlags() {
    // window
    const globalObj = globalThis as Window & typeof globalThis;

    if (typeof globalObj === 'undefined') {
        return defaultGlobalFlags;
    }

    return window.__DYNSTRUCT__ || defaultGlobalFlags;
}