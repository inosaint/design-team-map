import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import type { Node, Edge, Connection, NodeTypes, EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import type { FlowNodeData, FlowEdgeData } from '../types';
import {
  calculateReportCounts,
  isOverCapacity,
  calculatePromotionEligibility,
  wouldCreateCircularReference,
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

// Generate a stable position for new nodes based on existing node count
function getNewNodePosition(index: number, existingPositions: Map<string, { x: number; y: number }>) {
  // Place new nodes in a grid pattern
  const cols = 3;
  const spacingX = 220;
  const spacingY = 150;
  const startX = 100;
  const startY = 100;

  // Find the next available grid position
  const existingCount = existingPositions.size;
  const row = Math.floor((existingCount + index) / cols);
  const col = (existingCount + index) % cols;

  return {
    x: startX + col * spacingX,
    y: startY + row * spacingY,
  };
}

function FlowChartInner() {
  const {
    nodes: teamNodes,
    nodePositions,
    settings,
    selectNode,
    updateNodePosition,
    setNodeManager,
    removeManager,
  } = useStore();

  const { fitView } = useReactFlow();
  const isInitialMount = useRef(true);
  const prevNodeCount = useRef(teamNodes.length);

  const reportCounts = useMemo(
    () => calculateReportCounts(teamNodes),
    [teamNodes]
  );

  // Convert team nodes to React Flow nodes with stable positions
  const flowNodes = useMemo(() => {
    let newNodeIndex = 0;

    return teamNodes.map((teamNode) => {
      let position = nodePositions.get(teamNode.id);

      // If no stored position, generate a stable one
      if (!position) {
        position = getNewNodePosition(newNodeIndex, nodePositions);
        newNodeIndex++;
      }

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
  const flowEdges = useMemo(() => {
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

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync nodes when team data changes, but preserve user-dragged positions
  useEffect(() => {
    setNodes((currentNodes) => {
      // Create a map of current positions
      const currentPositions = new Map(
        currentNodes.map((n) => [n.id, n.position])
      );

      // Update nodes, preserving positions for existing nodes
      return flowNodes.map((flowNode) => {
        const currentPos = currentPositions.get(flowNode.id);
        return {
          ...flowNode,
          position: currentPos || flowNode.position,
        };
      });
    });
  }, [flowNodes, setNodes]);

  // Sync edges when relationships change
  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  // Fit view only on initial mount or when first nodes are added
  useEffect(() => {
    if (isInitialMount.current && teamNodes.length > 0) {
      // Small delay to ensure nodes are rendered
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 200 });
      }, 100);
      isInitialMount.current = false;
    } else if (prevNodeCount.current === 0 && teamNodes.length > 0) {
      // First nodes added after empty state
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 200 });
      }, 100);
    }
    prevNodeCount.current = teamNodes.length;
  }, [teamNodes.length, fitView]);

  const handleNodesChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: any[]) => {
      onNodesChange(changes);

      // Update positions in store for completed position changes
      changes.forEach((change) => {
        if (change.type === 'position' && change.dragging === false && change.position) {
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

  const showToast = useToastStore((state) => state.showToast);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // Check for circular reference before setting the manager
        // connection.source = the proposed manager
        // connection.target = the node that would report to the manager
        if (wouldCreateCircularReference(connection.target, connection.source, teamNodes)) {
          showToast('Cannot create circular reporting loop', 'error');
          return;
        }
        setNodeManager(connection.target, connection.source);
      }
    },
    [setNodeManager, teamNodes, showToast]
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

  // Save position when drag ends
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  // Delete edge (remove manager relationship) on click
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      // edge.target is the node that reports to the manager (edge.source)
      removeManager(edge.target);
    },
    [removeManager]
  );

  return (
    <div id="flow-chart-container" className={styles.flowChart}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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
        {settings.showMinimap && (
          <MiniMap
            nodeStrokeWidth={3}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export default function FlowChart() {
  return (
    <ReactFlowProvider>
      <FlowChartInner />
    </ReactFlowProvider>
  );
}
