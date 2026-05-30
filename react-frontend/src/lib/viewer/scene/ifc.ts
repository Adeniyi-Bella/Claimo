import * as OBC from "@thatopen/components";
import type { ViewerModelRecord } from "../model";
import { convertSpatialStructureToIfcTree, type IfcTreeNode } from "../tree";
import type { ViewerRuntime } from "./bootstrap";
import { loadModelFile, saveModelFile } from "@/lib/model-storage";
import { ModelApi } from "@/api/model.api";

export interface LoadedIfcViewerData {
  ifcTree: IfcTreeNode[];
  groundElevation: number;
  fragmentBuffer: ArrayBuffer;
  localProperties: any | null;
}

export function applyGroundElevation(
  components: OBC.Components,
  groundElevation: number,
): void {
  components.get(OBC.Grids).list.forEach((grid) => {
    grid.three.position.y = groundElevation;
  });
}

async function alignGridsToGroundFloor(
  components: OBC.Components,
  loadedModel: any,
): Promise<number> {
  const storeys = await loadedModel.getItemsOfCategories([/BUILDINGSTOREY/]);
  const localIds = Object.values(storeys).flat();
  const data = await loadedModel.getItemsData(localIds);

  let groundElevation = 0;
  let lowestElevation = Infinity;

  for (const attributes of data) {
    if (!("Elevation" in attributes && "value" in attributes.Elevation)) {
      continue;
    }
    if (attributes.Elevation.value < lowestElevation) {
      lowestElevation = attributes.Elevation.value;
    }
  }

  if (lowestElevation !== Infinity) {
    const [, coordHeight] = await loadedModel.getCoordinates();
    groundElevation = lowestElevation + coordHeight;
  }

  applyGroundElevation(components, groundElevation);
  return groundElevation;
}

export async function loadIfcViewerModel({
  runtime,
  model,
  projectId,
  getToken,
}: {
  runtime: ViewerRuntime;
  model: ViewerModelRecord;
  projectId: string;
  getToken: () => Promise<string | null>;
}): Promise<LoadedIfcViewerData | null> {
  const ifcLoader = runtime.components.get(OBC.IfcLoader);

  await ifcLoader.setup({
    autoSetWasm: false,
    wasm: {
      path: "https://unpkg.com/web-ifc@0.0.77/",
      absolute: true,
    },
  });

  // Try IndexedDB first
  let buffer = await loadModelFile(model.id);

  if (!buffer) {
    console.log(
      `Model ${model.id} not in IndexedDB, downloading from server...`,
    );

    const token = await getToken();
    if (!token) {
      console.error("No active session");
      return null;
    }

    buffer = await ModelApi.downloadModel(token, projectId, model.id);
    await saveModelFile(model.id, buffer);
    console.log(`Model ${model.id} cached in IndexedDB`);
  }

  const data = new Uint8Array(buffer);
  await ifcLoader.load(data, true, model.id, {
    processData: {
      progressCallback: (progress: number) => {
        console.log(`IFC conversion: ${Math.round(progress * 100)}%`);
      },
    },
  });

  const loadedModel = runtime.fragments.list.get(model.id);
  if (!loadedModel) {
    return null;
  }

  const groundElevation = await alignGridsToGroundFloor(
    runtime.components,
    loadedModel,
  );
  const fragmentBuffer = await loadedModel.getBuffer(false);
  const localProperties =
    typeof (loadedModel as any).getLocalProperties === "function"
      ? (loadedModel as any).getLocalProperties()
      : null;

  const spatialStructure = await loadedModel.getSpatialStructure();
  return {
    ifcTree: convertSpatialStructureToIfcTree(spatialStructure, model.id),
    groundElevation,
    fragmentBuffer,
    localProperties,
  };
}
