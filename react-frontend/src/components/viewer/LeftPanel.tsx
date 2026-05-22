import { useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Layers,
  ListTree,
  Trees,
  // Eye,
  EyeOff,
  Crosshair,
  Loader2,
  Eye,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/tabs";
import { Input } from "@/components/common/input";
import { ScrollArea } from "@/components/common/scroll-area";
import { cn } from "@/lib/utils/utils";
import {
  useViewerStore,
  collectNodeIds,
  type IfcTreeNode,
} from "@/lib/viewer/store";

// ─── IFC Tree ─────────────────────────────────────────────────────────────────

/**
 * Recursively collect all string expressIds from a node tree.
 * Used to check whether a subtree contains any selected element.
 */
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

    const allIds = collectNodeIds(node); // number[]
    const modelIdMap: Record<string, Set<number>> = {
      [activeModelId]: new Set(allIds),
    };

    // Additive if shift/ctrl held
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      // merge with existing highlight selection
      await highlighter.highlightByID("select", modelIdMap, false, false);
    } else {
      await highlighter.clear("select");
      await highlighter.highlightByID("select", modelIdMap, false, false);
    }

    // Sync store
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
    // If all selected were in this node, clear selection
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
        {/* Expand/collapse toggle */}
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

        {/* Label */}
        <span className="truncate flex-1 leading-5">
          {node.name || node.type}
        </span>

        {/* Action icons — visible on hover or selection */}
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

function IfcTreePanel() {
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

// ─── Payment tree (groups payment items by category) ─────────────────────────

function PaymentTree() {
  const paymentItems = useViewerStore((s) => s.paymentItems);
  const selectedIds = useViewerStore((s) => s.selectedIds);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const tree = useMemo(() => {
    const t: Record<string, typeof paymentItems> = {};
    for (const item of paymentItems) {
      if (
        query &&
        !item.category.toLowerCase().includes(query.toLowerCase()) &&
        !item.modelName.toLowerCase().includes(query.toLowerCase())
      )
        continue;
      t[item.category] ??= [];
      t[item.category].push(item);
    }
    return t;
  }, [paymentItems, query]);

  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="flex flex-col gap-2 h-full">
      <Input
        placeholder="Search payment items…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 text-xs bg-background border-border"
      />
      <ScrollArea className="flex-1 -mx-2">
        <div className="px-2 text-xs font-mono">
          {Object.entries(tree).map(([category, items]) => {
            const cKey = `cat:${category}`;
            const cOpen = open[cKey] ?? true;
            const attachedCount = items.reduce(
              (acc, i) => acc + i.attachedElementIds.length,
              0,
            );
            return (
              <div key={category} className="mb-1">
                <button
                  onClick={() => toggle(cKey)}
                  className="flex items-center gap-1 w-full py-1 hover:text-foreground text-muted-foreground"
                >
                  {cOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    {category}
                  </span>
                  {attachedCount > 0 && (
                    <span className="ml-auto text-[9px] text-primary tabular-nums">
                      {attachedCount} el.
                    </span>
                  )}
                </button>

                {cOpen &&
                  items.map((item) => {
                    const attached = item.attachedElementIds.length;
                    const hasSelected = item.attachedElementIds.some((id) =>
                      selectedIds.has(id),
                    );
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "ml-3 pl-2 py-1 rounded text-[11px] truncate cursor-pointer",
                          hasSelected
                            ? "text-(--status-selected)"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                        )}
                        onClick={async () => {
                          const {
                            _highlighter: highlighter,
                            _activeModelId: activeModelId,
                            selectMany,
                          } = useViewerStore.getState();
                          if (
                            !highlighter ||
                            !activeModelId ||
                            item.attachedElementIds.length === 0
                          )
                            return;
                          const ids = new Set(
                            item.attachedElementIds.map(Number),
                          );
                          const modelIdMap = { [activeModelId]: ids };
                          await highlighter.clear("select");
                          await highlighter.highlightByID(
                            "select",
                            modelIdMap,
                            false,
                            false,
                          );
                          selectMany(item.attachedElementIds);
                        }}
                      >
                        <div className="truncate">
                          {item.category} — {item.modelName}
                        </div>
                        <div className="text-[9px] opacity-60 tabular-nums">
                          {attached} element{attached !== 1 ? "s" : ""} attached
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
          {Object.keys(tree).length === 0 && (
            <div className="text-[11px] text-muted-foreground py-4 text-center">
              No payment items found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Legend panel ─────────────────────────────────────────────────────────────

function LegendPanel() {
  const colorByStatus = useViewerStore((s) => s.colorByStatus);

  const statusItems = [
    { label: "Approved", bg: "var(--status-approved)" },
    { label: "Submitted", bg: "var(--status-submitted)" },
    { label: "Rejected", bg: "var(--status-rejected)" },
    { label: "Unclaimed", bg: "var(--status-neutral)" },
    { label: "Selected", bg: "var(--status-selected)" },
  ];

  return (
    <div className="space-y-4 text-xs">
      <div>
        <div
          className="text-[10px] uppercase tracking-wider mb-2"
          style={{ color: "var(--viewer-panel-border)" }}
        >
          Claim status colours
        </div>
        <div className="space-y-2">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ background: item.bg }}
              />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="pt-3 border-t text-[10px] text-muted-foreground leading-relaxed space-y-1"
        style={{ borderColor: "var(--viewer-panel-border)" }}
      >
        <div>Click element → select</div>
        <div>Shift / Ctrl + click → multi-select</div>
        <div>Right panel → attach to payment</div>
      </div>

      {!colorByStatus && (
        <div
          className="text-[10px] text-muted-foreground italic pt-2 border-t"
          style={{ borderColor: "var(--viewer-panel-border)" }}
        >
          Enable "Color by claim" in toolbar to see claim status colours
        </div>
      )}
    </div>
  );
}

// ─── Left panel ───────────────────────────────────────────────────────────────

export function LeftPanel() {
  return (
    <aside
      className="w-64 flex flex-col shrink-0 border-r"
      style={{
        background: "var(--viewer-panel)",
        borderColor: "var(--viewer-panel-border)",
      }}
    >
      <Tabs defaultValue="ifc" className="flex flex-col h-full">
        <TabsList
          className="grid grid-cols-3 m-2 h-8"
          style={{ background: "oklch(1 0 0 / 5%)" }}
        >
          <TabsTrigger
            value="ifc"
            className="text-xs gap-1 data-[state=active]:bg-accent data-[state=active]:text-foreground"
          >
            <Trees className="h-3.5 w-3.5" />
            IFC
          </TabsTrigger>
          <TabsTrigger
            value="tree"
            className="text-xs gap-1 data-[state=active]:bg-accent data-[state=active]:text-foreground"
          >
            <ListTree className="h-3.5 w-3.5" />
            Pay
          </TabsTrigger>
          <TabsTrigger
            value="legend"
            className="text-xs gap-1 data-[state=active]:bg-accent data-[state=active]:text-foreground"
          >
            <Layers className="h-3.5 w-3.5" />
            Legend
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="ifc"
          className="flex-1 overflow-hidden px-3 pb-3 mt-0"
        >
          <IfcTreePanel />
        </TabsContent>

        <TabsContent
          value="tree"
          className="flex-1 overflow-hidden px-3 pb-3 mt-0"
        >
          <PaymentTree />
        </TabsContent>

        <TabsContent value="legend" className="px-3 pb-3 mt-0">
          <LegendPanel />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
