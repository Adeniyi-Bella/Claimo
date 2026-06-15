import { useRef, useState } from "react";
import { useEffect } from "react";
import { RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import * as THREE from "three";

import type { ViewerRuntime } from "../../scene/bootstrap";
import {
  disposeCesiumIonTiles,
  loadCesiumIonTiles,
  type CesiumIonTilesHandle,
} from "../../scene/load-pointcloud-tiles";
import { useViewerStore } from "../../state/store";

interface Transform {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
}
const DEFAULT_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  z: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
};

const AXIS_COLOR: Record<"x" | "y" | "z", string> = {
  x: "text-red-400 border-red-400/30",
  y: "text-green-400 border-green-400/30",
  z: "text-blue-400 border-blue-400/30",
};

// Conversion factors → meters (canonical storage unit)
const POS_UNITS = {
  m: 1,
  cm: 0.01,
  mm: 0.001,
  ft: 0.3048,
  in: 0.0254,
} as const;
type PosUnit = keyof typeof POS_UNITS;

// Conversion factors → degrees (canonical storage unit)
const ROT_UNITS = { "°": 1, rad: 180 / Math.PI } as const;
type RotUnit = keyof typeof ROT_UNITS;

interface CesiumIonPanelProps {
  runtime: ViewerRuntime | null;
}

export default function CesiumIonPanel({ runtime }: CesiumIonPanelProps) {
  const [apiToken, setApiToken] = useState("");
  const [assetId, setAssetId] = useState("");
  const [tilesHandle, setTilesHandle] = useState<CesiumIonTilesHandle | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [posUnit, setPosUnit] = useState<PosUnit>("m");
  const [rotUnit, setRotUnit] = useState<RotUnit>("°");
  const setTilesLoading = useViewerStore((s) => s.setTilesLoading);

  const handleLoad = () => {
    if (!runtime) return setError("Viewer runtime is not ready yet.");
    if (!apiToken.trim() || !assetId.trim())
      return setError("Both API token and Asset ID are required.");
    if (tilesHandle) {
      disposeCesiumIonTiles(tilesHandle);
      setTilesHandle(null);
    }
    try {
      setTilesLoading(true);
      let active: CesiumIonTilesHandle | null = null;
      const t = loadCesiumIonTiles(runtime, {
        apiToken,
        assetId,
        onLoaded: () => setTilesLoading(false),
        onError: (e) => {
          setTilesLoading(false);
          setError(e instanceof Error ? e.message : "Failed to load tiles.");
          if (active) {
            disposeCesiumIonTiles(active);
            active = null;
            setTilesHandle(null);
          }
        },
      });
      active = t;
      setTilesHandle(t);
      setError(null);
    } catch (e: any) {
      setTilesLoading(false);
      setError(e?.message || "Failed to load tiles.");
    }
  };

  const handleUnload = () => {
    if (runtime && tilesHandle) {
      disposeCesiumIonTiles(tilesHandle);
      setTilesHandle(null);
      setTilesLoading(false);
    }
  };

  useEffect(() => {
    if (!tilesHandle) return;

    const root = tilesHandle.transformRoot;
    root.position.set(transform.x, transform.y, transform.z);
    root.rotation.set(
      THREE.MathUtils.degToRad(transform.rotX),
      THREE.MathUtils.degToRad(transform.rotY),
      THREE.MathUtils.degToRad(transform.rotZ),
    );
    root.updateMatrixWorld(true);
    tilesHandle.tiles.update();
  }, [tilesHandle, transform]);

  const setField = (k: keyof Transform, v: number) => {
    const next = { ...transform, [k]: v };
    setTransform(next);
    // runtime?.setPointCloudTransform(next);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Credentials */}
      <div>
        <div className="text-sm font-semibold mb-2">
          Point Cloud · Cesium Ion
        </div>
        <div className="space-y-2">
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="API token"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="Asset ID (e.g. 40866)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleLoad}
            disabled={!runtime}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {tilesHandle ? "Reload" : runtime ? "Load" : "Initializing…"}
          </button>
          {tilesHandle && (
            <button
              onClick={handleUnload}
              className="h-8 px-3 rounded-md border border-border text-xs hover:bg-accent transition"
            >
              Unload
            </button>
          )}
        </div>
      </div>

      {/* ── Transform ── */}
      <div className="rounded-lg border border-border bg-card/40 p-3 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Transform
          </span>
          <button
            onClick={() => setTransform(DEFAULT_TRANSFORM)}
            title="Reset transform"
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {/* Position */}
        <AxisGroup
          label="Position"
          unit={posUnit}
          unitOptions={Object.keys(POS_UNITS) as PosUnit[]}
          onUnitChange={(u) => setPosUnit(u as PosUnit)}
          step={posUnit === "mm" ? 1 : posUnit === "cm" ? 0.5 : 0.1}
          factor={POS_UNITS[posUnit]}
          rows={[
            { axis: "x", value: transform.x, set: (v) => setField("x", v) },
            { axis: "y", value: transform.y, set: (v) => setField("y", v) },
            { axis: "z", value: transform.z, set: (v) => setField("z", v) },
          ]}
        />

        {/* Rotation */}
        <AxisGroup
          label="Rotation"
          unit={rotUnit}
          unitOptions={Object.keys(ROT_UNITS) as RotUnit[]}
          onUnitChange={(u) => setRotUnit(u as RotUnit)}
          step={rotUnit === "rad" ? 0.01 : 0.5}
          factor={ROT_UNITS[rotUnit]}
          rows={[
            {
              axis: "x",
              value: transform.rotX,
              set: (v) => setField("rotX", v),
            },
            {
              axis: "y",
              value: transform.rotY,
              set: (v) => setField("rotY", v),
            },
            {
              axis: "z",
              value: transform.rotZ,
              set: (v) => setField("rotZ", v),
            },
          ]}
        />
      </div>
    </div>
  );
}

