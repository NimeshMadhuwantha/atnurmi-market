const MAX_INPUT_BYTES = 1_000_000;
const TARGET_BYTES = 90_000;

async function optimize(file: File, maxDimension: number, targetBytes: number): Promise<File> {
  if (file.size > MAX_INPUT_BYTES) throw new Error("Image must be 1 MB or smaller.");
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Image processing is not available in this browser.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = .82;
  let blob: Blob | null = null;
  do { blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality)); quality -= .08; }
  while (blob && blob.size > targetBytes && quality >= .34);
  if (!blob || blob.size > targetBytes) throw new Error("This image is too complex to store safely. Choose a smaller image.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
}

export async function optimizeArtworkImage(file: File): Promise<File> {
  return optimize(file, 1600, TARGET_BYTES);
}

export async function optimizeThumbnailDataUrl(file: File): Promise<string> {
  const optimized = await optimize(file, 420, 20_000);
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

