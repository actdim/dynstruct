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

// import './simpleComponent.css';

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
        view: (_, c) => {
            return (
                <div id={c.id}>
                    <div>
                        First Name: <c.children.firstNameEdit.View></c.children.firstNameEdit.View>
                    </div>
                    <div>
                        Last Name: <c.children.lastNameEdit.View></c.children.lastNameEdit.View>
                    </div>
                    <div>Full Name: {m.fullName}</div>
                    {m.trackingEnabled ? (
                        <button
                            onClick={() => {
                                m.trackingEnabled = false;
                            }}
                        >
                            Pause
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                m.trackingEnabled = true;
                            }}
                        >
                            Resume
                        </button>
                    )}
                </div>
            );
        },
    };

    c = useComponent(def, params);

    m = c.model;

    return c;
};

export type EffectDemoStruct = Struct;
export const EffectDemo = toReact(useEffectDemo);
