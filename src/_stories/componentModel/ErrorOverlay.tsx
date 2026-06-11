import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { useComponent } from '@/componentModel/react/hooks';
import React from 'react';
import { ErrorPayload } from '@actdim/msgmesh/contracts';
import { $ERROR } from '@/appDomain/commonContracts';
import { AppMsgChannels, AppMsgStruct } from './bootstrap';
import { detailsStyle } from './styles';

let overlay: HTMLElement | null = null;

function highlight(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;background:rgba(0,123,255,0.15);border:2px solid #007bff;z-index:999999;pointer-events:none';
        document.body.appendChild(overlay);
    }
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    setTimeout(() => {
        overlay?.remove();
        overlay = null;
    }, 3000);
}

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            errors: ErrorPayload[];
        };
        actions: {
            clear: () => void;
        };
        msgScope: {
            subscribe: AppMsgChannels<'APP.ERROR'>;
        };
    }
>;


export const useErrorOverlay = (params: ComponentParams<Struct>): Component<Struct> => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            errors: [],
        },
        actions: {
            clear: () => {
                m.errors = [];
            },
        },
        msgBroker: {
            subscribe: {
                ['APP.ERROR']: {
                    in: {
                        callback: (msg) => {
                            m.errors = [...m.errors, msg.payload];
                        },
                        topic: '/.*/',
                    },
                },
            },
        },
        view: () => (
            <>
                {!!m.errors.length && (
                    <details style={detailsStyle} open>
                        <summary
                            style={{ color: '#c00', cursor: 'pointer', display: 'flex', gap: 8 }}
                        >
                            <span>
                                {m.errors.length} error{m.errors.length > 1 ? 's' : ''}
                            </span>
                            <a
                                style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}
                                onClick={() => {
                                    m.errors = [];
                                }}
                            >
                                clear
                            </a>
                        </summary>
                        {m.errors.map((errInfo, i) => (
                            <pre
                                key={i}
                                style={{ margin: '6px 0', fontSize: 12, whiteSpace: 'pre-wrap' }}
                            >
                                {errInfo.error instanceof Error
                                    ? errInfo.error.message
                                    : JSON.stringify(errInfo.error, null, 2)}
                                {errInfo.source?.id && (
                                    <> from <a
                                        style={{ cursor: 'pointer', color: '#007bff' }}
                                        onClick={() => highlight(errInfo.source.id)}
                                    >{errInfo.source.id}</a></>
                                )}
                            </pre>
                        ))}
                    </details>
                )}
            </>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
