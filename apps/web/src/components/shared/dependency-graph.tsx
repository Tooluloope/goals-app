'use client';

import { useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
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
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRouter } from 'next/navigation';
import { Project } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { getColorClasses } from '@/types/config';
import { cn } from '@/lib/utils';

export interface DependencyGraphRef {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
}

interface DependencyGraphProps {
  projects: Project[];
  className?: string;
  debug?: boolean;
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
        'min-w-[180px] max-w-[250px] relative',
        data.isCompleted
          ? 'border-green-300 bg-green-50'
          : `border-${data.color}-300 bg-${data.color}-50`
      )}
      style={{
        borderColor: data.isCompleted ? '#86efac' : undefined,
        backgroundColor: data.isCompleted ? '#f0fdf4' : undefined,
      }}
    >
      {/* Handles for edge connections */}
      <Handle type="target" position={Position.Left} className="!bg-orange-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-orange-500 !w-2 !h-2" />
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

// Inner component that uses useReactFlow hook
const DependencyGraphInner = forwardRef<DependencyGraphRef, DependencyGraphProps>(
  function DependencyGraphInner({ projects, className, debug = false }, ref) {
    const { currentWorkspace } = useAuthStore();
    const { getStatusById, getAreaById } = useConfigStore();
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => zoomIn({ duration: 300 }),
        zoomOut: () => zoomOut({ duration: 300 }),
        fitView: () => fitView({ duration: 300, padding: 0.2 }),
      }),
      [zoomIn, zoomOut, fitView]
    );

    // Build nodes and edges from projects with dependencies
    const { initialNodes, initialEdges } = useMemo(() => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];
      const edgeKeys = new Set<string>(); // Track created edges to avoid duplicates

      // Create a map of all project IDs that actually exist in the projects array
      const existingProjectIds = new Set(projects.map((p) => p.id));

      // Debug logging
      if (debug) {
        console.log('[DependencyGraph] Processing projects:', projects.length);
        projects.forEach((p) => {
          if (p.blockedBy?.length || p.blocking?.length) {
            console.log(`[DependencyGraph] Project "${p.name}" (${p.id}):`, {
              blockedBy: p.blockedBy?.map((d) => ({ blockerId: d.blockerId, blocker: d.blocker })),
              blocking: p.blocking?.map((d) => ({
                dependentId: d.dependentId,
                dependent: d.dependent,
              })),
            });
          }
        });
      }

      // First pass: identify all projects involved in dependencies
      // Only include projects that actually exist in the projects array
      const nodesWithDeps = new Set<string>();

      projects.forEach((project) => {
        if (project.blockedBy && project.blockedBy.length > 0) {
          // Check if any blocker exists in our projects
          const hasValidBlocker = project.blockedBy.some((dep) => {
            const blockerId = dep.blockerId || dep.blocker?.id;
            return blockerId && existingProjectIds.has(blockerId);
          });
          if (hasValidBlocker) {
            nodesWithDeps.add(project.id);
            project.blockedBy.forEach((dep) => {
              const blockerId = dep.blockerId || dep.blocker?.id;
              // Only add if the blocker actually exists in our projects
              if (blockerId && existingProjectIds.has(blockerId)) {
                nodesWithDeps.add(blockerId);
              }
            });
          }
        }
        if (project.blocking && project.blocking.length > 0) {
          // Check if any dependent exists in our projects
          const hasValidDependent = project.blocking.some((dep) => {
            const dependentId = dep.dependentId || dep.dependent?.id;
            return dependentId && existingProjectIds.has(dependentId);
          });
          if (hasValidDependent) {
            nodesWithDeps.add(project.id);
            project.blocking.forEach((dep) => {
              const dependentId = dep.dependentId || dep.dependent?.id;
              // Only add if the dependent actually exists in our projects
              if (dependentId && existingProjectIds.has(dependentId)) {
                nodesWithDeps.add(dependentId);
              }
            });
          }
        }
      });

      if (debug) {
        console.log('[DependencyGraph] nodesWithDeps:', Array.from(nodesWithDeps));
        console.log('[DependencyGraph] existingProjectIds:', Array.from(existingProjectIds));
      }

      // Only show projects with dependencies that exist in our projects array
      const relevantProjects = projects.filter((p) => nodesWithDeps.has(p.id));

      if (debug) {
        console.log(
          '[DependencyGraph] relevantProjects:',
          relevantProjects.map((p) => ({ id: p.id, name: p.name }))
        );
      }

      // Layout: arrange nodes in a grid pattern
      const cols = Math.max(1, Math.ceil(Math.sqrt(relevantProjects.length)));
      const nodeWidth = 220;
      const nodeHeight = 100;
      const gapX = 100;
      const gapY = 80;

      // Track actual node IDs that are created
      const createdNodeIds = new Set<string>();

      relevantProjects.forEach((project, index) => {
        const status = currentWorkspace
          ? getStatusById(currentWorkspace.id, project.statusId)
          : null;
        const primaryAreaId = project.areaIds?.[0];
        const area =
          currentWorkspace && primaryAreaId
            ? getAreaById(currentWorkspace.id, primaryAreaId)
            : null;
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
        createdNodeIds.add(project.id);
      });

      // Second pass: create edges only for nodes that actually exist
      relevantProjects.forEach((project) => {
        // Create edges for blockedBy relationships
        if (project.blockedBy) {
          project.blockedBy.forEach((dep) => {
            const blockerId = dep.blockerId || dep.blocker?.id;
            // IMPORTANT: Only create edge if BOTH source and target nodes exist
            if (blockerId && createdNodeIds.has(blockerId) && createdNodeIds.has(project.id)) {
              const edgeKey = `${blockerId}->${project.id}`;
              if (edgeKeys.has(edgeKey)) return; // Skip duplicate
              edgeKeys.add(edgeKey);

              const blockerStatus =
                dep.blocker && currentWorkspace
                  ? getStatusById(currentWorkspace.id, dep.blocker.statusId)
                  : null;
              const isResolved = blockerStatus?.type === 'completed';

              if (debug) {
                console.log(
                  `[DependencyGraph] Creating edge: ${blockerId} -> ${project.id} (blockedBy)`
                );
              }

              edges.push({
                id: edgeKey,
                source: blockerId,
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

        // Create edges for blocking relationships (only if not already created via blockedBy)
        if (project.blocking) {
          project.blocking.forEach((dep) => {
            const dependentId = dep.dependentId || dep.dependent?.id;
            // IMPORTANT: Only create edge if BOTH source and target nodes exist
            if (dependentId && createdNodeIds.has(project.id) && createdNodeIds.has(dependentId)) {
              const edgeKey = `${project.id}->${dependentId}`;
              if (edgeKeys.has(edgeKey)) return; // Skip duplicate
              edgeKeys.add(edgeKey);

              const blockerStatus = currentWorkspace
                ? getStatusById(currentWorkspace.id, project.statusId)
                : null;
              const isResolved = blockerStatus?.type === 'completed';

              if (debug) {
                console.log(
                  `[DependencyGraph] Creating edge: ${project.id} -> ${dependentId} (blocking)`
                );
              }

              edges.push({
                id: edgeKey,
                source: project.id,
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
                },
                labelBgStyle: {
                  fill: '#fff',
                },
              });
            }
          });
        }
      });

      if (debug) {
        console.log('[DependencyGraph] Final result:', {
          nodes: nodes.length,
          edges: edges.length,
        });
        console.log('[DependencyGraph] createdNodeIds:', Array.from(createdNodeIds));
        console.log('[DependencyGraph] edgeKeys:', Array.from(edgeKeys));
      }

      return { initialNodes: nodes, initialEdges: edges };
    }, [projects, currentWorkspace, getStatusById, getAreaById, debug]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

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
        {debug && (
          <div className="absolute left-4 top-4 z-20 rounded-lg border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
            <div className="font-semibold text-foreground">Graph Debug</div>
            <div className="text-muted-foreground">Nodes: {nodes.length}</div>
            <div
              className={cn(
                'text-muted-foreground',
                edges.length === 0 && nodes.length > 0 && 'text-red-500 font-medium'
              )}
            >
              Edges: {edges.length}
              {edges.length === 0 && nodes.length > 0 && ' (No edges created!)'}
            </div>
            {edges.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <div className="text-muted-foreground">Edges:</div>
                {edges.slice(0, 5).map((e) => (
                  <div key={e.id} className="text-[10px] text-muted-foreground truncate">
                    {e.source} → {e.target}
                  </div>
                ))}
                {edges.length > 5 && (
                  <div className="text-[10px] text-muted-foreground">
                    ...and {edges.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
);

// Wrapper component with ReactFlowProvider
export const DependencyGraph = forwardRef<DependencyGraphRef, DependencyGraphProps>(
  function DependencyGraph(props, ref) {
    return (
      <ReactFlowProvider>
        <DependencyGraphInner {...props} ref={ref} />
      </ReactFlowProvider>
    );
  }
);
