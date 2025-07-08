import { v4 as uuid } from "uuid";
import httpStatus from "http-status";
import { getResponseResult, IFetcher, IRequestCallbacks, IRequestParams, IRequestState } from "./request";
import { ApiError } from "./apiError";
import { BaseAppBusStruct, BaseAppContext } from "@/appDomain/appContracts";
import { MsgBus } from "@actdim/msgmesh/msgBusCore";

// MLWEB-2172

// TODO: support request cancellation
// https://stackoverflow.com/questions/31061838/how-do-i-cancel-an-http-fetch-request
// https://mukeshprajapati0251.medium.com/cancel-rest-api-pending-request-1af65e70366d

export function extractApiName(name: string, suffixes: string[]): string | null {
    if (!name) {
        return name;
    }
    const escaped = suffixes.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const group = escaped.join("|");
    const pattern = new RegExp(`(_?(${group}))+?$`, "i");

    let result = name.replace(pattern, "");

    result = result.trim();
    return result.length > 0 ? result : name;
}

const API_SUFFIXES = ["api", "controller", "client", "fetcher"];
// App(Api)ClientBase
export class ClientBase {
    protected baseUrl: string;
    protected name: string;
    // private requestStates
    private requestStateMap: Map<string, IRequestState>;

    private fetcher: IFetcher;

    private msgBus: MsgBus<BaseAppBusStruct>;

    private accessToken: string;

    private init: Promise<any>;

    constructor(context: BaseAppContext, fetcher?: IFetcher) {
        this.fetcher = fetcher || window;
        this.requestStateMap = new Map<string, IRequestState>();
        this.msgBus = context.msgBus;
        // TODO: unsubscribe
        this.msgBus.on({
            channel: "APP-SECURITY-AUTH-SIGNIN",
            group: "out",
            callback: (msg) => {
                this.accessToken = msg.payload.accessToken;
            }
        });
        this.init = Promise.all([this.getBaseUrlAsync(), this.updateSecurityAsync()]);
    }

    protected async getBaseUrlAsync() {
        const msg = await this.msgBus.dispatchAsync({
            channel: "APP-CONFIG-GET"
        });
        const config = msg.payload;
        const apiName = extractApiName(this.name, API_SUFFIXES);
        const apiEntry = Object.entries(config.apis).find((entry) => entry[0].toLowerCase() === apiName?.toLowerCase());
        this.baseUrl = apiEntry?.[1].url || config.baseUrl;
    }

    private async updateSecurityAsync() {
        if (!this.accessToken) {
            const msg = await this.msgBus.dispatchAsync({
                channel: "APP-SECURITY-GET-CONTEXT"
            });
            this.accessToken = msg.payload.accessToken;
        }
        return this.accessToken;
    }

    private async addAuthorizationAsync(request: IRequestParams) {
        const accessToken = await this.updateSecurityAsync();
        if (!accessToken) {
            throw ApiError.create({
                status: httpStatus.UNAUTHORIZED
            });
        }
        const authorizationHeader = "Authorization";
        const headers = request.headers;
        const headerValue = `Bearer ${accessToken}`;
        if (headers instanceof Headers) {
            // if (headers.has(authorizationHeader)) {
            //     headers.delete(authorizationHeader)
            // }
            // headers.append(authorizationHeader, headerValue);
            headers.set(authorizationHeader, headerValue);
        } else {
            throw new Error("Unsupported headers"); // object type
        }
    }

