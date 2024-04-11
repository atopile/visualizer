import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from '@reactflow/core/dist/esm/types';

export const CustomNodeBlock = ({ data }) => {
    return (
        <>
          <Handle
            type="target"
            position={Position.Top}
            style={{ bottom: 10, background: '#555' }}
            onConnect={(params) => console.log('handle onConnect', params)}
          />
          <div style={{ textAlign: 'center', padding: '10px', borderRadius: '10px', backgroundColor: data.color }}>
            <div>{data.instance_of}</div>
            <div style={{fontWeight: 'bold'}}>{data.title}</div>
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            style={{ top: 10, background: '#555' }}
          />
        </>
    )
};

export const CircularNodeComponent = ({ data }) => {
    return (
        <>
        <Handle
            type="target"
            position={Position.Top}
            style={{ background: '#555' }}
            onConnect={(params) => console.log('handle onConnect', params)}
          />
      <div style={{ textAlign: 'center', padding: '10px', borderRadius: '50%', backgroundColor: data.color }}>
            <div>{data.instance_of}</div>
            <div style={{fontWeight: 'bold'}}>{data.title}</div>
      </div>

      <Handle
      type="source"
      position={Position.Bottom}
      style={{ top: 10, background: '#555' }}
    />
    </>
    )
  };