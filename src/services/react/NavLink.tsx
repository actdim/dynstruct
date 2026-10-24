import React from 'react';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import { prop } from '@/componentModel/core';
import { BaseAppMsgChannels, BaseAppMsgStruct } from '@/appDomain/appContracts';
import { isAppHref, isPlainLeftClick, type LinkClickEvent } from '@/appDomain/navigation';

export type NavLinkClickOptions = {
    replace?: boolean;
    /** History state of the new entry (`location.state`) */
    state?: unknown;
    target?: string;
    /** Called before an in-place navigation (plain click only), e.g. to close a menu or drawer */
    onNavigate?: () => void;
};

/** The one bus call a link makes; any component bus that provides `APP.NAV.GOTO` fits (method syntax: bivariant). */
export type NavGotoBus = {
    send(msg: {
        channel: 'APP.NAV.GOTO';
        group: 'in';
        payload: { url: string; replace?: boolean; state?: unknown };
    }): unknown;
};
type GotoBus = NavGotoBus;

/**
 * Click handler for a route link (`<a href>`): a plain left click on an app href navigates in place through
 * `APP.NAV.GOTO` (no reload); modified, middle and new-tab clicks, `target` other than `_self` and external hrefs
 * fall through to the browser.
 */
export function handleNavLinkClick(
    e: LinkClickEvent & { preventDefault(): void },
    msgBus: GotoBus,
    href: string | undefined,
    options: NavLinkClickOptions = {}
): boolean {
    if (!isAppHref(href) || !isPlainLeftClick(e, options.target)) {
        return false;
    }
    e.preventDefault();
    options.onNavigate?.();
    void msgBus.send({
        channel: 'APP.NAV.GOTO',
        group: 'in',
        payload: { url: href, replace: options.replace, state: options.state },
    });

    return true;
}

/** `handleNavLinkClick` bound to a link, for `onClick` of a plain `<a href>`. */
export function createNavLinkClick(msgBus: GotoBus, href: string, options: NavLinkClickOptions = {}) {
    return (e: React.MouseEvent<HTMLElement>) => {
        handleNavLinkClick(e, msgBus, href, options);
    };
}

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        props: {
            href: string;
            content: React.ReactNode;
            replace?: boolean;
            state?: unknown;
            target?: string;
            className?: string;
            title?: string;
            'aria-label'?: string;
        };
        msgScope: {
            publish: BaseAppMsgChannels<'APP.NAV.GOTO'>;
        };
    }
>;

/** A route link: `<a href>` that navigates in place on a plain click and opens natively otherwise. */
export const useNavLink = (params: ComponentParams<Struct>): Component<Struct> => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        regType: 'NavLink',
        props: {
            href: '/',
            content: prop({ initialValue: null, reactive: 'ref' }),
            replace: false,
            state: prop({ initialValue: undefined, reactive: 'ref' }),
            target: undefined,
            className: undefined,
            title: undefined,
            'aria-label': undefined,
        },
        view: () => (
            <a
                id={c.id}
                href={m.href}
                target={m.target}
                rel={m.target === '_blank' ? 'noopener noreferrer' : undefined}
                className={m.className}
                title={m.title}
                aria-label={m['aria-label']}
                onClick={(e) => {
                    handleNavLinkClick(e, c.msgBus, m.href, { replace: m.replace, state: m.state, target: m.target });
                }}
            >
                {m.content}
            </a>
        ),
    };

    c = useComponent(def, params);
    m = c.model;

    return c;
};

export type NavLinkStruct = Struct;
export const NavLink = toReact(useNavLink);
