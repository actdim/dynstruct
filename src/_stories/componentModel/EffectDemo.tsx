import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react';
import React from 'react';
import { AppMsgStruct } from './bootstrap';
import { SimpleEditStruct, useSimpleEdit } from './SimpleEdit';
import { bind, bindProp } from '@/componentModel/core';
import { detailsStyle, labelStyle, row } from './styles';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            fullName: string;
            firstName: string;
            lastName: string;
            trackingEnabled: boolean;
        };
        children: {
            firstNameEdit: SimpleEditStruct;
            lastNameEdit: SimpleEditStruct;
        };
        effects: 'trackNameChanges';
    }
>;

export const useEffectDemo = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            fullName: undefined,
            firstName: 'John',
            lastName: 'Smith',
            trackingEnabled: true,
        },
        events: {
            onChangeTrackingEnabled: (v) => {
                if (v) {
                    c.effects.trackNameChanges.resume();
                } else {
                    c.effects.trackNameChanges.pause();
                }
            },
            // onError: (err) => {
            //     return <>Houston, we have a problem</>;
            // },
        },
        effects: {
            trackNameChanges: (c) => {
                m.fullName = `${m.firstName} ${m.lastName}`;
            },
        },
        children: {
            firstNameEdit: useSimpleEdit({
                value: bindProp(() => m, 'firstName'),
            }),
            lastNameEdit: useSimpleEdit({
                value: bindProp(() => m, 'lastName'),
            }),
        },
        view: () => (
            <details open style={detailsStyle}>
                <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Effects</summary>
                <div style={row}>
                    <span style={labelStyle}>First</span>
                    <c.children.firstNameEdit.View />
                </div>
                <div style={row}>
                    <span style={labelStyle}>Last</span>
                    <c.children.lastNameEdit.View />
                </div>
                <div style={row}>
                    <span style={labelStyle}>Full name</span>
                    <input type="text" value={m.fullName ?? ''} readOnly />
                </div>
                <div style={{ ...row, marginTop: 10 }}>
                    <button onClick={() => (m.trackingEnabled = !m.trackingEnabled)}>
                        {m.trackingEnabled ? 'Pause' : 'Resume'}
                    </button>
                </div>
            </details>
        ),
    };

    c = useComponent(def, params);

    m = c.model;

    return c;
};

export type EffectDemoStruct = Struct;
export const EffectDemo = toReact(useEffectDemo);
