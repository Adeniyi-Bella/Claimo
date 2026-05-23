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

function IfcTreeNodeRow({ node, depth }: { node: IfcTreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const selectedIds = useViewerStore((s) => s.selectedIds);
  const highlighter = useViewerStore((s) => s._highlighter);
  const hider = useViewerStore((s) => s._hider);
  const activeModelId = useViewerStore((s) => s._activeModelId);
  const selectMany = useViewerStore((s) => s.selectMany);
  const clearSelection = useViewerStore((s) => s.clearSelection);

  const hasChildren = node.children.length > 0;

  const subtreeExpressIds = useMemo(
    () => new Set(collectExpressIds(node)),
    [node],
  );

  const isSelected = selectedIds.has(node.expressId);
  const subtreeHasSelected = useMemo(
    () => Array.from(selectedIds).some((id) => subtreeExpressIds.has(id)),
    [selectedIds, subtreeExpressIds],
  );

  const handleSelect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!highlighter || !activeModelId) return;

    const allIds = collectNodeIds(node);
    const modelIdMap: Record<string, Set<number>> = {
      [activeModelId]: new Set(allIds),
    };

    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      await highlighter.highlightByID("select", modelIdMap, false, false);
    } else {
      await highlighter.clear("select");
      await highlighter.highlightByID("select", modelIdMap, false, false);
    }

    const stringIds = allIds.map(String);
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const merged = Array.from(
        new Set([...Array.from(selectedIds), ...stringIds]),
      );
      selectMany(merged);
    } else {
      selectMany(stringIds);
    }
  };

  const handleIsolate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hider || !activeModelId) return;
    const allIds = collectNodeIds(node);
    const modelIdMap: Record<string, Set<number>> = {
      [activeModelId]: new Set(allIds),
    };
    await hider.isolate(modelIdMap);
  };

  const handleHide = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hider || !activeModelId) return;
    const allIds = collectNodeIds(node);
    const modelIdMap: Record<string, Set<number>> = {
      [activeModelId]: new Set(allIds),
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
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function IfcTreePanel() {
  const ifcTree = useViewerStore((s) => s.ifcTree);
  const ifcTreeLoading = useViewerStore((s) => s.ifcTreeLoading);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return ifcTree;
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
    return ifcTree.map(filterNode).filter(Boolean) as IfcTreeNode[];
  }, [ifcTree, query]);

  if (ifcTreeLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-32 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[11px]">Building tree…</span>
      </div>
    );
  }

  if (ifcTree.length === 0) {
    return (
      <div className="text-[11px] text-muted-foreground py-8 text-center">
        No IFC model loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <Input
        placeholder="Search elements…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 text-xs bg-background border-border"
      />
      <button
        onClick={async () => {
          const {
            _hider: hider,
            _highlighter: highlighter,
            clearSelection,
          } = useViewerStore.getState();
          if (!hider || !highlighter) return;
          await hider.set(true);
          await highlighter.clear("select");
          clearSelection();
        }}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground w-full px-1 py-0.5 rounded hover:bg-accent/40"
      >
        <Eye className="h-3 w-3" />
        Show all
      </button>
      <ScrollArea className="flex-1 -mx-2">
        <div className="px-2">
          {filtered.map((node) => (
            <IfcTreeNodeRow key={node.expressId} node={node} depth={0} />
          ))}
          {filtered.length === 0 && (
            <div className="text-[11px] text-muted-foreground py-4 text-center">
              No elements match
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
