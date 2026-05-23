import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

export interface ViewerRuntime {
  components: OBC.Components;
  world: any;
  camera: OBC.OrthoPerspectiveCamera;
  fragments: OBC.FragmentsManager;
  highlighter: OBCF.Highlighter;
  hider: OBC.Hider;
}

export async function createViewerRuntime(
  container: HTMLDivElement,
): Promise<ViewerRuntime> {
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);
  const world = worlds.create<
    OBC.SimpleScene,
    OBC.OrthoPerspectiveCamera,
    OBC.SimpleRenderer
  >();

  world.scene = new OBC.SimpleScene(components);
  world.scene.setup();
  world.scene.three.background = null;

  world.renderer = new OBC.SimpleRenderer(components, container);
  world.renderer.showLogo = false;

  world.camera = new OBC.OrthoPerspectiveCamera(components);
  await world.camera.controls.setLookAt(12, 6, 12, 0, 0, 0);

  components.init();

  const workerUrl = await OBC.FragmentsManager.getWorker();
  const fragments = components.get(OBC.FragmentsManager);
  fragments.init(workerUrl);

  world.camera.controls.addEventListener("update", () => {
    fragments.core.update();
  });

  components.get(OBC.Grids).create(world);

  const highlighter = components.get(OBCF.Highlighter);
  components.get(OBC.Raycasters).get(world);
  highlighter.setup({ world });
  highlighter.zoomToSelection = true;

  const hider = components.get(OBC.Hider);

  return {
    components,
    world,
    camera: world.camera,
    fragments,
    highlighter,
    hider,
  };
}
