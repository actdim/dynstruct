import React from 'react';
import { TestContainer } from './TestContainer';

export const ParentChildConnectionExample = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TestContainer $id="test1" />
            <TestContainer $id="test2" />
        </div>
    );
};
