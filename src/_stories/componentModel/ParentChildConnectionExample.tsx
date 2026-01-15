import React from 'react';
import { TestContainerFC } from './TestContainer';

export const ParentChildConnectionExample = () => {
    return (
        <>
            <p>
                <TestContainerFC $id="test1"></TestContainerFC>
            </p>
            <p>
                <TestContainerFC $id="test2"></TestContainerFC>
            </p>
        </>
    );
};
