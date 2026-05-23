import { useMemo } from "react";
import { useViewerStore } from "../state/store";

const BACKGROUND_DARK = "#111827";
const BACKGROUND_LIGHT = "#f8fafc";

export function useViewerSettings() {
  const showEdges = useViewerStore((state) => state.showEdges);
  const colorByStatus = useViewerStore((state) => state.colorByStatus);
  const backgroundDark = useViewerStore((state) => state.backgroundDark);
  const setShowEdges = useViewerStore((state) => state.setShowEdges);
  const setColorByStatus = useViewerStore((state) => state.setColorByStatus);
  const toggleBackground = useViewerStore((state) => state.toggleBackground);

  const canvasBackground = backgroundDark ? BACKGROUND_DARK : BACKGROUND_LIGHT;

  return useMemo(
    () => ({
      showEdges,
      colorByStatus,
      backgroundDark,
      canvasBackground,
      setShowEdges,
      setColorByStatus,
      toggleBackground,
    }),
    [
      showEdges,
      colorByStatus,
      backgroundDark,
      canvasBackground,
      setShowEdges,
      setColorByStatus,
      toggleBackground,
    ],
  );
}
