import { describe, it, expect } from "vitest";
import {
    HttpClientError,
    HttpNetworkError,
    isNetworkFailure
} from "@/net/httpClientError";
import { HttpClient } from "@/net/httpClient";
import type { IFetcher } from "@/net/request";
import { toAppError } from "@/appDomain/util";

describe("HttpNetworkError and isNetworkFailure", () => {
    it("recognizes HttpNetworkError instance and duck-typed serialized objects", () => {
        const error = new HttpNetworkError("Could not connect", {
            kind: "unreachable",
            url: "http://localhost:5000/api/v1/auth"
        });

        expect(error.name).toBe("HttpNetworkError");
        expect(error.kind).toBe("unreachable");
        expect(error.url).toBe("http://localhost:5000/api/v1/auth");
        expect(HttpNetworkError.isNetworkError(error)).toBe(true);

        const serialized = {
            name: "HttpNetworkError",
            message: "Could not connect",
            kind: "unreachable",
            url: "http://localhost:5000/api/v1/auth"
        };
        expect(HttpNetworkError.isNetworkError(serialized)).toBe(true);
    });

    it("detects browser and node network errors in isNetworkFailure", () => {
        expect(isNetworkFailure(new TypeError("Failed to fetch"))).toBe(true);
        expect(isNetworkFailure(new TypeError("Load failed"))).toBe(true);
        expect(isNetworkFailure(new TypeError("NetworkError when attempting to fetch resource."))).toBe(true);

        const abortErr = new Error("The operation was aborted");
        abortErr.name = "AbortError";
        expect(isNetworkFailure(abortErr)).toBe(true);

        const nodeConnRefused = new Error("connect ECONNREFUSED 127.0.0.1:5000");
        (nodeConnRefused as any).cause = { code: "ECONNREFUSED" };
        expect(isNetworkFailure(nodeConnRefused)).toBe(true);

        expect(isNetworkFailure(new Error("Generic application error"))).toBe(false);
    });

    it("HttpClient wraps failed fetcher into HttpNetworkError", async () => {
        const failingFetcher: IFetcher = {
            fetch: async () => {
                throw new TypeError("Failed to fetch");
            }
        };

        const mockContext = {
            msgBus: {
                on: () => {
                    return () => {};
                },
                request: async () => {}
            }
        } as any;

        const client = new HttpClient(mockContext, failingFetcher);

        let caught: unknown = null;
        try {
            await client.fetch({
                url: "http://localhost:5000/api/v1/test",
                method: "GET"
            });
        } catch (err) {
            caught = err;
        }

        expect(caught).toBeInstanceOf(HttpNetworkError);
        const netErr = caught as HttpNetworkError;
        expect(netErr.kind).toBe("unreachable");
        expect(netErr.url).toBe("http://localhost:5000/api/v1/test");
        expect(netErr.message).toContain("Could not connect to server");
    });
});

describe("HttpClient response status handling", () => {
    const mockContext = {
        msgBus: {
            on: () => {
                return () => {};
            },
            request: async () => {}
        }
    } as any;

    const jsonFetcher = (status: number, body: unknown): IFetcher => ({
        fetch: async () =>
            new Response(JSON.stringify(body), {
                status,
                headers: { "Content-Type": "application/json" }
            })
    });

    it("returns the parsed result for 201 Created", async () => {
        const client = new HttpClient(mockContext, jsonFetcher(201, { id: "item-1" }));

        const result = await client.fetch<{ id: string }>({
            url: "http://localhost:5000/api/v1/intake",
            method: "POST",
            body: JSON.stringify({ text: "x" })
        });

        expect(result).toEqual({ id: "item-1" });
    });

    it("rejects with an HttpClientError (not a Promise) for 4xx", async () => {
        const client = new HttpClient(mockContext, jsonFetcher(404, { error: "Missing item" }));

        let caught: unknown = null;
        try {
            await client.fetch({
                url: "http://localhost:5000/api/v1/intake/x",
                method: "GET"
            });
        } catch (err) {
            caught = err;
        }

        expect(caught).toBeInstanceOf(HttpClientError);
        expect((caught as HttpClientError).status).toBe(404);
        expect((caught as HttpClientError).message).toContain("Missing item");
    });
});

