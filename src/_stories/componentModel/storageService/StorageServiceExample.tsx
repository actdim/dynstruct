import { BaseAppMsgChannels, BaseAppMsgStruct } from '@/appDomain/appContracts';
import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { getFC, useComponent } from '@/componentModel/react';
import React from 'react';

type Struct = ComponentStruct<
    BaseAppMsgStruct,
    {
        msgScope: {
            provide: BaseAppMsgChannels<'APP-KV-STORE-SET'>;
        };
    }
>;

export const useStorageServiceExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;
    const def: ComponentDef<Struct> = {
        view: (_, c) => {
            return (
                <>
                    <button
                        onClick={() => {
                            c.msgBus.send({
                                channel: 'APP-KV-STORE-SET',
                                payload: {
                                    key: 'test',
                                    value: 'foo',
                                },
                            });
                        }}
                    >
                        Send
                    </button>
                </>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type StorageServiceExampleStruct = Struct;
export const StorageServiceExample = getFC(useStorageServiceExample);
