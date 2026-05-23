import type { IfcTreeNode } from "./state/types";

const DB_NAME = "claimo:viewer-cache";
const STORE = "fragments";
const VERSION = 1;
const CACHE_SCHEMA_VERSION = 1;

export interface ViewerFragmentCacheEntry {
  schemaVersion: number;
  fragmentBuffer: ArrayBuffer;
  localProperties: any | null;
  ifcTree: IfcTreeNode[];
  groundElevation: number;
  updatedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadFragmentCache(
  modelId: string,
): Promise<ViewerFragmentCacheEntry | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(modelId);
    req.onsuccess = () => {
      const result = req.result as ViewerFragmentCacheEntry | undefined;
      if (!result || result.schemaVersion !== CACHE_SCHEMA_VERSION) {
        resolve(null);
        return;
      }
      resolve(result);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveFragmentCache(
  modelId: string,
  entry: Omit<ViewerFragmentCacheEntry, "schemaVersion" | "updatedAt">,
) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(
      {
        ...entry,
        schemaVersion: CACHE_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
      },
      modelId,
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFragmentCache(modelId: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(modelId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