    private async executeRequestInternalAsync(request: IRequestState) {
        try {
            let proceed = true;
            const onBeforeSendRequest = request.callbacks && request.callbacks.onBeforeSendRequest;
            if (onBeforeSendRequest) {
                const event = {
                    request: request,
                    cancel: false,
                    handled: false
                } as Parameters<IRequestCallbacks["onBeforeSendRequest"]>[0];
                await onBeforeSendRequest(event);
                if (event.cancel) {
                    // interrupt
                    proceed = false;
                    request.status = "canceled";
                    if (event.handled) {
                        request.result = event.result;
                    } else {
                        // ApiError?
                        throw new Error("The request was aborted"); // has been? canceled?
                    }
                }
            }
            if (proceed) {
                request.status = "executing";
                const response = await this.fetcher.fetch(request.url, request);
                ApiError.assert(response, request);
                let onResponseRead = request.callbacks && request.callbacks.onResponseRead;
                if (!onResponseRead) {
                    onResponseRead = async (event) => {
                        const result = await getResponseResult(response, request);
                        event.result = result;
                    };
                }
                const event = {
                    response: response
                } as Parameters<IRequestCallbacks["onResponseRead"]>[0];

                await onResponseRead(event);
                request.result = event.result;
                request.status = "succeeded";
            }
        } catch (err) {
            request.status = "failed";
            // throw ApiError.create(undefined, request);
            throw err;
        }
        return request;
    }

    private async executeRequestAsync(request: IRequestState): Promise<IRequestState> {
        let attempt = 0;
        do {
            try {
                if (request.useAuth) {
                    await this.addAuthorizationAsync(request);
                }
                return this.executeRequestInternalAsync(request);
            } catch (err) {
                if (err instanceof ApiError) {
                    if (attempt > 0) {
                        throw err;
                    }
                    if (err.status === httpStatus.UPGRADE_REQUIRED) {
                        // await this.context.msgBus.dispatchAsync({
                        //     channel: "APP_RELOAD" // APP_REQUEST_UPDGRADE
                        // });
                        throw err;
                    } else if (err.status === httpStatus.UNAUTHORIZED) {
                        if (err.response?.headers?.get("token-expired")) {
                            // token expired or invalid
                            await this.msgBus.dispatchAsync({
                                channel: "APP-SECURITY-AUTH-REFRESH"
                            });
                        } else {
                            await this.msgBus.dispatchAsync({
                                channel: "APP-SECURITY-REQUEST-AUTH"
                            });
                        }
                        // codes:
                        // TOKEN_EXPIRED
                        // TOKEN_INVALID
                        // TOKEN_MISSING
                        // AUTH_REQUIRED
                        // header: WWW-Authenticate
                        continue;
                    }
                    continue;
                }
                throw err;
            } finally {
                attempt++;
            }
        } while (true);
    }

    // T extends IApiResponse
    public async fetchAsync<T>(requestParams: IRequestParams): Promise<T> {
        await this.init;

        const defaultParams: Partial<IRequestParams> = {
            contentType: "application/json",
            method: "POST",
            body: null,
            headers: {},
            cache: "default",
            credentials: "same-origin",
            mode: "cors"
        };

        requestParams = { ...defaultParams, ...requestParams };
        if (!requestParams.id) {
            requestParams.id = uuid();
        }

        let request = {
            ...requestParams,
            status: "queued",
            response: undefined,
            result: undefined
        } as IRequestState;

        this.requestStateMap.set(requestParams.id, request);

        if (!(requestParams.headers instanceof Headers)) {
            requestParams.headers = new Headers(requestParams.headers);
        }

        requestParams.headers.append("Content-Type", requestParams.contentType);
        // "api-version"

        if (requestParams.method === "POST") {
            if (!requestParams.body) {
                requestParams.body = "";
            }
        }

        await this.executeRequestAsync(request);
        return request.result;
    }
}
/* 
if (status === 404) {
      return response.text().then((_responseText) => {
      let result404: any = null;
      result404 = _responseText === "" ? null : JSON.parse(_responseText, this.jsonParseReviver) as __API__ProblemDetails;
      return throwException("Not Found", status, _responseText, _headers, result404);
      });
  } else if (status !== 200 && status !== 204) {
      return response.text().then((_responseText) => {
      return throwException("An unexpected server error occurred.", status, _responseText, _headers);
      });
  }

BLOB
let reader = new FileReader();
        reader.onload = event => resolve((event.target as any).result);
        reader.readAsText(blob);
*/
