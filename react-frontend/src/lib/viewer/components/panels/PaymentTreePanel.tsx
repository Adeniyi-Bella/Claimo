import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/common/input";
import { ScrollArea } from "@/components/common/scroll-area";
import { cn } from "@/lib/utils/utils";
import { useViewerStore } from "../../state/store";

export function PaymentTreePanel() {
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
