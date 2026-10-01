import { describe, it, expect } from "vitest";
import {
    HttpClientError,
    HttpNetworkError,
    isNetworkFailure
} from "@/net/httpClientError";
import { HttpClient } from "@/net/httpClient";
import { IFetcher } from "@/net/request";

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
