import { TilesRenderer } from "3d-tiles-renderer";
import {
  CesiumIonAuthPlugin,
  GLTFExtensionsPlugin,
  ReorientationPlugin,
} from "3d-tiles-renderer/plugins";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { Group, Object3D } from "three";
import type { ViewerRuntime } from "./bootstrap";

export interface CesiumIonConfig {
  apiToken: string;
  assetId: string;
  onLoaded?: () => void;
  onError?: (error: unknown) => void;
}

export interface CesiumIonTilesHandle {
  tiles: TilesRenderer;
  transformRoot: Group;
  dispose: () => void;
}

export function loadCesiumIonTiles(
  runtime: ViewerRuntime,
  config: CesiumIonConfig,
): CesiumIonTilesHandle {
  const { world } = runtime;
  const scene = world.scene.three;
  const renderer = world.renderer!.three;
  const camera = world.camera.threePersp;

  console.log("[CesiumIon] Loading tiles with config:", config);

  const tiles = new TilesRenderer();

  tiles.registerPlugin(
    new CesiumIonAuthPlugin({
      apiToken: config.apiToken,
      assetId: config.assetId,
      autoRefreshToken: true,
    }),
  );

  tiles.registerPlugin(
    new GLTFExtensionsPlugin({
      dracoLoader: new DRACOLoader().setDecoderPath(
        "https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/",
      ),
    }),
  );

  tiles.registerPlugin(new ReorientationPlugin({ recenter: true }));

  tiles.fetchOptions.mode = "cors";
  const transformRoot = new Group();
  transformRoot.name = "CesiumIon.TransformRoot";
  scene.add(transformRoot);
  transformRoot.add(tiles.group);

  camera.updateMatrixWorld();
  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, renderer);
  tiles.update();

  tiles.addEventListener("load-root-tileset", () => {
    void world.camera.controls.setLookAt(12, 6, 12, 0, 0, 0, true);

    config.onLoaded?.();
  });

  tiles.addEventListener("load-error", (e: any) => {
    console.error("[CesiumIon] load error", e);
    config.onError?.(e);
  });

  tiles.addEventListener("load-model", ({ scene }: { scene: Object3D }) => {
    scene.traverse((obj: any) => {
      if (obj.isPoints && obj.material) {
        obj.material.size = 0.02;
      }
    });
  });

  // Keep the tileset in sync with the viewer camera.
  const handleCameraUpdate = () => {
    camera.updateMatrixWorld();
    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);
    tiles.update();
  };

  world.camera.controls.addEventListener("update", handleCameraUpdate);

  return {
    tiles,
    transformRoot,
    dispose: () => {
      world.camera.controls.removeEventListener("update", handleCameraUpdate);
      transformRoot.remove(tiles.group);
      runtime.world.scene.three.remove(transformRoot);
      tiles.dispose();
    },
  };
}

export function disposeCesiumIonTiles(
  handle: CesiumIonTilesHandle,
): void {
  handle.dispose();
}
