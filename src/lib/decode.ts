/**
 * Lazy-loaded QR decoder. jsQR (~45 KB) is imported dynamically so it never
 * sits on the critical path — the studio paints instantly and the "we scanned
 * it for you" test loads the decoder on first use.
 */
export async function decodeQR(image: ImageData): Promise<string | null> {
  const { default: jsQR } = await import("jsqr");
  const res = jsQR(image.data, image.width, image.height);
  return res ? res.data : null;
}
