import { memo, useState } from 'react';
import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { FlowEdgeData } from '../../types';
import styles from './ReportingEdge.module.css';

type ReportingEdgeProps = EdgeProps & {
  data?: FlowEdgeData;
};

function ReportingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: ReportingEdgeProps) {
  const isOverCapacity = data?.isOverCapacity || false;
  const [showTooltip, setShowTooltip] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  const strokeColor = isOverCapacity ? 'var(--danger)' : 'var(--gray-300)';
  const strokeWidth = isOverCapacity ? 2.5 : 1.5;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDasharray: isOverCapacity ? '5,5' : 'none',
        }}
        className={`${styles.edge} ${isOverCapacity ? styles.danger : ''} ${
          selected ? styles.selected : ''
        }`}
      />
      {isOverCapacity && (
        <EdgeLabelRenderer>
          <div
            className={styles.warningWrapper}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className={styles.warningLabel}>!</div>
            {showTooltip && (
              <div className={styles.tooltip}>
                Span of control exceeded
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ReportingEdge);
