import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/react';
import React from 'react';
import { AppMsgStruct } from './bootstrap';
import { SimpleEditStruct, useSimpleEdit } from './SimpleEdit';
import { bind, bindProp } from '@/componentModel/core';
import { detailsStyle, labelStyle, row } from './styles';
import { ContactEditStruct, useContactEdit } from './ContactEdit';
import { v4 as uuid } from 'uuid';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            firstName: string;
            lastName: string;
            email: string;
            userId: string;
            fullName: string;
            trackingEnabled: boolean;
        };
        actions: {
            reset: () => void;
        };
        children: {
            firstNameEdit: SimpleEditStruct;
            lastNameEdit: SimpleEditStruct;
            emailEdit: (props: { value?: string }) => SimpleEditStruct;
            userProfileLink: React.FC;
            fullName: SimpleEditStruct;
            buttons: React.FC; // () => React.ReactNode
            contactEdit: ContactEditStruct;
        };
        effects: 'trackNameChanges';
    }
>;

export const useEffectDemo = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const reset = () => {
        m.firstName = '';
        m.lastName = '';
        m.email = '';
        m.userId = '';
    };

    const def: ComponentDef<Struct> = {
        props: {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@mail.com',
            userId: '',
            fullName: '',
            trackingEnabled: true,
        },
        actions: {
            reset,
        },
        events: {
            onChangeTrackingEnabled: (v) => {
                if (v) {
                    c.effects.trackNameChanges.resume();
                } else {
                    c.effects.trackNameChanges.pause();
                }
            },
            onChangeEmail: (v) => {
                // c.children.model.isValid = !!v;
                if (v) {
                    const userId = uuid();
                    m.userId = userId;
                } else {
                    m.userId = null;
                }
            },
            onReady: () => {
                m.userId = uuid();
            },
        },
        effects: {
            trackNameChanges: (c) => {
                m.fullName = `${m.firstName || ''} ${m.lastName || ''}`;
            },
        },
        children: {
            firstNameEdit: useSimpleEdit({
                value: bindProp(() => m, 'firstName'),
            }),
            lastNameEdit: useSimpleEdit({
                // value: bindProp(() => m, 'lastName'),
                value: bind(
                    () => m.lastName,
                    (v) => {
                        m.lastName = v;
                    },
                ),
            }),
            emailEdit: (params) => {
                let dynComponent = useSimpleEdit({
                    value: bindProp(() => m, 'email'),
                    isValid: bind(() => !!m.email),
                });
                return dynComponent;
            },
            userProfileLink: () => {
                return m.userId ? <a href={`/user/${m.userId}`}>Profile</a> : <>?</>;
            },
            fullName: useSimpleEdit({
                value: bindProp(() => m, 'fullName'),
                isReadOnly: true,
            }),
            buttons: () => {
                return (
                    <div style={{ ...row, marginTop: 10 }}>
                        <button onClick={() => (m.trackingEnabled = !m.trackingEnabled)}>
                            {m.trackingEnabled ? 'Pause' : 'Resume'}
                        </button>
                        <button onClick={m.reset}>Reset</button>
                    </div>
                );
            },
            contactEdit: useContactEdit({
                contact: bind(() => m),
                isReadOnly: true,
            }),
        },
        view: () => (
            <details open style={detailsStyle}>
                <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Effects</summary>
                <c.children.Buttons />
                <div style={row}>
                    <span style={labelStyle}>First</span>
                    <c.children.firstNameEdit.View />
                </div>
                <div style={row}>
                    <span style={labelStyle}>Last</span>
                    <c.children.lastNameEdit.View />
                </div>
                <div style={row}>
                    <span style={labelStyle}>Email</span>
                    <c.children.EmailEdit />
                    <c.children.UserProfileLink />
                </div>
                <div style={row}>
                    <span style={labelStyle}>Full name</span>
                    <c.children.fullName.View />
                </div>
                <div>
                    <c.children.contactEdit.View />
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
