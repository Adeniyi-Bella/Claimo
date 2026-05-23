import type { IfcTreeNode, PaymentItemLocal } from "./types";

export function getElementPaymentMap(
  items: PaymentItemLocal[],
): Map<string, PaymentItemLocal> {
  const map = new Map<string, PaymentItemLocal>();
  for (const p of items) {
    for (const id of p.attachedElementIds) map.set(id, p);
  }
  return map;
}

export function collectNodeIds(node: IfcTreeNode): number[] {
  const ids: number[] = [node.localId];
  for (const child of node.children) {
    ids.push(...collectNodeIds(child));
  }
  return ids;
}
