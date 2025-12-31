import React from 'react';
import { TestContainerFC } from './TestContainer';

export const ParentChildConnectionExample = () => {
    return (
        <>
            <p>
                <TestContainerFC></TestContainerFC>
            </p>
            <p>
                <TestContainerFC></TestContainerFC>
            </p>
        </>
    );
};
