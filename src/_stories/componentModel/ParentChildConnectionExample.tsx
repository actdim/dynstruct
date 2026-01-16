import React from 'react';
import { TestContainer } from './TestContainer';

export const ParentChildConnectionExample = () => {
    return (
        <>
            <p>
                <TestContainer $id="test1"></TestContainer>
            </p>
            <p>
                <TestContainer $id="test2"></TestContainer>
            </p>
        </>
    );
};
