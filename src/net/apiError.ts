import { IRequestState, IResponseState, getResponseResult } from "@/net/request";
import * as HttpStatus from "http-status";

// UNKNOWN/UNRECOGNIZED
export const API_ERROR_INTERNAL_ERROR = "API_ERROR_INTERNAL_ERROR";

// "notmodified", "nocontent", "error", "timeout", "abort", or "parsererror"

// TODO: use http-problem-details or error-http-response (application/problem+json)

export interface IApiErrorOptions<TDetails = any> extends ErrorOptions {
    cause?: TDetails;
    // type/code
    name?: string;
    status?: number;
    request: IRequestState;
    response?: Partial<IResponseState>;
}

// RequestError
export class ApiError<TDetails = any> extends Error {
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
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    static create(response: Partial<IResponseState>, request?: IRequestState) {
        if (!response) {
            return new ApiError("Invalid request", {
                request
            });
        }

        const status = response.status;

        if (status === HttpStatus.OK) {
            return null;
        }

        // const statusClass = HttpStatus[`${status}_CLASS`] as HttpStatus.HttpStatusClasses;
        // const statusClassName = HttpStatus.classes[String(statusClass)]; // HttpStatus.classes[`${statusClass}_NAME`]
        // const statusClassMsg = HttpStatus.classes[`${statusClass}_MESSAGE`];
        const msg = HttpStatus[`${status}_MESSAGE`] as string; // || "An unexpected server error occurred."
        const name = `HTTP_STATUS_${status}`;
        // response.resolved
        const error = new ApiError(msg, {
            status,
            request,
            response,
            name
        });
        return error;
    }

    static async assert(response: IResponseState, request: IRequestState) {
        const err = await ApiError.create(response, request);
        if (err) {
            throw err;
        }
    }

    static isApiError(obj: any): obj is ApiError {
        return obj.isApiError === true;
    }
}
