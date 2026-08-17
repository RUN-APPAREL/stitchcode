import { useEffect, useRef, useState } from "react";
import { gridDarkFraction, logoRegionModules, logoToGrid, type QRMatrix } from "./qr";

export interface LogoGridState {
  grid: Uint8Array | null;
  /** grid resolution in modules */
  n: number;
  /** human-readable diagnostic when the mark can't produce a visible merge */
  warning: string | null;
}

/**
 * Rasterises the uploaded logo into a binary module grid sized to the
 * current code. Re-runs whenever the image, code size, merge size,
 * threshold, dither mode or background colour changes.
 *
 * A monotonically increasing request id guards against out-of-order
 * resolutions: if a newer rasterisation is requested before an older one
 * finishes, the stale result is discarded.
 */
export function useLogoGrid(
  logo: string | null,
  matrix: QRMatrix | null,
  scale: number,
  threshold: number,
  dither: boolean,
  bg: string,
): LogoGridState {
  const [state, setState] = useState<LogoGridState>({ grid: null, n: 0, warning: null });
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    if (!logo || !matrix) {
      setState({ grid: null, n: 0, warning: null });
      return;
    }
    const n = logoRegionModules(matrix.size, scale);
    logoToGrid(logo, n, threshold, bg, dither)
      .then((grid) => {
        if (reqId.current !== id) return;
        /*
         * An all-light grid merges to pure field colour — the mark would be
         * invisible. Surface a diagnostic instead of failing silently.
         */
        const frac = gridDarkFraction(grid);
        const warning =
          frac < 0.02
            ? "No ink detected — the mark reads as white or transparent against the field. Use a darker image, or lower the ink threshold."
            : null;
        setState({ grid, n, warning });
      })
      .catch(() => {
        if (reqId.current === id)
          setState({
            grid: null,
            n: 0,
            warning: "That image couldn't be read — try a PNG, JPG or SVG file.",
          });
      });
  }, [logo, matrix, scale, threshold, dither, bg]);

  return state;
}