function AxisGroup({
  label,
  unit,
  unitOptions,
  onUnitChange,
  step,
  factor,
  rows,
}: {
  label: string;
  unit: string;
  unitOptions: string[];
  onUnitChange: (u: string) => void;
  step: number;
  factor: number; // multiplier: canonical = displayed * factor
  rows: Array<{
    axis: "x" | "y" | "z";
    value: number;
    set: (v: number) => void;
  }>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground/80">{label}</p>
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
          className="h-6 rounded border border-border bg-background px-1.5 text-xs text-muted-foreground hover:text-foreground focus:outline-none"
        >
          {unitOptions.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        {rows.map(({ axis, value, set }) => (
          <AxisField
            key={axis}
            axis={axis}
            value={value / factor}
            step={step}
            unit={unit}
            onChange={(displayed) => set(displayed * factor)}
          />
        ))}
      </div>
    </div>
  );
}

function AxisField({
  axis,
  value,
  step,
  unit,
  onChange,
}: {
  axis: "x" | "y" | "z";
  value: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const holdRef = useRef<number | null>(null);

  const bump = (dir: 1 | -1) => onChange(+(value + dir * step).toFixed(4));
  const startHold = (dir: 1 | -1) => {
    bump(dir);
    let delay = 350;
    const tick = () => {
      bump(dir);
      delay = Math.max(40, delay * 0.85);
      holdRef.current = window.setTimeout(tick, delay);
    };
    holdRef.current = window.setTimeout(tick, delay);
  };
  const stopHold = () => {
    if (holdRef.current) {
      clearTimeout(holdRef.current);
      holdRef.current = null;
    }
  };

  return (
    <div
      className={`flex items-stretch rounded-md border bg-background ${AXIS_COLOR[axis]}`}
    >
      <div className="w-7 flex items-center justify-center font-mono text-[11px] font-bold uppercase select-none">
        {axis}
      </div>
      <input
        type="number"
        step={step}
        value={Number(value.toFixed(4))}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-1 min-w-0 bg-transparent px-2 py-1 text-xs text-right tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="flex items-center pr-1 text-[10px] text-muted-foreground select-none">
        {unit}
      </span>
      <div className="flex flex-col border-l border-border/60">
        <button
          type="button"
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          className="flex-1 px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition"
          aria-label={`Increase ${axis}`}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          className="flex-1 px-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition border-t border-border/60"
          aria-label={`Decrease ${axis}`}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
