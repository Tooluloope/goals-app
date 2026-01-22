'use client';

import { useCallback, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRouter } from 'next/navigation';
import { Project } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { getColorClasses } from '@/types/config';
import { cn } from '@/lib/utils';

interface DependencyGraphProps {
  projects: Project[];
  className?: string;
}

// Custom node component
function ProjectNode({
  data,
}: {
  data: { project: Project; color: string; isCompleted: boolean };
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/project/${data.project.id}`)}
      className={cn(
        'cursor-pointer rounded-lg border-2 px-4 py-3 shadow-md transition-all hover:shadow-lg',
        'min-w-[180px] max-w-[250px]',
        data.isCompleted
          ? 'border-green-300 bg-green-50'
          : `border-${data.color}-300 bg-${data.color}-50`
      )}
      style={{
        borderColor: data.isCompleted ? '#86efac' : undefined,
        backgroundColor: data.isCompleted ? '#f0fdf4' : undefined,
      }}
    >
      <div
        className={cn(
          'font-medium truncate',
          data.isCompleted && 'line-through text-muted-foreground'
        )}
      >
        {data.project.name}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {data.isCompleted ? 'Completed' : 'Active'}
      </div>
    </div>
  );
}

const nodeTypes = {
  projectNode: ProjectNode,
};

export function DependencyGraph({ projects, className }: DependencyGraphProps) {
  const { currentWorkspace } = useAuthStore();
  const { getStatusById, getAreaById } = useConfigStore();

  // Build nodes and edges from projects with dependencies
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodesWithDeps = new Set<string>();

    // First pass: identify all projects involved in dependencies
    projects.forEach((project) => {
      if (project.blockedBy && project.blockedBy.length > 0) {
        nodesWithDeps.add(project.id);
        project.blockedBy.forEach((dep) => {
          if (dep.blockerId) nodesWithDeps.add(dep.blockerId);
        });
      }
      if (project.blocking && project.blocking.length > 0) {
        nodesWithDeps.add(project.id);
        project.blocking.forEach((dep) => {
          if (dep.dependentId) nodesWithDeps.add(dep.dependentId);
        });
      }
    });

    // Only show projects with dependencies
    const relevantProjects = projects.filter((p) => nodesWithDeps.has(p.id));

    // Layout: arrange nodes in a grid pattern
    const cols = Math.ceil(Math.sqrt(relevantProjects.length));
    const nodeWidth = 220;
    const nodeHeight = 100;
    const gapX = 100;
    const gapY = 80;

    relevantProjects.forEach((project, index) => {
      const status = currentWorkspace ? getStatusById(currentWorkspace.id, project.statusId) : null;
      const area = currentWorkspace ? getAreaById(currentWorkspace.id, project.areaId) : null;
      const isCompleted = status?.type === 'completed';

      const col = index % cols;
      const row = Math.floor(index / cols);

      nodes.push({
        id: project.id,
        type: 'projectNode',
        position: { x: col * (nodeWidth + gapX), y: row * (nodeHeight + gapY) },
        data: {
          project,
          color: area?.color || 'slate',
          isCompleted,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      // Create edges for blockedBy relationships
      if (project.blockedBy) {
        project.blockedBy.forEach((dep) => {
          if (dep.blockerId && nodesWithDeps.has(dep.blockerId)) {
            const blockerStatus =
              dep.blocker && currentWorkspace
                ? getStatusById(currentWorkspace.id, dep.blocker.statusId)
                : null;
            const isResolved = blockerStatus?.type === 'completed';

            edges.push({
              id: `${dep.blockerId}-${project.id}`,
              source: dep.blockerId,
              target: project.id,
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
              },
              labelBgStyle: {
                fill: '#fff',
              },
            });
          }
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [projects, currentWorkspace, getStatusById, getAreaById]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  if (initialNodes.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center h-full text-muted-foreground', className)}
      >
        <div className="text-center">
          <p className="text-lg font-medium">No dependencies found</p>
          <p className="text-sm mt-1">
            Add blockers to projects to see them in the dependency graph
          </p>
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
        minZoom={0.2}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { isCompleted?: boolean; color?: string };
            return data?.isCompleted ? '#86efac' : '#e2e8f0';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
