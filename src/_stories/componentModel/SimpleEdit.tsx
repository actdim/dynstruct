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

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            value: string;
            isDisabled: boolean;
            isReadOnly: boolean;
            isValid: boolean;
        };
    }
>;

export const useSimpleEdit = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            value: '',
            isDisabled: false,
            isReadOnly: false,
            isValid: true,
        },
        view: () => {
            const style: React.CSSProperties = {
                ...(m.isDisabled || m.isReadOnly
                    ? { background: '#f5f5f5', color: '#888', cursor: m.isDisabled ? 'not-allowed' : 'default' }
                    : {}),
                ...(!m.isValid
                    ? { borderColor: '#dc3545', outline: 'none', boxShadow: '0 0 0 2px rgba(220,53,69,.2)' }
                    : {}),
            };
            return (
                <input
                    type="text"
                    disabled={m.isDisabled}
                    readOnly={m.isReadOnly}
                    style={style}
                    onChange={(e) => (m.value = e.target.value)}
                    value={m.value ?? ''}
                />
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type SimpleEditStruct = Struct;
export const SimpleEdit = toReact(useSimpleEdit);
