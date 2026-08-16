import { useEffect, useState } from "react";
import { logoRegionModules, logoToGrid, type QRMatrix } from "./qr";

export interface LogoGridState {
  grid: Uint8Array | null;
  /** grid resolution in modules */
  n: number;
}

/**
 * Rasterises the uploaded logo into a binary module grid sized to the
 * current code. Re-runs whenever the image, code size, merge size,
 * threshold or background colour changes.
 */
export function useLogoGrid(
  logo: string | null,
  matrix: QRMatrix | null,
  scale: number,
  threshold: number,
  bg: string,
): LogoGridState {
  const [state, setState] = useState<LogoGridState>({ grid: null, n: 0 });

  useEffect(() => {
    let live = true;
    if (!logo || !matrix) {
      setState({ grid: null, n: 0 });
      return;
    }
    const n = logoRegionModules(matrix.size, scale);
    logoToGrid(logo, n, threshold, bg)
      .then((grid) => {
        if (live) setState({ grid, n });
      })
      .catch(() => {
        if (live) setState({ grid: null, n: 0 });
      });
    return () => {
      live = false;
    };
  }, [logo, matrix, scale, threshold, bg]);

  return state;
}
