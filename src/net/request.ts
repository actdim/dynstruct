// Transport

import httpStatus from "http-status";
import { AsyncFunc, AwaitedReturnType, Func } from "@actdim/utico/typeCore";
import { ApiError } from "./apiError";

export type IFetcher = {
    fetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

// IParsedBody
export type IResolvedBody = {
    [K in keyof Body]?: Body[K] extends Func ? AwaitedReturnType<Body[K]> : Body[K];
};

// https://www.iana.org/assignments/media-types/media-types.xhtml
export type MimeType =
    // application
    | "application/atom+xml"
    | "application/json"
    | "application/javascript"
    | "application/octet-stream"
    | "application/pdf"
    | "application/postscript"
    | "application/soap+xml"
    | "application/font-woff"
    | "application/xhtml+xml"
    | "application/zip"
    | "application/gzip"
    | "application/x-tex"
    | "application/xml"
    | "application/msword"
    // text
    | "text/cmd"
    | "text/css"
    | "text/csv"
    | "text/html"
    // "text/javascript" |
    | "text/plain"
    | "text/xml"
    | "text/markdown"
    // image
    | "image/png"
    | "image/jpeg"
    | "image/tiff";

// RequestExecutionStatus
export type RequestStatus =
    // Created
    | "" // none/created/new/unsent
    // Queued
    | "queued" // scheduled
    // Executing
    | "executing" // sent/pending/processing/in-progress
    // "suspended" | // on-hold
    // Successful
    | "succeeded" // successful/resolved/done/completed/finished/fulfilled/complete
    // Unsuccessful
    | "failed" // unsuccessful/rejected
    // Aborted
    | "canceled"; // aborted/terminated

export type IResponseState = Response & {
    // parsed?
    resolved?: IResolvedBody;
};

export type IRequestState = IRequestParams & {
    status: RequestStatus;
    result?: any;
};

export const getResponseBlob = (response: Response) => response.blob();

export const getResponseJson = (response: Response) => response.json();

export const getResponseText = (response: Response) => response.text();

export const getResponseArrayBuffer = (response: Response) => response.arrayBuffer();

// https://stackoverflow.com/questions/64781995/how-to-get-mime-type-of-an-array-buffer-object
export async function getResponseResult(response: IResponseState, request: IRequestState): Promise<any> {
    // const headers: { [key: string]: string } = {};
    let contentType =
        request.contentType ||
        (request.headers && request.headers instanceof Headers ? request.headers.get("content-type") : request.headers["Content-Type"]);
    if (response.headers) {
        // for (const k in response.headers.keys()) {
        //     headers[k] = response.headers.get[k];
        // }
        // if (response.headers.forEach) {
        //     response.headers.forEach((v, k) => headers[k] = v);
        // }
        contentType = response.headers instanceof Headers ? response.headers.get("content-type") : response.headers["content-type"];
    }
    let result: any = undefined;
    if (!response.resolved) {
        response.resolved = {};
    }
    const resolved = response.resolved;
    contentType = (contentType || "").toLowerCase();
    if (contentType.startsWith("text/")) {
        result = await response.text();
    } else if (contentType.startsWith("image/")) {
        result = await response.blob();
    } else {
        if (contentType.startsWith("application/json")) {
            result = await response.json();
            resolved.json = result;
        } else if (contentType.startsWith("octet-stream")) {
            result = await response.blob();
            resolved.blob = result;
        } else {
            try {
                resolved.json = await response.clone().json();
            } catch {
                try {
                    resolved.text = await response.text();
                } catch {
                }
            }
            // unexpected response
            // throw new Error(`Unsupported content type: ${contentType}`);
        }
    }
    if (!(response.status === httpStatus.OK || response.status === httpStatus.NO_CONTENT)) {
        // JSON.stringify(resolved)
        throw ApiError.create(response, request);
    }

    request.result = result;
    return result;
}

export interface IRequestCallbacks<TResult = any> {
    // onBeforeExecuteRequest
    onBeforeSendRequest?: (event: {
        request: IRequestParams;
        // interrupt
        cancel: boolean;
        handled: boolean;
        result?: TResult;
    }) => Promise<void>;
    onResponseRead?: (event: { response: Response; result: TResult }) => Promise<void>;
}

// IRequestOptions
export interface IRequestParams<TResult = any> extends RequestInit {
    // TODO: support WebSocket transport
    id?: string;
    tag?: string;
    url: string;
    // authType?: ...;
    useAuth?: boolean;
    // authToken?: string; // bearerToken
    // TODO: support
    // accepts: string[]; // https://developer.mozilla.org/ru/docs/Web/HTTP/Headers/Accept
    // TODO: support
    crossDomain?: boolean;
    contentType?: MimeType; // dataType
    httpOnly?: boolean;
    // transportType: ...;
    callbacks?: IRequestCallbacks<TResult>;
}
