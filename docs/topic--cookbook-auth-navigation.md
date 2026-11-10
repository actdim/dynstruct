---
protocol: along
slug: cookbook-auth-navigation
title: "Cookbook: Navigation & Auth"
type: topic
created: 2026-11-10
updated: 2026-11-10
tags: [cookbook, navigation, auth, security]
---

# Cookbook: Navigation & Auth

Typed routes, navigation over the bus, links, sign-in/out and protected pages.
Part of the [Cookbook](topic--cookbook.md).

Components never call the router or the auth backend directly: they send `APP.NAV.*` and
`APP.SECURITY.*` messages, and `NavService` / `SecurityService` (mounted once near the root)
handle them.

---

## 7.1 Declare typed routes

**Task.** I want route names with typed params that the bus understands.

```ts
import { createNavigationRoute } from '@actdim/dynstruct/appDomain/navigation';
import type { NavRoutes } from '@actdim/dynstruct/appDomain/commonContracts';

export const appRoutes = {
    home: createNavigationRoute({ pattern: '/', element: undefined }),
    user: createNavigationRoute<{ id: string; tab?: string }>({ pattern: '/users/:id', element: undefined }),
} satisfies NavRoutes;

export type AppRoutes = typeof appRoutes;
export type AppMsgStruct = BaseAppMsgStruct<AppRoutes> & MsgStruct<{ /* app channels */ }>;
```

Mount the service inside the router: `<NavService routes={appRoutes} />`.

**How it works.** Each route gets `url(params)` and `match(url)`. Passing `AppRoutes` to
`BaseAppMsgStruct` types the route-based form of `APP.NAV.GOTO` (recipe 7.2). Query params can be
declared in the pattern: `'/users/:id/profile?tab'`.

**See also.** story [`bootstrap.ts`](../src/_stories/componentModel/bootstrap.ts);
`getUrlBuilder` tests in `tests/react/services.test.tsx`.

---

## 7.2 Navigate from a component

**Task.** Go to another page, back, or replace the current entry.

```ts
// msgScope: { publish: AppMsgChannels<'APP.NAV.GOTO'> }

// by route name (typed params): group 'ex'
c.msgBus.send({ channel: 'APP.NAV.GOTO', group: 'ex', payload: { route: 'user', params: { id: '42' } } });

// by path or url: group 'in' (default)
c.msgBus.send({ channel: 'APP.NAV.GOTO', payload: { path: '/settings', replace: true } });
c.msgBus.send({ channel: 'APP.NAV.GOTO', payload: { url: '/users/42?tab=files' } });

// back
c.msgBus.send({ channel: 'APP.NAV.GOTO', payload: { path: -1 } });
```

**How it works.** `NavService` provides both input groups: `in` takes a path / url / history delta,
`ex` takes a route name plus typed params and builds the href. `state` sets `location.state` of the
new entry.

**Gotchas.**
- `group: 'ex'` is typed from the routes you passed to `BaseAppMsgStruct<AppRoutes>`; a wrong
  route name or param is a compile error.

**See also.** webapp `components/layout/MainLayout.tsx` (back handler with a fallback route).

---

## 7.3 Render a link

**Task.** A real `<a href>` (middle click opens a new tab) that navigates in place on a plain click.

```tsx
import { useNavLink, type NavLinkStruct } from '@actdim/dynstruct/services/react/NavLink';

children: {
    profileLink: useNavLink({ href: bind(() => `/users/${m.userId}`), content: 'Profile' }),
},
view: () => <c.children.ProfileLink />,
```

**How it works.** A plain left click on an app href sends `APP.NAV.GOTO`; modified, middle or
`target="_blank"` clicks are left to the browser. `@actdim/dynstruct-mui` `useButton({ href })`
behaves the same way.

**Gotchas.**
- `content` is a React value: it is declared `reactive: 'ref'` inside `NavLink`, so elements are
  fine.
- For a plain React link use `createNavLinkClick(msgBus, href)` as the `onClick` handler.

---

## 7.4 Read the current location and react to changes

**Task.** Highlight the active menu item, read query params.

```ts
// once
const msg = await c.msgBus.request({ channel: 'APP.NAV.CONTEXT.GET' });
m.path = msg.payload.location?.pathname ?? '/';

// on every change
msgBroker: {
    subscribe: {
        'APP.NAV.CONTEXT.CHANGED': {
            in: { callback: (msg) => { m.path = msg.payload.location?.pathname ?? '/'; m.tab = msg.payload.searchParams?.get('tab'); } },
        },
    },
},
```

**How it works.** `NavContext` carries `location`, `searchParams`, matched `params` and
`navType`. `APP.NAV.HISTORY.READ` reads an older history entry.

---

## 7.5 Sign in and sign out

**Task.** A login form signs the user in; a menu item signs out.

