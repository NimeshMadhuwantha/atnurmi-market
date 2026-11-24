const MAX_INPUT_BYTES = 12_000_000;
const MAX_ARTWORK_INPUT_BYTES = 1_000_000;
const ARTWORK_TARGET_BYTES = 220_000;

async function optimize(file: File, maxDimension: number, targetBytes: number, maxInputBytes = MAX_INPUT_BYTES): Promise<File> {
  if (file.size > maxInputBytes) throw new Error(`Image must be ${maxInputBytes === MAX_ARTWORK_INPUT_BYTES ? "1 MB" : "12 MB"} or smaller.`);
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));

  try {
    for (let resizeAttempt = 0; resizeAttempt < 8; resizeAttempt += 1) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Image processing is not available in this browser.");
      context.drawImage(bitmap, 0, 0, width, height);

      for (let quality = .86; quality >= .3; quality -= .08) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (blob && blob.size <= targetBytes) {
          return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
        }
      }

      width = Math.max(1, Math.round(width * .78));
      height = Math.max(1, Math.round(height * .78));
    }
  } finally {
    bitmap.close();
  }

  throw new Error("This image could not be optimized. Please choose another JPG, PNG, or WebP image.");
}

export async function optimizeArtworkImage(file: File): Promise<File> {
  return optimize(file, 1600, ARTWORK_TARGET_BYTES, MAX_ARTWORK_INPUT_BYTES);
}

export async function optimizeThumbnailDataUrl(file: File): Promise<string> {
  const optimized = await optimize(file, 420, 20_000, MAX_ARTWORK_INPUT_BYTES);
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The thumbnail could not be read."));
    reader.readAsDataURL(optimized);
  });
}

export async function optimizeArtworkDataUrl(file: File): Promise<string> {
  const optimized = await optimizeArtworkImage(file);
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The optimized image could not be read."));
    reader.readAsDataURL(optimized);
  });
}

export async function optimizeProfileDataUrl(file: File): Promise<string> {
  const optimized = await optimize(file, 640, 80_000);
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The profile image could not be read."));
    reader.readAsDataURL(optimized);
  });
}

