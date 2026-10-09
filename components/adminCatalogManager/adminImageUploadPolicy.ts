/** Files at or under this size can be posted to the same-origin upload route.
 * Vercel rejects larger function bodies, so bigger photos stay on the direct
 * blob upload and surface that error if it fails. */
export const SERVER_UPLOAD_FALLBACK_MAX_BYTES = 4 * 1024 * 1024;

export function canFallbackProductImageUpload(size: number): boolean {
  return size > 0 && size <= SERVER_UPLOAD_FALLBACK_MAX_BYTES;
}
