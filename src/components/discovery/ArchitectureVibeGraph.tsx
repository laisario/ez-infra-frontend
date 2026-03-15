import { useLayoutEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type Position,
  MarkerType,
} from "reactflow";
import ELK from "elkjs/lib/elk.bundled.js";
import type { ArchitectureResource } from "@/lib/api/architectureResult";
import { inferArchitectureEdges } from "@/lib/infra/inferArchitectureEdges";
import { Globe, Server, Database, HardDrive, Cog } from "lucide-react";
import "reactflow/dist/style.css";

const elk = new ELK();

const elkOptions: Record<string, string> = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.layered.spacing.nodeNodeBetweenLayers": "120",
  "elk.spacing.nodeNode": "80",
  "elk.spacing.componentComponent": "80",
};

function configDisplay(r: ArchitectureResource): string {
  if (typeof r.config === "string") return r.config;
  if (r.config && typeof r.config === "object") {
    const d = (r.config as { display?: string }).display;
    if (typeof d === "string") return d;
  }
  return "";
}

function pickIcon(servico: string): React.ElementType {
  const s = servico.toLowerCase();
  if (s.includes("frontend") || s.includes("web")) return Globe;
  if (s.includes("api")) return Server;
  if (s.includes("database") || s.includes("postgres") || s.includes("mysql"))
    return Database;
  if (s.includes("cache") || s.includes("redis")) return HardDrive;
  if (s.includes("worker") || s.includes("rq")) return Cog;
  return Server;
}

interface ResourceNodeData {
  resource: ArchitectureResource;
}

function ResourceNode({ data }: NodeProps<ResourceNodeData>) {
  const { resource } = data;
  const Icon = pickIcon(resource.servico);
  const config = configDisplay(resource);

  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-sm min-w-[160px]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-medium text-foreground">
            {resource.servico}
          </p>
          {config && (
            <p className="line-clamp-2 text-[10px] text-muted-foreground">
              {config}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { resource: ResourceNode };

const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;

async function getLayoutedElements(
  nodes: Node<ResourceNodeData>[],
  edges: Edge[],
  options: Record<string, string> = elkOptions
) {
  const graph = {
    id: "root",
    layoutOptions: options,
    children: nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layouted = await elk.layout(graph);

  return {
    nodes: layouted.children!.map((child) => {
      const node = nodes.find((n) => n.id === child.id)!;
      return {
        ...node,
        position: { x: child.x ?? 0, y: child.y ?? 0 },
      };
    }),
    edges,
  };
}

interface ArchitectureVibeGraphProps {
  recursos: ArchitectureResource[];
}

export default function ArchitectureVibeGraph({
  recursos,
}: ArchitectureVibeGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const inferredEdges = inferArchitectureEdges(recursos);

    const nodes: Node<ResourceNodeData>[] = recursos.map((r) => ({
      id: r.servico,
      type: "resource",
      data: { resource: r },
      position: { x: 0, y: 0 },
      sourcePosition: "right" as Position,
      targetPosition: "left" as Position,
    }));

    const edges: Edge[] = inferredEdges.map((e, i) => ({
      id: `edge-${i}`,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 },
    }));

    return { nodes, edges };
  }, [recursos]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useLayoutEffect(() => {
    if (initialNodes.length > 0) {
      getLayoutedElements(initialNodes, initialEdges).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
        }
      );
    }
  }, [initialNodes, initialEdges]);

  if (recursos.length === 0) return null;

  return (
    <div className="h-[280px] w-full min-w-0 overflow-hidden rounded-lg border bg-muted/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.35,
          minZoom: 0.5,
          maxZoom: 1,
        }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="hsl(var(--border))" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
