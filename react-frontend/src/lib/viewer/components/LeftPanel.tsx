import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/tabs";
import { Layers, ListTree, Trees } from "lucide-react";
import { IfcTreePanel } from "./panels/IfcTreePanel";
import { PaymentTreePanel } from "./panels/PaymentTreePanel";
import { LegendPanel } from "./panels/LegendPanel";

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
          <PaymentTreePanel />
        </TabsContent>

        <TabsContent value="legend" className="px-3 pb-3 mt-0">
          <LegendPanel />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
