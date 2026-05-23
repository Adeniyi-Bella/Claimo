import { useViewerRuntime } from "./useViewerRuntime";
import { useViewerSettings } from "./useViewerSettings";
import { useViewerSession } from "./useViewerSession";
import { useViewerStore } from "../state/store";

export function useModelViewer() {
  const session = useViewerSession();
  const settings = useViewerSettings();
  const runtime = useViewerRuntime(session.models, settings.canvasBackground);
  const modelName = useViewerStore((state) => state.modelName);

  return {
    ...session,
    ...runtime,
    ...settings,
    modelName,
  };
}
