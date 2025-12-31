import React from 'react';
import { TestEventProducerFC } from './TestEventProducer';
import { TestEventConsumerFC } from './TestEventConsumer';

export const ComponentConnectionExample = () => {
    return (
        <>
            <p>
                <TestEventProducerFC></TestEventProducerFC>
            </p>
            <p>
                <TestEventConsumerFC></TestEventConsumerFC>
            </p>
        </>
    );
};
