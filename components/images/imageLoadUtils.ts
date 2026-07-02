export function shouldUseUnoptimizedImage(url: string): boolean {
  return (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.includes("blob.vercel-storage.com")
  );
}
