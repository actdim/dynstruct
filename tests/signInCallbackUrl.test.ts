import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { isSignInLocation, resolveSignInCallbackUrl } from "@/appDomain/navigation";

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

describe("isSignInLocation", () => {
    it("is true on the sign-in page with any query (devLogin=1 kept by skipping the redirect)", () => {
        expect(isSignInLocation("auth/sign-in", loc("/auth/sign-in?devLogin=1"))).toBe(true);
        expect(isSignInLocation("/auth/sign-in", loc("/auth/sign-in/?devLogin=1&callbackUrl=%2Fexplorer"))).toBe(true);
    });

    it("is false on other pages, including ones that only start with the sign-in path", () => {
        expect(isSignInLocation("auth/sign-in", loc("/explorer?devLogin=1"))).toBe(false);
        expect(isSignInLocation("auth/sign-in", loc("/auth/sign-in-help"))).toBe(false);
    });
});

describe("SecurityService ensureAuth on the sign-in page", () => {
    it("does not navigate again when already on the sign-in page", () => {
        const source = fs.readFileSync(path.resolve(process.cwd(), "src/services/react/SecurityService.tsx"), "utf-8");
        expect(source).toMatch(/if \(!isSignInLocation\(m\.domainConfig\.routes\.authSignInPage, location\)\) \{\s*c\.msgBus\.send\(\{\s*channel: \$NAV_GOTO,/);
    });
});
