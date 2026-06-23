import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

function getImageExtension(file: File): string | null {
  const extensionFromType = ALLOWED_IMAGE_TYPES.get(file.type);
  if (extensionFromType) {
    return extensionFromType;
  }

  const extensionFromName = extname(file.name).toLowerCase();
  return Array.from(ALLOWED_IMAGE_TYPES.values()).includes(extensionFromName)
    ? extensionFromName
    : null;
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { message: "Invalid upload request." },
      { status: 400 },
    );
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return Response.json({ message: "Image file is required." }, { status: 400 });
  }

  if (image.size <= 0) {
    return Response.json({ message: "Image file is empty." }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return Response.json(
      { message: "Image file is too large." },
      { status: 413 },
    );
  }

  const extension = getImageExtension(image);
  if (!extension) {
    return Response.json(
      { message: "Unsupported image type." },
      { status: 415 },
    );
  }

  const filename = `${randomUUID()}${extension}`;
  const uploadDirectory = join(process.cwd(), "public", "uploads", "products");
  const destinationPath = join(uploadDirectory, filename);
  const imageBytes = Buffer.from(await image.arrayBuffer());

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(destinationPath, imageBytes);

  return Response.json({
    filename,
    imageUrl: `/uploads/products/${filename}`,
  });
}

