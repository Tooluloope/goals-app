'use client';

import { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Lock, AlertTriangle } from 'lucide-react';

interface TaskDependencyGraphProps {
  projectId: string;
  tasks: Task[];
  className?: string;
}

// Custom node component for tasks
function TaskNode({
  data,
}: {
  data: {
    task: Task;
    projectId: string;
    statusType: string;
    statusName: string;
    isBlocked: boolean;
  };
}) {
  const router = useRouter();

  const getNodeStyles = () => {
    if (data.statusType === 'completed') {
      return {
        borderColor: '#22c55e',
        backgroundColor: '#f0fdf4',
        textClass: 'line-through text-muted-foreground',
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        statusBadge: 'bg-green-500/20 text-green-600',
      };
    }
    if (data.isBlocked) {
      return {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
        textClass: '',
        icon: <Lock className="h-4 w-4 text-red-500" />,
        statusBadge: 'bg-red-500/20 text-red-600',
      };
    }
    if (data.statusType === 'active') {
      return {
        borderColor: '#8b5cf6',
        backgroundColor: '#faf5ff',
        textClass: '',
        icon: <Clock className="h-4 w-4 text-primary animate-pulse" />,
        statusBadge: 'bg-primary/20 text-primary',
      };
    }
    return {
      borderColor: '#cbd5e1',
      backgroundColor: '#f8fafc',
      textClass: 'text-muted-foreground',
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      statusBadge: 'bg-slate-500/20 text-slate-600',
    };
  };

  const styles = getNodeStyles();

  return (
    <div
      onClick={() => router.push(`/project/${data.projectId}/task/${data.task.id}`)}
      className="cursor-pointer rounded-lg border-2 px-4 py-3 shadow-md transition-all hover:shadow-lg hover:scale-105 relative"
      style={{
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
        minWidth: '200px',
        maxWidth: '280px',
      }}
    >
      {/* Handles for edge connections */}
      <Handle type="target" position={Position.Left} className="!bg-orange-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-orange-500 !w-2 !h-2" />
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={cn(
            'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
            styles.statusBadge
          )}
        >
          {data.isBlocked ? 'Blocked' : data.statusName}
        </span>
        {styles.icon}
      </div>
      <div className={cn('font-medium truncate', styles.textClass)}>{data.task.title}</div>
      {data.task.dueDate && (
        <div className="text-xs text-muted-foreground mt-1">
          Due:{' '}
          {new Date(data.task.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  taskNode: TaskNode,
};

export function TaskDependencyGraph({ projectId, tasks, className }: TaskDependencyGraphProps) {
  const router = useRouter();
  const { currentWorkspace } = useAuthStore();
  const { getTaskStatusById } = useConfigStore();

  // Build nodes and edges from tasks with dependencies
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const edgeKeys = new Set<string>(); // Track created edges to avoid duplicates

    // Create a map of all task IDs that actually exist in the tasks array
    const existingTaskIds = new Set(tasks.map((t) => t.id));

    // First pass: identify all tasks involved in dependencies
    const nodesWithDeps = new Set<string>();

    tasks.forEach((task) => {
      if (task.blockedBy && task.blockedBy.length > 0) {
        // Check if any blocker exists in our tasks
        const hasValidBlocker = task.blockedBy.some((dep) => {
          const blockerId = dep.blockerId || dep.blocker?.id;
          return blockerId && existingTaskIds.has(blockerId);
        });
        if (hasValidBlocker) {
          nodesWithDeps.add(task.id);
          task.blockedBy.forEach((dep) => {
            const blockerId = dep.blockerId || dep.blocker?.id;
            if (blockerId && existingTaskIds.has(blockerId)) {
              nodesWithDeps.add(blockerId);
            }
          });
        }
      }
      if (task.blocking && task.blocking.length > 0) {
        // Check if any dependent exists in our tasks
        const hasValidDependent = task.blocking.some((dep) => {
          const dependentId = dep.dependentId || dep.dependent?.id;
          return dependentId && existingTaskIds.has(dependentId);
        });
        if (hasValidDependent) {
          nodesWithDeps.add(task.id);
          task.blocking.forEach((dep) => {
            const dependentId = dep.dependentId || dep.dependent?.id;
            if (dependentId && existingTaskIds.has(dependentId)) {
              nodesWithDeps.add(dependentId);
            }
          });
        }
      }
    });

    // If no dependencies, show all tasks in a simple layout
    const relevantTasks =
      nodesWithDeps.size > 0 ? tasks.filter((t) => nodesWithDeps.has(t.id)) : tasks;

    // Layout: arrange nodes in a hierarchical pattern
    const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(relevantTasks.length))));
    const nodeWidth = 240;
    const nodeHeight = 100;
    const gapX = 120;
    const gapY = 100;

    // Track actual node IDs that are created
    const createdNodeIds = new Set<string>();

    relevantTasks.forEach((task, index) => {
      const status = currentWorkspace
        ? getTaskStatusById(currentWorkspace.id, task.statusId)
        : null;

      // Check if task is blocked (only by blockers that exist)
      const isBlocked =
        task.blockedBy?.some((dep) => {
          const blockerId = dep.blockerId || dep.blocker?.id;
          if (!blockerId || !existingTaskIds.has(blockerId)) return false;
          if (!dep.blocker) return true;
          const blockerStatus = currentWorkspace
            ? getTaskStatusById(currentWorkspace.id, dep.blocker.statusId)
            : null;
          return blockerStatus?.type !== 'completed';
        }) || false;

      const col = index % cols;
      const row = Math.floor(index / cols);

      nodes.push({
        id: task.id,
        type: 'taskNode',
        position: { x: col * (nodeWidth + gapX), y: row * (nodeHeight + gapY) },
        data: {
          task,
          projectId,
          statusType: status?.type || 'pending',
          statusName: status?.name || 'Unknown',
          isBlocked,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
      createdNodeIds.add(task.id);
    });

    // Second pass: create edges only for nodes that actually exist
    relevantTasks.forEach((task) => {
      // Create edges for blockedBy relationships
      if (task.blockedBy) {
        task.blockedBy.forEach((dep) => {
          const blockerId = dep.blockerId || dep.blocker?.id;
          // IMPORTANT: Only create edge if BOTH source and target nodes exist
          if (blockerId && createdNodeIds.has(blockerId) && createdNodeIds.has(task.id)) {
            const edgeKey = `${blockerId}->${task.id}`;
            if (edgeKeys.has(edgeKey)) return; // Skip duplicate
            edgeKeys.add(edgeKey);

            const blockerTask = tasks.find((t) => t.id === blockerId);
            const blockerStatus =
              blockerTask && currentWorkspace
                ? getTaskStatusById(currentWorkspace.id, blockerTask.statusId)
                : null;
            const isResolved = blockerStatus?.type === 'completed';

            edges.push({
              id: edgeKey,
              source: blockerId,
              target: task.id,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isResolved ? '#22c55e' : '#f97316',
              },
              style: {
                stroke: isResolved ? '#22c55e' : '#f97316',
                strokeWidth: 2,
                strokeDasharray: isResolved ? '5,5' : undefined,
              },
              label: isResolved ? 'resolved' : 'blocks',
              labelStyle: {
                fontSize: 10,
                fill: isResolved ? '#22c55e' : '#f97316',
                fontWeight: 500,
              },
              labelBgStyle: {
                fill: '#fff',
                fillOpacity: 0.9,
              },
              labelBgPadding: [4, 2] as [number, number],
              labelBgBorderRadius: 4,
            });
          }
        });
      }

      // Create edges for blocking relationships (only if not already created via blockedBy)
      if (task.blocking) {
        task.blocking.forEach((dep) => {
          const dependentId = dep.dependentId || dep.dependent?.id;
          // IMPORTANT: Only create edge if BOTH source and target nodes exist
          if (dependentId && createdNodeIds.has(task.id) && createdNodeIds.has(dependentId)) {
            const edgeKey = `${task.id}->${dependentId}`;
            if (edgeKeys.has(edgeKey)) return; // Skip duplicate
            edgeKeys.add(edgeKey);

            const blockerStatus = currentWorkspace
              ? getTaskStatusById(currentWorkspace.id, task.statusId)
              : null;
            const isResolved = blockerStatus?.type === 'completed';

            edges.push({
              id: edgeKey,
              source: task.id,
              target: dependentId,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isResolved ? '#22c55e' : '#f97316',
              },
              style: {
                stroke: isResolved ? '#22c55e' : '#f97316',
                strokeWidth: 2,
                strokeDasharray: isResolved ? '5,5' : undefined,
              },
              label: isResolved ? 'resolved' : 'blocks',
              labelStyle: {
                fontSize: 10,
                fill: isResolved ? '#22c55e' : '#f97316',
                fontWeight: 500,
              },
              labelBgStyle: {
                fill: '#fff',
                fillOpacity: 0.9,
              },
              labelBgPadding: [4, 2] as [number, number],
              labelBgBorderRadius: 4,
            });
          }
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [tasks, projectId, currentWorkspace, getTaskStatusById]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (tasks.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center h-full text-muted-foreground', className)}
      >
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm mt-1">Add tasks to this project to see them in the graph</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.3}
        maxZoom={2}
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { statusType?: string; isBlocked?: boolean };
            if (data?.statusType === 'completed') return '#86efac';
            if (data?.isBlocked) return '#fca5a5';
            if (data?.statusType === 'active') return '#c4b5fd';
            return '#e2e8f0';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
