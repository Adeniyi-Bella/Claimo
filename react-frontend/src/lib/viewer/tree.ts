import type { IfcTreeNode } from "./state/types";
export type { IfcTreeNode } from "./state/types";

function flattenConvertedNode(
  node: IfcTreeNode | IfcTreeNode[] | null,
): IfcTreeNode[] {
  if (!node) return [];
  return Array.isArray(node) ? node : [node];
}

export function collectNodeIds(node: IfcTreeNode): number[] {
  const ids: number[] = [node.localId];
  for (const child of node.children) {
    ids.push(...collectNodeIds(child));
  }
  return ids;
}

export function convertSpatialStructureToIfcTree(
  spatialStructure: any,
  modelId: string,
): IfcTreeNode[] {
  const convertNode = (
    raw: any,
    inheritedCategory?: string,
  ): IfcTreeNode | IfcTreeNode[] | null => {
    if (raw.localId === null) {
      return (raw.children ?? []).flatMap((child: any) =>
        flattenConvertedNode(convertNode(child, raw.category)),
      );
    }

    return {
      localId: raw.localId,
      expressId: String(raw.localId),
      name: inheritedCategory ?? raw.category ?? String(raw.localId),
      type: inheritedCategory ?? raw.category ?? "",
      modelId,
      children: (raw.children ?? []).flatMap((child: any) =>
        flattenConvertedNode(convertNode(child)),
      ),
    };
  };

  return (spatialStructure?.children ?? []).flatMap((child: any) =>
    flattenConvertedNode(convertNode(child)),
  );
}
