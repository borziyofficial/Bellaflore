// ==================================================
// SECTION: Admin — fast photo crop utility
// РАЗДЕЛ: Обрезка фото 4:5 для быстрого режима
// ==================================================

export async function cropImageToPortraitBlob(
  imageUrl: string,
  aspectRatio = 4 / 5,
): Promise<Blob> {
  const image = await loadImage(imageUrl);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  let cropWidth = sourceWidth;
  let cropHeight = Math.round(sourceWidth / aspectRatio);

  if (cropHeight > sourceHeight) {
    cropHeight = sourceHeight;
    cropWidth = Math.round(sourceHeight * aspectRatio);
  }

  const cropX = Math.round((sourceWidth - cropWidth) / 2);
  const cropY = Math.round((sourceHeight - cropHeight) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas недоступен.");
  }

  context.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Не удалось обрезать изображение."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось загрузить изображение."));
    image.src = url;
  });
}
