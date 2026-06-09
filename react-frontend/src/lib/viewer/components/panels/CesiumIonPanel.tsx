import { useState } from "react";
import { TilesRenderer } from "3d-tiles-renderer";
import type { ViewerRuntime } from "../../scene/bootstrap";
import {
  disposeCesiumIonTiles,
  loadCesiumIonTiles,
} from "../../scene/load-pointcloud-tiles";
import { useViewerStore } from "../../state/store";

interface CesiumIonPanelProps {
  runtime: ViewerRuntime | null;
}

export default function CesiumIonPanel({ runtime }: CesiumIonPanelProps) {
  const [apiToken, setApiToken] = useState("");
  const [assetId, setAssetId] = useState("");
  const [tiles, setTiles] = useState<TilesRenderer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setTilesLoading = useViewerStore((s) => s.setTilesLoading);

  const handleLoad = () => {
    if (!runtime) {
      setError("Viewer runtime is not ready yet.");
      return;
    }

    if (!apiToken.trim() || !assetId.trim()) {
      setError("Both API token and Asset ID are required.");
      return;
    }

    // Dispose previous tiles if any
    if (tiles) {
      disposeCesiumIonTiles(runtime, tiles);
      setTiles(null);
    }

    try {
      setTilesLoading(true);
      const newTiles = loadCesiumIonTiles(runtime, {
        apiToken,
        assetId,
        onLoaded: () => setTilesLoading(false),
      });
      setTiles(newTiles);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load tiles.");
    }
  };

  const handleUnload = () => {
    if (runtime && tiles) {
      disposeCesiumIonTiles(runtime, tiles);
      setTiles(null);
      setTilesLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm font-semibold">Point Cloud (Cesium Ion)</div>
      <div className="space-y-2">
        <div>
          <label className="text-xs text-muted-foreground">API Token</label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Your Cesium Ion API token"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Asset ID</label>
          <input
            type="text"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="e.g. 40866"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleLoad}
          disabled={!runtime}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition"
        >
          {tiles ? "Reload" : runtime ? "Load" : "Initializing..."}
        </button>
        {tiles && (
          <button
            onClick={handleUnload}
            disabled={!runtime}
            className="h-8 px-3 rounded-md border border-border text-xs hover:bg-accent transition"
          >
            Unload
          </button>
        )}
      </div>
    </div>
  );
}
