// Transport

import httpStatus from "http-status";
import { AwaitedReturnType, Func } from "@actdim/utico/typeCore";
import { HttpClientError } from "./httpClientError";

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

export const getHeaderValue = (headers: HeadersInit | Headers | undefined | null, name: string): string | undefined => {
    if (!headers) {
        return undefined;
    }
    if (headers instanceof Headers || typeof (headers as any).get === "function") {
        return (headers as Headers).get(name) ?? undefined;
    }
    if (Array.isArray(headers)) {
        const entry = headers.find(([key]) => {
            return key.toLowerCase() === name.toLowerCase();
        });
        return entry ? entry[1] : undefined;
    }
    const key = Object.keys(headers).find((k) => {
        return k.toLowerCase() === name.toLowerCase();
    });
    return key ? (headers as Record<string, string>)[key] : undefined;
};

export const getBaseContentType = (contentType?: string | null): string => {
    if (!contentType) {
        return "";
    }
    return contentType.split(";")[0].trim().toLowerCase();
};

// https://stackoverflow.com/questions/64781995/how-to-get-mime-type-of-an-array-buffer-object
export async function getResponseResult(response: IResponseState, request: IRequestState): Promise<any> {
    const requestContentType = request.contentType || getHeaderValue(request.headers, "content-type");
    let responseContentType: string | undefined = undefined;
    if (response.headers) {
        responseContentType = getHeaderValue(response.headers, "content-type");
    }

    const baseRequestContentType = getBaseContentType(requestContentType);
    const baseResponseContentType = getBaseContentType(responseContentType);

    if (
        baseRequestContentType &&
        baseResponseContentType &&
        baseRequestContentType !== "*/*" &&
        baseResponseContentType !== baseRequestContentType
    ) {
        throw new HttpClientError(
            `Response Content-Type '${responseContentType}' does not match requested Content-Type '${requestContentType}'`,
            {
                status: response.status,
                request,
                response,
                name: "CONTENT_TYPE_MISMATCH"
            }
        );
    }

    let result: any = undefined;
    if (!response.resolved) {
        response.resolved = {};
    }
    const resolved = response.resolved;
    const contentType = baseResponseContentType || baseRequestContentType;
    if (contentType.startsWith("text/")) {
        result = await response.text();
    } else if (contentType.startsWith("image/") || contentType.startsWith("audio/") || contentType.startsWith("video/")) {
        result = await response.blob();
    } else {
        if (contentType.startsWith("application/json")) {
            result = await response.json();
            resolved.json = result;
        } else if (contentType.startsWith("application/octet-stream")) {
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
        throw HttpClientError.create(response, request);
    }

    request.result = result;
    return result;
}

export type IRequestCallbacks<TResult = any> = {
    // onBeforeExecuteRequest
    onBeforeSendRequest?: (event: {
        request: IRequestParams;
        // interrupt
        cancel: boolean;
        handled: boolean;
        result?: TResult;
    }) => Promise<void>;
    onResponseRead?: (event: { response: Response; result: TResult }) => Promise<void>;
};

// IRequestOptions
export type IRequestParams<TResult = any> = RequestInit & {
    id?: string;
    tag?: string;
    url: string;
    // authType?: ...;
    useAuth?: boolean;
    // authToken?: string; // bearerToken
    // accepts: string[]; // https://developer.mozilla.org/ru/docs/Web/HTTP/Headers/Accept
    crossDomain?: boolean;
    // contentType?: MimeType;
    contentType?: string;
    httpOnly?: boolean;
    // transportType: ...;
    callbacks?: IRequestCallbacks<TResult>;
};
