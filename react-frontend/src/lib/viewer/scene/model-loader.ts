import { loadFragmentCache, saveFragmentCache } from "../cache";
import type { ViewerModelRecord } from "../model";
import type { ViewerRuntime } from "./bootstrap";
import {
  applyGroundElevation,
  loadIfcViewerModel,
  type LoadedIfcViewerData,
} from "./ifc";

export async function loadViewerModelIntoRuntime({
  runtime,
  model,
  onTree,
}: {
  runtime: ViewerRuntime;
  model: ViewerModelRecord;
  onTree: (
    modelId: string,
    tree: LoadedIfcViewerData["ifcTree"],
  ) => void;
}): Promise<boolean> {
  const cached = await loadFragmentCache(model.id);
  if (cached) {
    const loadedModel = await runtime.fragments.core.load(
      new Uint8Array(cached.fragmentBuffer),
      {
        modelId: model.id,
      },
    );

    if (
      loadedModel &&
      cached.localProperties &&
      typeof (loadedModel as any).setLocalProperties === "function"
    ) {
      (loadedModel as any).setLocalProperties(cached.localProperties);
    }

    applyGroundElevation(runtime.components, cached.groundElevation);
    onTree(model.id, cached.ifcTree);
    return true;
  }

  const loaded = await loadIfcViewerModel({ runtime, model });
  if (!loaded) return false;

  await saveFragmentCache(model.id, {
    fragmentBuffer: loaded.fragmentBuffer,
    localProperties: loaded.localProperties,
    ifcTree: loaded.ifcTree,
    groundElevation: loaded.groundElevation,
  });
  onTree(model.id, loaded.ifcTree);
  return true;
}
