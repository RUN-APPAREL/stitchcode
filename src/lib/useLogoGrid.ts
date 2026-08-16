import { useEffect, useRef, useState } from "react";
import { logoRegionModules, logoToGrid, type QRMatrix } from "./qr";

export interface LogoGridState {
  grid: Uint8Array | null;
  /** grid resolution in modules */
  n: number;
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
  const [state, setState] = useState<LogoGridState>({ grid: null, n: 0 });
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    if (!logo || !matrix) {
      setState({ grid: null, n: 0 });
      return;
    }
    const n = logoRegionModules(matrix.size, scale);
    logoToGrid(logo, n, threshold, bg, dither)
      .then((grid) => {
        if (reqId.current === id) setState({ grid, n });
      })
      .catch(() => {
        if (reqId.current === id) setState({ grid: null, n: 0 });
      });
  }, [logo, matrix, scale, threshold, dither, bg]);

  return state;
}
