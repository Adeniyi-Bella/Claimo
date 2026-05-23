import type { PointerEvent as ReactPointerEvent } from "react";

export const VIEWER_PANEL_COLLAPSED_WIDTH = 44;
export const VIEWER_PANEL_MIN_WIDTH = 240;
export const VIEWER_PANEL_MAX_WIDTH = 560;
export const VIEWER_LEFT_PANEL_DEFAULT_WIDTH = 256;
export const VIEWER_RIGHT_PANEL_DEFAULT_WIDTH = 320;

export function clampPanelWidth(width: number, min: number, max: number) {
  return Math.min(Math.max(width, min), max);
}

export function startPanelResize(
  event: ReactPointerEvent<HTMLDivElement>,
  params: {
    side: "left" | "right";
    panel: HTMLDivElement;
    startWidth: number;
    minWidth: number;
    maxWidth: number;
    onCommit: (width: number) => void;
  },
) {
  if (event.button !== 0) return;

  event.preventDefault();
  const startX = event.clientX;
  const previousCursor = document.body.style.cursor;
  const previousUserSelect = document.body.style.userSelect;
  const previousWidth = params.panel.style.width;
  let finished = false;
  let lastWidth = params.startWidth;
  let rafId: number | null = null;

  const cleanup = () => {
    if (finished) return;
    finished = true;
    document.removeEventListener("pointermove", handleMove);
    document.removeEventListener("pointerup", cleanup);
    document.removeEventListener("pointercancel", cleanup);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    document.body.style.cursor = previousCursor;
    document.body.style.userSelect = previousUserSelect;
    params.onCommit(lastWidth);
  };

  const handleMove = (moveEvent: PointerEvent) => {
    const delta = moveEvent.clientX - startX;
    const nextWidth =
      params.side === "left"
        ? params.startWidth + delta
        : params.startWidth - delta;
    lastWidth = clampPanelWidth(nextWidth, params.minWidth, params.maxWidth);
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      params.panel.style.width = `${lastWidth}px`;
    });
  };

  params.panel.style.width = previousWidth || `${params.startWidth}px`;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
  document.addEventListener("pointermove", handleMove);
  document.addEventListener("pointerup", cleanup);
  document.addEventListener("pointercancel", cleanup);
}
