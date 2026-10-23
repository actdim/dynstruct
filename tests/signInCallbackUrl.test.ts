import { describe, it, expect } from "vitest";
import { resolveSignInCallbackUrl } from "@/appDomain/navigation";

const loc = (url: string) => {
    const u = new URL(url, "http://app.local");
    return { pathname: u.pathname, search: u.search, hash: u.hash };
};

describe("resolveSignInCallbackUrl", () => {
    it("uses the current location outside the sign-in page", () => {
        expect(resolveSignInCallbackUrl("auth/sign-in", loc("/explorer?driveId=1#top"))).toBe("/explorer?driveId=1#top");
    });

    it("keeps the existing callbackUrl when already on the sign-in page", () => {
        expect(resolveSignInCallbackUrl("auth/sign-in", loc("/auth/sign-in?callbackUrl=%2Fexplorer"))).toBe("/explorer");
    });

    it("falls back to the root when the sign-in page has no callbackUrl", () => {
        expect(resolveSignInCallbackUrl("auth/sign-in", loc("/auth/sign-in"))).toBe("/");
    });

    it("normalizes leading and trailing slashes of the sign-in path", () => {
        expect(resolveSignInCallbackUrl("/login", loc("/login/?callbackUrl=%2Fhome"))).toBe("/home");
        expect(resolveSignInCallbackUrl("login/", loc("/login?callbackUrl=%2Fhome"))).toBe("/home");
    });

    it("unwraps sign-in callbacks that were already nested", () => {
        const nested = "/auth/sign-in?callbackUrl=" + encodeURIComponent(
            "/auth/sign-in?callbackUrl=" + encodeURIComponent("/auth/sign-in?callbackUrl=" + encodeURIComponent("/explorer"))
        );
        expect(resolveSignInCallbackUrl("auth/sign-in", loc(nested))).toBe("/explorer");
    });

    it("does not treat a page whose path only starts with the sign-in path as sign-in", () => {
        expect(resolveSignInCallbackUrl("auth/sign-in", loc("/auth/sign-in-help"))).toBe("/auth/sign-in-help");
    });
});
