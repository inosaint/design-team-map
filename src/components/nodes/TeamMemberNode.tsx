import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { FlowNodeData, PlannedHire } from '../../types';
import { useStore } from '../../store/useStore';
import {
  getLevelColor,
  getLevelName,
  getDesignerTypeAbbreviation,
} from '../../utils/calculations';
import styles from './TeamMemberNode.module.css';

type TeamMemberNodeProps = NodeProps & {
  data: FlowNodeData;
};

function TeamMemberNode({ data, selected }: TeamMemberNodeProps) {
  const { teamNode, reportCount, isOverCapacity, promotionEligible } = data;
  const settings = useStore((state) => state.settings);

  const levelColor = getLevelColor(teamNode.level, settings, teamNode.track);
  const levelName = getLevelName(teamNode.level, settings, teamNode.track);
  const typeAbbr = getDesignerTypeAbbreviation(teamNode.designerType, settings);

  const isPlanned = teamNode.isPlannedHire;
  const isTopLevel = !teamNode.managerId; // No manager means top-level (head of design)

  // Find the highest level number in settings to determine if this is leadership
  const maxLevel = Math.max(...settings.levels.map((l) => l.level));
  const isLeadership = isTopLevel || teamNode.level >= maxLevel;

  return (
    <div
      className={`${styles.node} ${isPlanned ? styles.planned : ''} ${
        selected ? styles.selected : ''
      } ${isOverCapacity ? styles.overCapacity : ''} ${
        promotionEligible && !isPlanned ? styles.promotionEligible : ''
      }`}
      style={{
        borderColor: selected ? 'var(--primary)' : levelColor,
        backgroundColor: isPlanned ? 'transparent' : undefined,
      }}
    >
      {/* Only show target handle if not top-level */}
      {!isTopLevel && (
        <Handle
          type="target"
          position={Position.Top}
          className={styles.handle}
        />
      )}

      <div className={styles.header} style={{ backgroundColor: levelColor }}>
        <span className={styles.level}>{levelName}</span>
        {/* Hide designer type for leadership/top-level roles */}
        {!isLeadership && <span className={styles.type}>{typeAbbr}</span>}
      </div>

      <div className={styles.content}>
        <div className={styles.name}>{teamNode.name}</div>
        {isPlanned && (teamNode as PlannedHire).tentativeDate && (
          <div className={styles.meta}>
            <span className={styles.tentative}>{(teamNode as PlannedHire).tentativeDate}</span>
          </div>
        )}
      </div>

      {reportCount > 0 && (
        <div
          className={`${styles.reportBadge} ${
            isOverCapacity ? styles.danger : ''
          }`}
        >
          {reportCount} report{reportCount !== 1 ? 's' : ''}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
      />
    </div>
  );
}

export default memo(TeamMemberNode);
