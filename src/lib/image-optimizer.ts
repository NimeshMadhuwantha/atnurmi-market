const MAX_INPUT_BYTES = 1_000_000;
const TARGET_BYTES = 200_000;

export async function optimizeArtworkImage(file: File): Promise<File> {
  if (file.size > MAX_INPUT_BYTES) throw new Error("Image must be 1 MB or smaller.");
  if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
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
  while (blob && blob.size > TARGET_BYTES && quality >= .42);
  if (!blob) throw new Error("The image could not be optimized.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
}

