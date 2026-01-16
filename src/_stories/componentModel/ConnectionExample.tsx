import React from 'react';
import { TestEventProducer } from './TestEventProducer';
import { TestEventConsumer } from './TestEventConsumer';

export const ComponentConnectionExample = () => {
    return (
        <>
            <p>
                <TestEventProducer></TestEventProducer>
            </p>
            <p>
                <TestEventConsumer></TestEventConsumer>
            </p>
        </>
    );
};
