import type {
    Component,
    ComponentDef,
    ComponentParams,
    ComponentStruct,
} from '@/componentModel/contracts';
import { toReact, useComponent } from '@/componentModel/react';
import React from 'react';
import { AppMsgStruct } from '../bootstrap';
import { TestEventConsumerStruct, useTestEventConsumer } from './TestEventConsumer';
import { TestEventProducerStruct, useTestEventProducer } from './TestEventProducer';

type Struct = ComponentStruct<
    AppMsgStruct,
    {
        children: {
            producer: TestEventProducerStruct;
            consumer: TestEventConsumerStruct;
        };
    }
>;

export const useBasicCommunicationExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    const def: ComponentDef<Struct> = {
        children: {
            producer: useTestEventProducer(),
            consumer: useTestEventConsumer(),
        },
        view: () => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <c.children.producer.View />
                <c.children.consumer.View />
            </div>
        ),
    };
    c = useComponent(def, params);
    return c;
};

export type BasicCommunicationExampleStruct = Struct;
export const BasicCommunicationExample = toReact(useBasicCommunicationExample);