describe("HttpClientError details and machine errorCode parsing", () => {
    it("extracts details, code, params, and sets cause for structured JSON body", async () => {
        const body = {
            error: "Invalid input provided",
            errorCode: "VALIDATION_FAILED",
            params: { field: "url" }
        };
        const response = new Response(JSON.stringify(body), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });

        const error = await HttpClientError.create(response);
        expect(error).toBeInstanceOf(HttpClientError);
        expect(error!.status).toBe(400);
        expect(error!.code).toBe("VALIDATION_FAILED");
        expect(error!.params).toEqual({ field: "url" });
        expect(error!.details).toEqual(body);
        expect(error!.cause).toEqual(body);
        expect(error!.message).toContain("Invalid input provided");
        expect(error!.name).toBe("HTTP_STATUS_400");
    });

    it("handles non-JSON body as raw text in details with undefined code", async () => {
        const htmlText = "<html><body>500 Internal Server Error</body></html>";
        const response = new Response(htmlText, {
            status: 500,
            headers: { "Content-Type": "text/html" }
        });

        const error = await HttpClientError.create(response);
        expect(error).toBeInstanceOf(HttpClientError);
        expect(error!.status).toBe(500);
        expect(error!.code).toBeUndefined();
        expect(error!.params).toBeUndefined();
        expect(error!.details).toBe(htmlText);
        expect(error!.cause).toBe(htmlText);
        expect(error!.name).toBe("HTTP_STATUS_500");
    });

    it("handles empty body with undefined details and code", async () => {
        const response = new Response("", {
            status: 404,
            headers: { "Content-Type": "text/plain" }
        });

        const error = await HttpClientError.create(response);
        expect(error).toBeInstanceOf(HttpClientError);
        expect(error!.status).toBe(404);
        expect(error!.code).toBeUndefined();
        expect(error!.params).toBeUndefined();
        expect(error!.details).toBeUndefined();
        expect(error!.message).toContain("requested resource could not be found");
        expect(error!.name).toBe("HTTP_STATUS_404");
    });

    it("preserves code, params, and details when thrown through HttpClient.fetch", async () => {
        const mockContext = {
            msgBus: {
                on: () => () => {},
                request: async () => {}
            }
        } as any;

        const body = {
            error: "Not allowed",
            errorCode: "FORBIDDEN_RESOURCE",
            params: { resourceId: "123" }
        };
        const fetcher: IFetcher = {
            fetch: async () =>
                new Response(JSON.stringify(body), {
                    status: 403,
                    headers: { "Content-Type": "application/json" }
                })
        };

        const client = new HttpClient(mockContext, fetcher);
        let caught: unknown = null;
        try {
            await client.fetch({
                url: "http://localhost:5000/api/v1/resource",
                method: "GET"
            });
        } catch (err) {
            caught = err;
        }

        expect(caught).toBeInstanceOf(HttpClientError);
        const apiErr = caught as HttpClientError;
        expect(apiErr.status).toBe(403);
        expect(apiErr.code).toBe("FORBIDDEN_RESOURCE");
        expect(apiErr.params).toEqual({ resourceId: "123" });
        expect(apiErr.details).toEqual(body);
        expect(apiErr.cause).toEqual(body);
        expect(apiErr.message).toContain("Not allowed");
    });

    it("toAppError serializes HttpClientError safely with cause and properties", async () => {
        const body = {
            error: "Validation failed",
            errorCode: "VALIDATION_FAILED",
            params: { field: "email" }
        };
        const response = new Response(JSON.stringify(body), {
            status: 422,
            headers: { "Content-Type": "application/json" }
        });

        const error = await HttpClientError.create(response);
        expect(error).not.toBeNull();

        const appError = toAppError(error);
        expect(appError).toBeDefined();
        expect(appError!.message).toContain("Validation failed");
        expect(appError!.name).toBe("HTTP_STATUS_422");
        expect(appError!.type).toBe("VALIDATION_FAILED");
        expect(appError!.properties).toBeDefined();
        expect(appError!.properties?.status).toBe(422);
        expect(appError!.properties?.code).toBe("VALIDATION_FAILED");
        expect(appError!.properties?.params).toEqual({ field: "email" });

        // Cause is safely recursed and converted
        expect(appError!.cause).toBeDefined();
        expect(appError!.cause?.message).toBe("Validation failed");
        expect(appError!.cause?.type).toBe("VALIDATION_FAILED");
    });

    it("toAppError handles undefined and plain objects safely without throwing", () => {
        expect(toAppError(undefined)).toBeUndefined();
        expect(toAppError(null)).toBeUndefined();

        const plainObj = { errorCode: "UNKNOWN", message: "Something went wrong" };
        const appErr = toAppError(plainObj);
        expect(appErr).toBeDefined();
        expect(appErr!.message).toBe("Something went wrong");
        expect(appErr!.type).toBe("UNKNOWN");
    });
});
