import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import type { Node, Connection, NodeTypes, EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../store/useStore';
import type { FlowNodeData, FlowEdgeData } from '../types';
import {
  calculateReportCounts,
  isOverCapacity,
  calculatePromotionEligibility,
} from '../utils/calculations';
import TeamMemberNode from './nodes/TeamMemberNode';
import ReportingEdge from './edges/ReportingEdge';
import styles from './FlowChart.module.css';

const nodeTypes: NodeTypes = {
  teamMember: TeamMemberNode,
};

const edgeTypes: EdgeTypes = {
  reporting: ReportingEdge,
};

const defaultViewport = { x: 100, y: 100, zoom: 1 };

export default function FlowChart() {
  const {
    nodes: teamNodes,
    nodePositions,
    settings,
    selectNode,
    updateNodePosition,
    setNodeManager,
  } = useStore();

  const reportCounts = useMemo(
    () => calculateReportCounts(teamNodes),
    [teamNodes]
  );

  // Convert team nodes to React Flow nodes
  const initialNodes = useMemo(() => {
    return teamNodes.map((teamNode) => {
      const position = nodePositions.get(teamNode.id) || {
        x: Math.random() * 500 + 100,
        y: Math.random() * 400 + 100,
      };

      const reportCount = reportCounts.get(teamNode.id) || 0;
      const overCapacity = isOverCapacity(
        teamNode.id,
        reportCounts,
        settings.spanOfControlThreshold
      );
      const promotionInfo = calculatePromotionEligibility(teamNode, settings);

      return {
        id: teamNode.id,
        type: 'teamMember',
        position,
        data: {
          teamNode,
          reportCount,
          isOverCapacity: overCapacity,
          promotionEligible: promotionInfo.eligible,
          yearsUntilEligible: promotionInfo.yearsUntilEligible,
        } as FlowNodeData,
      };
    });
  }, [teamNodes, nodePositions, reportCounts, settings]);

  // Convert manager relationships to edges
  const initialEdges = useMemo(() => {
    return teamNodes
      .filter((node) => node.managerId)
      .map((node) => {
        const managerOverCapacity = isOverCapacity(
          node.managerId!,
          reportCounts,
          settings.spanOfControlThreshold
        );

        return {
          id: `${node.managerId}-${node.id}`,
          source: node.managerId!,
          target: node.id,
          type: 'reporting',
          data: {
            isOverCapacity: managerOverCapacity,
          } as FlowEdgeData,
        };
      });
  }, [teamNodes, reportCounts, settings.spanOfControlThreshold]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when team data changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Sync edges when relationships change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleNodesChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: any[]) => {
      onNodesChange(changes);

      // Update positions in store for position changes
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updateNodePosition(change.id, change.position);
        }
      });
    },
    [onNodesChange, updateNodePosition]
  );

  const handleEdgesChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: any[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // Set the manager relationship
        setNodeManager(connection.target, connection.source);
      }
    },
    [setNodeManager]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div className={styles.flowChart}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[20, 20]}
        connectionLineStyle={{ stroke: 'var(--primary)', strokeWidth: 2 }}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--gray-300)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
