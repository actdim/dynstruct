import type {
    Component,
    ComponentDef,
    ComponentModel,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react/hooks';
import React from 'react';
import { detailsStyle, labelStyle, row } from '../styles';
import { TestMsgStruct } from './msgStruct';

type Struct = ComponentStruct<
    TestMsgStruct,
    {
        props: {
            avatar: {
                imageUrl: string;
            };
        };
    }
>;

export const useAvatarView = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;
    const def: ComponentDef<Struct> = {
        props: {
            avatar: {
                imageUrl: '',
            },
        },

        view: () => {
            return (
                <div>
                    <img style={{ maxWidth: '320px' }} src={m.avatar.imageUrl} />
                </div>
            );
        },
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type AvatarViewStruct = Struct;
export const AvatarView = toReact(useAvatarView);