```ts
actions: {
    signIn: async () => {
        if (!(await c.validate())) { return; }
        await c.msgBus.request({
            channel: 'APP.SECURITY.AUTH.SIGNIN',
            payload: { credentials: { scheme: 'Bearer', userName: m.email, password: m.password } },
        });
    },
    signOut: async () => {
        await c.msgBus.request({ channel: 'APP.SECURITY.AUTH.SIGNOUT' });
    },
},
```

Anyone interested in the result subscribes to the `out` group:

```ts
msgBroker: {
    subscribe: {
        'APP.SECURITY.AUTH.SIGNIN': { out: { callback: async () => { await m.refreshUser(); } } },
        'APP.SECURITY.AUTH.SIGNOUT': { out: { callback: async () => { await m.refreshUser(); } } },
    },
},
```

**How it works.** `SecurityService` keeps `AuthInfo`, persists it through the `APP.STORE.*`
channels (mount `StorageService`), and publishes the outcome on `out`. `APP.SECURITY.AUTH.INFO.GET` returns the current `AuthInfo`.

**Gotchas.**
- `credentials` is a discriminated union by `scheme` (`Basic`, `Bearer`, `ApiKey`, ...).
- A failed sign-in rejects the request; show the message from the error `code`.

**See also.** story [`SecurityServiceExample.tsx`](../src/_stories/componentModel/securityService/SecurityServiceExample.tsx).

---

## 7.6 Protect a page

**Task.** A page needs a signed-in user; otherwise go to the sign-in page and come back.

```ts
events: {
    onReady: async () => {
        const msg = await c.msgBus.request({ channel: 'APP.SECURITY.AUTH.ENSURE' });
        m.user = msg.payload.properties?.user;
        await m.load();
    },
},
```

**How it works.** `ENSURE` returns `AuthInfo` when authenticated; otherwise it sends
`APP.NAV.GOTO` to `routes.authSignInPage` with a `callbackUrl` of the current location.

**Gotchas.**
- `SecurityService` needs a security config: pass `domainConfig` or provide
  `APP.SECURITY.CONFIG.GET`. It holds `id`, `routes.authSignInPage` / `authSignOutPage` and, in
  conventions mode, `endpoints.authSignIn`.

---

## 7.7 Configure the built-in Bearer flow (`useConventions`)

**Task.** My backend has sign-in / refresh / sign-out endpoints returning tokens.

```tsx
const securityConfig: BaseSecurityDomainConfig = {
    id: 'my-app',
    endpoints: { authSignIn: '/api/auth/sign-in', authRefresh: '/api/auth/refresh', authSignOut: '/api/auth/sign-out' },
    routes: { authSignInPage: '/sign-in', authSignOutPage: '/signed-out' },
};

<SecurityService useConventions domainConfig={securityConfig} />
```

**How it works.** With `useConventions: true` (default) the service performs the HTTP sign-in,
stores and refreshes tokens, and provides `APP.SECURITY.AUTH.APPLY`, which `HttpClient` uses for
`useAuth: true` requests (`Bearer` and `Basic`).

**Gotchas.**
- `endpoints.authSignIn` is required in this mode and is checked when the service initializes.

---

## 7.8 Custom auth (mock, OIDC, your own backend)

**Task.** Sign-in is handled by my own code (a mock, an OIDC library, a cookie session).

```tsx
<SecurityService useConventions={false} />

// in a provider component
msgBroker: {
    provide: {
        'APP.SECURITY.AUTH.SIGNIN.REQUEST': {
            in: {
                callback: async (msg) => {
                    const user = await myAuth.login(msg.payload.credentials);
                    return { scheme: 'Session', isAuthenticated: true, properties: { user } } as AuthInfo;
                },
            },
        },
        'APP.SECURITY.AUTH.SIGNOUT.REQUEST': { in: { callback: async () => { await myAuth.logout(); } } },
        'APP.SECURITY.AUTH.APPLY': {
            in: { callback: async () => ({ credentials: 'include' }) }, // e.g. cookie session
        },
    },
},
```

**How it works.** Components still call `SIGNIN` / `SIGNOUT` / `ENSURE`; the service delegates the
work to the `*.REQUEST` providers. `APP.SECURITY.AUTH.APPLY` is yours to provide in this mode if
API clients use `useAuth: true`.

**See also.** story [`SecurityServiceExample.tsx`](../src/_stories/componentModel/securityService/SecurityServiceExample.tsx)
(Basic auth over custom handlers); webapp `components/layout/MainLayout.tsx` (`useConventions={false}`).

---

## 7.9 Authorize API calls (`useAuth`)

**Task.** An API method must send the current token.

```ts
getProfile(): Promise<Profile> {
    return this.fetch({ url: '/api/me', method: 'GET', useAuth: true });
}
```

**How it works.** `HttpClient` requests `APP.SECURITY.AUTH.APPLY` and merges the returned headers,
query and `credentials` into the request.

**See also.** [Services](topic--cookbook-services.md), recipe 6.3.
