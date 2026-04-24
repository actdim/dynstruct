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
import { detailsStyle, labelStyle, row } from './styles';

export type IContact = {
    firstName: string;
    lastName: string;
    email?: string;
};

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            contact: IContact;
            isReadOnly: boolean;
        };
        children: {};
    }
>;

const readOnlyStyle: React.CSSProperties = {
    background: '#f5f5f5',
    color: '#888',
    cursor: 'default',
};

export const useContactEdit = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {        
        props: {
            contact: {
                firstName: '',
                lastName: '',
                email: '',
            },
            isReadOnly: false,
        },
        view: () => {
            const inputStyle = m.isReadOnly ? readOnlyStyle : undefined;
            return (
                <details open style={detailsStyle}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Contact</summary>
                    <div style={row}>
                        <span style={labelStyle}>First</span>
                        <input
                            type="text"
                            readOnly={m.isReadOnly}
                            style={inputStyle}
                            onChange={(e) => (m.contact.firstName = e.target.value)}
                            value={m.contact?.firstName ?? ''}
                        />
                    </div>
                    <div style={row}>
                        <span style={labelStyle}>Last</span>
                        <input
                            type="text"
                            readOnly={m.isReadOnly}
                            style={inputStyle}
                            onChange={(e) => (m.contact.lastName = e.target.value)}
                            value={m.contact?.lastName ?? ''}
                        />
                    </div>
                    <div style={row}>
                        <span style={labelStyle}>Email</span>
                        <input
                            type="email"
                            readOnly={m.isReadOnly}
                            style={inputStyle}
                            onChange={(e) => (m.contact.email = e.target.value)}
                            value={m.contact?.email ?? ''}
                        />
                    </div>
                </details>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type ContactEditStruct = Struct;
export const ContactEdit = toReact(useContactEdit);
