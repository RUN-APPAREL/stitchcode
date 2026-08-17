/**
 * Bundled high-contrast sample mark — a bolt on a dark rounded square.
 * Lets people try the logo weave instantly without finding an image.
 *
 * Carries explicit width/height (not just a viewBox) so every browser
 * reports real intrinsic dimensions when it's rasterised onto the module
 * grid (Safari returns 0×0 for viewBox-only SVGs).
 */
export const SAMPLE_LOGO_URL =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#141412"/><path fill="#fff" d="M78 12 36 70h22L46 116l46-62H68l10-42z"/></svg>`,
  );
