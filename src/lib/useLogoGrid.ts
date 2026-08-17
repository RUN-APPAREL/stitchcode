import { useEffect, useRef, useState } from "react";
import { gridDarkFraction, logoRegionModules, logoToGrid, type LogoEdge, type QRMatrix } from "./qr";

export interface LogoGridState {
  grid: Uint8Array | null;
  /** region width in modules */
  n: number;
  /** sub-pixels per module inside `grid` (stitch: 3, inlay: 1) */
  res: number;
  /** diagnostic message when the mark can't produce a usable merge */
  warning: string | null;
}

export interface LogoGridParams {
  scale: number;
  threshold: number;
  edge: LogoEdge;
  bg: string;
  mode: "stitch" | "inlay";
  brightness: number;
  contrast: number;
}

const IDLE: LogoGridState = { grid: null, n: 0, res: 1, warning: null };

/**
 * Rasterises the uploaded logo into a binary grid sized to the current code.
 * "Stitch" mode rasterises at 3× the module grid (sub-module halftone);
 * "inlay" works at module resolution. Re-runs whenever any input changes.
 *
 * A monotonically increasing request id guards against out-of-order
 * resolutions: if a newer rasterisation is requested before an older one
 * finishes, the stale result is discarded.
 */
export function useLogoGrid(
  logo: string | null,
  matrix: QRMatrix | null,
  p: LogoGridParams,
): LogoGridState {
  const [state, setState] = useState<LogoGridState>(IDLE);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    if (!logo || !matrix) {
      setState(IDLE);
      return;
    }
    const n = logoRegionModules(matrix.size, p.scale, p.mode === "stitch" ? 1 : 0.5);
    const res = p.mode === "stitch" ? 3 : 1;
    logoToGrid(logo, n, p.threshold, p.bg, p.edge, {
      res,
      brightness: p.brightness,
      contrast: p.contrast,
    })
      .then((grid) => {
        if (reqId.current !== id) return;
        const dark = gridDarkFraction(grid);
        setState({
          grid,
          n,
          res,
          warning:
            dark < 0.02
              ? "This mark reads as almost white at the current settings — it will be invisible in the code. Try a darker image, or lower the ink threshold and brightness."
              : null,
        });
      })
      .catch(() => {
        if (reqId.current === id)
          setState({
            ...IDLE,
            warning: "Couldn't read that image file — try a different PNG or SVG.",
          });
      });
  }, [logo, matrix, p.scale, p.threshold, p.edge, p.bg, p.mode, p.brightness, p.contrast]);

  return state;
}
