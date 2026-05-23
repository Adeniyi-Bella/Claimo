import { useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Crosshair,
  EyeOff,
  Eye,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/common/input";
import { ScrollArea } from "@/components/common/scroll-area";
import { cn } from "@/lib/utils/utils";
import { useViewerStore } from "../../state/store";
import { collectNodeIds } from "../../state/selectors";
import type { IfcTreeNode } from "../../state/types";

function collectExpressIds(node: IfcTreeNode): string[] {
  return [node.expressId, ...node.children.flatMap(collectExpressIds)];
}

function filterTree(tree: IfcTreeNode[], query: string): IfcTreeNode[] {
  if (!query.trim()) return tree;
  const q = query.toLowerCase();

  const filterNode = (node: IfcTreeNode): IfcTreeNode | null => {
    const selfMatch =
      node.name.toLowerCase().includes(q) ||
      node.type.toLowerCase().includes(q);
    const filteredChildren = node.children
      .map(filterNode)
      .filter(Boolean) as IfcTreeNode[];
    if (selfMatch || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };

  return tree.map(filterNode).filter(Boolean) as IfcTreeNode[];
}

function IfcTreeNodeRow({
  node,
  modelId,
  depth,
}: {
  node: IfcTreeNode;
  modelId: string;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const selectedByModelId = useViewerStore((s) => s.selectedByModelId);
  const highlighter = useViewerStore((s) => s._highlighter);
  const hider = useViewerStore((s) => s._hider);
  const activeModelId = useViewerStore((s) => s._activeModelId);
  const setActiveModelId = useViewerStore((s) => s.setActiveModelId);
  const selectMany = useViewerStore((s) => s.selectMany);
  const clearSelection = useViewerStore((s) => s.clearSelection);

  const hasChildren = node.children.length > 0;

  const subtreeExpressIds = useMemo(
    () => new Set(collectExpressIds(node)),
    [node],
  );

  const modelSelection = selectedByModelId[modelId] ?? new Set<number>();
  const isSelected = modelSelection.has(node.localId);
  const subtreeHasSelected = useMemo(
    () =>
      Array.from(modelSelection).some((id) =>
        subtreeExpressIds.has(String(id)),
      ),
    [modelSelection, subtreeExpressIds],
  );

  const activateModel = () => {
    if (activeModelId !== modelId) {
      setActiveModelId(modelId);
    }
  };

  const handleSelect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!highlighter) return;

    const additive =
      activeModelId === modelId && (e.shiftKey || e.ctrlKey || e.metaKey);
    activateModel();
    const allIds = collectNodeIds(node);
    const modelIdMap: Record<string, Set<number>> = {
      [modelId]: new Set(allIds),
    };

    if (additive) {
      await highlighter.highlightByID("select", modelIdMap, false, false);
    } else {
      await highlighter.clear("select");
      await highlighter.highlightByID("select", modelIdMap, false, false);
    }

    const stringIds = allIds.map(String);
    if (additive) {
      const merged = Array.from(
        new Set([...Array.from(modelSelection), ...allIds]),
      );
      selectMany(merged);
    } else {
      selectMany(stringIds);
    }
  };

  const handleIsolate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hider) return;
    activateModel();
    const allIds = collectNodeIds(node);
    const modelIdMap: Record<string, Set<number>> = {
      [modelId]: new Set(allIds),
    };
    await hider.isolate(modelIdMap);
  };

  const handleHide = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hider) return;
    activateModel();
    const allIds = collectNodeIds(node);
    const modelIdMap: Record<string, Set<number>> = {
      [modelId]: new Set(allIds),
    };
    await hider.set(false, modelIdMap);
    if (subtreeHasSelected) clearSelection();
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 py-0.5 pr-1 rounded text-[11px] cursor-pointer select-none",
          isSelected
            ? "text-(--status-selected) bg-(--status-selected)/10"
            : subtreeHasSelected
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={handleSelect}
      >
        <span
          className="shrink-0 w-3.5 h-3.5 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setOpen((v) => !v);
          }}
        >
          {hasChildren ? (
            open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : null}
        </span>

        <span className="truncate flex-1 leading-5">
          {node.name || node.type}
        </span>

        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            title="Isolate"
            className="p-0.5 rounded hover:text-primary hover:bg-primary/10"
            onClick={handleIsolate}
          >
            <Crosshair className="h-3 w-3" />
          </button>
          <button
            title="Hide"
            className="p-0.5 rounded hover:text-destructive hover:bg-destructive/10"
            onClick={handleHide}
          >
            <EyeOff className="h-3 w-3" />
          </button>
        </span>
      </div>

      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <IfcTreeNodeRow
              key={child.expressId}
              node={child}
              modelId={modelId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModelTreeSection({
  modelId,
  modelName,
  tree,
  hidden,
  active,
  query,
}: {
  modelId: string;
  modelName: string;
  tree: IfcTreeNode[];
  hidden: boolean;
  active: boolean;
  query: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const setActiveModelId = useViewerStore((s) => s.setActiveModelId);
  const setModelVisibility = useViewerStore((s) => s.setModelVisibility);
  const highlighter = useViewerStore((s) => s._highlighter);
  const hider = useViewerStore((s) => s._hider);
  const clearSelection = useViewerStore((s) => s.clearSelection);

  const filtered = useMemo(() => filterTree(tree, query), [tree, query]);

  const showModel = async () => {
    if (!hider) return;
    await setModelVisibility(modelId, true);
  };

  const hideModel = async () => {
    if (!hider) return;
    await setModelVisibility(modelId, false);
  };

  const showAllElements = async () => {
    if (!hider || !highlighter) return;
    setActiveModelId(modelId);
    await hider.set(true, { [modelId]: new Set(tree.flatMap(collectTreeIds)) });
    await highlighter.clear("select");
    clearSelection();
  };

  return (
    <div
      className={cn(
        "rounded-md border overflow-hidden",
        active
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-background/30",
        hidden && "opacity-75",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-border/70">
        <div className="min-w-0 flex-1">
          <button
            className="w-full text-left"
            onClick={() => {
              setActiveModelId(modelId);
              setExpanded((value) => !value);
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-xs font-semibold text-foreground">
                {modelName}
              </span>
              {active && (
                <span className="text-[9px] uppercase tracking-wider text-primary">
                  Active
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            title="Show all elements in model"
            className="p-1 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground"
            onClick={showAllElements}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            title={hidden ? "Show model" : "Hide model"}
            className="p-1 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground"
            onClick={hidden ? showModel : hideModel}
          >
            {hidden ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-1.5 py-1">
          {filtered.length > 0 ? (
            filtered.map((node) => (
              <IfcTreeNodeRow
                key={node.expressId}
                node={node}
                modelId={modelId}
                depth={0}
              />
            ))
          ) : (
            <div className="px-2 py-4 text-[11px] text-center text-muted-foreground">
              No elements match
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function collectTreeIds(node: IfcTreeNode): number[] {
  const ids = [node.localId];
  for (const child of node.children) {
    ids.push(...collectTreeIds(child));
  }
  return ids;
}

export function IfcTreePanel() {
  const models = useViewerStore((s) => s.models);
  const ifcTreesByModelId = useViewerStore((s) => s.ifcTreesByModelId);
  const ifcTreeLoading = useViewerStore((s) => s.ifcTreeLoading);
  const activeModelId = useViewerStore((s) => s._activeModelId);
  const hiddenModelIds = useViewerStore((s) => s.hiddenModelIds);
  const clearSelection = useViewerStore((s) => s.clearSelection);
  const highlighter = useViewerStore((s) => s._highlighter);
  const hider = useViewerStore((s) => s._hider);
  const [query, setQuery] = useState("");

  const showAllModels = async () => {
    if (!hider || !highlighter) return;
    await hider.set(true);
    useViewerStore.setState({ hiddenModelIds: new Set() });
    await highlighter.clear("select");
    clearSelection();
  };

  if (ifcTreeLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-32 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[11px]">Building trees…</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="text-[11px] text-muted-foreground py-8 text-center">
        No IFC model loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {models.length > 1 && (
        <button
          onClick={showAllModels}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground w-full px-1 py-0.5 rounded hover:bg-accent/40"
        >
          <Eye className="h-3 w-3" />
          Show all models
        </button>
      )}

      <Input
        placeholder="Search elements across all models…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 text-xs bg-background border-border"
      />

      <ScrollArea className="flex-1 -mx-2">
        <div className="px-2 space-y-2">
          {models.map((model) => (
            <ModelTreeSection
              key={model.id}
              modelId={model.id}
              modelName={model.name}
              tree={ifcTreesByModelId[model.id] ?? []}
              hidden={hiddenModelIds.has(model.id)}
              active={activeModelId === model.id}
              query={query}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
