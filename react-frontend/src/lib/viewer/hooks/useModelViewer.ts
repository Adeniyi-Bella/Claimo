import { useViewerRuntime } from "./useViewerRuntime";
import { useViewerSettings } from "./useViewerSettings";
import { useViewerSession } from "./useViewerSession";

export function useModelViewer() {
  const session = useViewerSession();
  const settings = useViewerSettings();
  const runtime = useViewerRuntime(session.model, settings.canvasBackground);

  return {
    ...session,
    ...runtime,
    ...settings,
  };
}
