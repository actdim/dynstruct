import { v4 as uuid } from "uuid";
import httpStatus from "http-status";
import { getResponseResult, IFetcher, IRequestCallbacks, IRequestParams, IRequestState } from "./request";
import { ApiError } from "./apiError";
import { BaseAppMsgStruct, BaseApiConfig } from "@/appDomain/appContracts";
import { MsgBus, MsgSubOptions } from "@actdim/msgmesh/contracts";
import { $AUTH_ENSURE, $AUTH_REFRESH, $AUTH_SIGNIN, $AUTH_SESSION_GET, $AUTH_SIGNOUT } from "@/appDomain/securityContracts";
import { $CONFIG_CHANGED, $CONFIG_GET, BaseAppDomainConfig } from "@/appDomain/commonContracts";
import { BaseAppContext } from "@/componentModel/contracts";

export function extractApiName(name: string, suffixes: string[]): string | null {
    if (!name) {
        return name;
        // return null; // ?
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

    public baseUrl: string;

    public accessToken: string;

    public name: string;

    public apiId: string;

    // requestStateStore
    private requestStateMap: Map<string, IRequestState>;

    private fetcher: IFetcher;

    private msgBus: MsgBus<BaseAppMsgStruct>;

    private apiSuffixes: string[];

    private apiConfig: BaseApiConfig;

    private abortController: AbortController;

    constructor(context: BaseAppContext, fetcher?: IFetcher, apiSuffixes = API_SUFFIXES) {
        this.apiSuffixes = apiSuffixes;
        this.fetcher = fetcher || window;
        this.requestStateMap = new Map<string, IRequestState>();
        this.msgBus = context.msgBus;
        this.abortController = new AbortController();
        const abortSignals = [this.abortController.signal];
        if (context?.abortSignal) {
            abortSignals.push(context.abortSignal);
        }
        const abortSignal = AbortSignal.any(abortSignals);

        const options: MsgSubOptions = {
            abortSignal
        };

        this.msgBus.on({
            channel: $CONFIG_CHANGED,
            callback: async (msg) => {
                await this.updateApiConfig(msg.payload);
            }, options
        });

        this.msgBus.on({
            channel: $AUTH_SIGNIN,
            group: "out",
            callback: (msg) => {
                this.accessToken = msg.payload.accessToken;
                // this.updateSecurity();
            },
            options
        });

        this.msgBus.on({
            channel: $AUTH_SIGNOUT,
            group: "out",
            callback: (msg) => {
                this.accessToken = null;
                // this.updateSecurity();
            },
            options
        });

    }

    [Symbol.dispose]() {
        this.abortController.abort();
    }

    protected async init() {
        if (!this.baseUrl) {
            await this.updateApiConfig();
        }
        if (!this.accessToken) {
            await this.updateSecurity();
        }
    }

    protected async updateApiConfig(config?: BaseAppDomainConfig) {
        if (!config) {
            const msg = await this.msgBus.request({
                channel: $CONFIG_GET
            });
            config = msg.payload;
        }
        let apiId = this.apiId;
        if (!apiId) {
            this.apiId = apiId = extractApiName(this.name, this.apiSuffixes);
        }
        const apiEntry = Object.entries(config?.apis || {}).find((entry) => entry[0].toLowerCase() === apiId?.toLowerCase());
        if (!apiEntry) {
            console.warn(`API "${apiId}" is not defined in the current configuration. Using default configuration.`);
        }
        this.apiConfig = apiEntry?.[1];
        this.baseUrl = this.apiConfig?.url || config?.baseUrl;
    }

    private async updateSecurity() {
        const msg = await this.msgBus.request({
            channel: $AUTH_SESSION_GET
        });
        this.accessToken = msg.payload.accessToken;
        return this.accessToken;
    }

    private async addAuthorizationAsync(request: IRequestParams) {
        if (!this.accessToken) {
            await this.updateSecurity();
        }
        const accessToken = this.accessToken;
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
        // retryCount
        let attempt = 0;
        do {
            try {
                if (request.useAuth) {
                    await this.addAuthorizationAsync(request);
                }
                return await this.executeRequestInternalAsync(request);
            } catch (err) {
                if (err instanceof ApiError) {
                    if (attempt > 0) {
                        throw err;
                    }
                    if (err.status === httpStatus.UPGRADE_REQUIRED) {
                        // await this.context.msgBus.request({
                        //     channel: "APP.RELOAD"
                        // });
                        throw err;
                    } else if (err.status === httpStatus.UNAUTHORIZED) {
                        if (err.response?.headers?.get("token-expired")) {
                            // token expired or invalid
                            await this.msgBus.request({
                                channel: $AUTH_REFRESH
                            });
                        } else {
                            await this.msgBus.request({
                                channel: $AUTH_ENSURE
                            });
                        }
                        // codes:
                        // TOKEN_EXPIRED
                        // TOKEN_INVALID
                        // TOKEN_MISSING
                        // AUTH_REQUIRED
                        // header: WWW-Authenticate
                        continue;
                    } else if (err.status >= httpStatus.INTERNAL_SERVER_ERROR) {
                        continue;
                    }
                }
                throw err;
            } finally {
                attempt++;
            }
        } while (true);
    }

    // T extends IApiResponse
    protected async fetchAsync<T>(requestParams: IRequestParams): Promise<T> {
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

        let request = {
            ...requestParams,
            status: "queued",
            response: undefined,
            result: undefined
        } as IRequestState;

        this.requestStateMap.set(requestParams.id, request);

        await this.executeRequestAsync(request);
        return request.result;
    }
}

// TODO: support request cancellation
// https://stackoverflow.com/questions/31061838/how-do-i-cancel-an-http-fetch-request
// https://mukeshprajapati0251.medium.com/cancel-rest-api-pending-request-1af65e70366d

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

// BLOB
let reader = new FileReader();
reader.onload = event => resolve((event.target as any).result);
reader.readAsText(blob);
*/
