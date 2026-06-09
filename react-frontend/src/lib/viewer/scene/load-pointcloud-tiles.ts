import { TilesRenderer } from "3d-tiles-renderer";
import {
  CesiumIonAuthPlugin,
  GLTFExtensionsPlugin,
  ReorientationPlugin,
} from "3d-tiles-renderer/plugins";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { Object3D } from "three";
import type { ViewerRuntime } from "./bootstrap";

export interface CesiumIonConfig {
  apiToken: string;
  assetId: string;
  onLoaded?: () => void;
}

export function loadCesiumIonTiles(
  runtime: ViewerRuntime,
  config: CesiumIonConfig,
): TilesRenderer {
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
  scene.add(tiles.group);

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
  });

  tiles.addEventListener("load-model", ({ scene }: { scene: Object3D }) => {
    scene.traverse((obj: any) => {
      if (obj.isPoints && obj.material) {
        obj.material.size = 0.02;
      }
    });
  });

  // Hook into existing camera controls update
  world.camera.controls.addEventListener("update", () => {
    camera.updateMatrixWorld();
    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);
    tiles.update();
  });

  return tiles;
}

export function disposeCesiumIonTiles(
  runtime: ViewerRuntime,
  tiles: TilesRenderer,
): void {
  runtime.world.scene.three.remove(tiles.group);
  tiles.dispose();
}
