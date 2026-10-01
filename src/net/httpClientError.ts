import { IRequestState, IResponseState, getResponseResult } from "@/net/request";
import HttpStatus from "http-status";

// UNKNOWN/UNRECOGNIZED
export const API_ERROR_INTERNAL_ERROR = "API_ERROR_INTERNAL_ERROR";

// "notmodified", "nocontent", "error", "timeout", "abort", or "parsererror"
export interface IApiErrorOptions<TDetails = any> extends ErrorOptions {
    cause?: TDetails;
    // type/code
    name?: string;
    status?: number;
    request: IRequestState;
    response?: Partial<IResponseState>;
}

export class HttpClientError<TDetails = any> extends Error {
    public isApiError = true;

    readonly name: string;

    readonly message: string;

    readonly request: IRequestState;

    readonly response: Partial<IResponseState>;

    readonly status: number; // code/type

    public constructor(message: string, options?: IApiErrorOptions<TDetails>) {
        // status: number, request: IRequestState, response?: Partial<IResponseState>, name?: string
        super(message);
        this.status = options.status;
        this.message = message || options.name; // message ?? options.name
        this.request = options.request;
        this.response = options.response;
        this.name = options.name || API_ERROR_INTERNAL_ERROR;
        Object.setPrototypeOf(this, HttpClientError.prototype);
    }

    static async create(response: Partial<IResponseState>, request?: IRequestState) {
        if (!response) {
            return new HttpClientError("Invalid request", {
                request
            });
        }

        const status = response.status;

        if (typeof status === "number" && status >= 200 && status < 300) {
            return null;
        }

        let msg = (typeof status === "number" && HttpStatus[`${status}_MESSAGE`] as string) || "An unexpected server error occurred.";
        const name = typeof status === "number" ? `HTTP_STATUS_${status}` : API_ERROR_INTERNAL_ERROR;
        let details: unknown = undefined;

        if (response && typeof (response as Response).clone === "function") {
            try {
                const cloned = (response as Response).clone();
                const text = await cloned.text();
                if (text) {
                    try {
                        const json = JSON.parse(text);
                        details = json;
                        const serverDetail = json.detail || json.message || json.error;
                        if (typeof serverDetail === "string" && serverDetail.trim()) {
                            msg = `${serverDetail.trim()} (${name})`;
                        }
                    } catch {
                        details = text;
                        if (text.length < 200) {
                            msg = `${text.trim()} (${name})`;
                        }
                    }
                }
            } catch {
                // Ignore clone/read errors
            }
        }

        const error = new HttpClientError(msg, {
            status,
            request,
            response,
            name,
            cause: details,
        });
        return error;
    }

    static async assert(response: IResponseState, request: IRequestState) {
        const err = await HttpClientError.create(response, request);
        if (err) {
            throw err;
        }
    }

    static isApiError(obj: any): obj is HttpClientError {
        return obj?.isApiError === true || obj?.name?.startsWith?.("HTTP_STATUS_");
    }
}

export type NetworkErrorKind = 'offline' | 'unreachable' | 'timeout' | 'aborted';

export type HttpNetworkErrorOptions = ErrorOptions & {
    kind: NetworkErrorKind;
    url: string;
    method?: string;
    request?: IRequestState;
};

export class HttpNetworkError extends Error {
    public readonly isNetworkError = true;

    readonly kind: NetworkErrorKind;

    readonly url: string;

    readonly method?: string;

    readonly request?: IRequestState;

    public constructor(message: string, options: HttpNetworkErrorOptions) {
        super(message, { cause: options.cause });
        this.name = 'HttpNetworkError';
        this.kind = options.kind;
        this.url = options.url;
        this.method = options.method;
        this.request = options.request;
        Object.setPrototypeOf(this, HttpNetworkError.prototype);
    }

    static isNetworkError(obj: unknown): obj is HttpNetworkError {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            ((obj as HttpNetworkError).isNetworkError === true ||
                (obj as Error).name === 'HttpNetworkError')
        );
    }
}

export function isNetworkFailure(err: unknown): boolean {
    if (!err) {
        return false;
    }
    if (HttpNetworkError.isNetworkError(err)) {
        return true;
    }
    const name = (err as Error).name;
    const message = (err as Error).message || '';
    if (name === 'TypeError') {
        return /failed to fetch|networkerror|load failed|fetch failed/i.test(message);
    }
    if (name === 'AbortError') {
        return true;
    }
    const causeCode = (err as { cause?: { code?: string } })?.cause?.code;
    if (
        causeCode === 'ECONNREFUSED' ||
        causeCode === 'ENOTFOUND' ||
        causeCode === 'ETIMEDOUT'
    ) {
        return true;
    }

    return false;
}
