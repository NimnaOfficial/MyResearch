export const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
  const image = new Image();
  image.src = imageSrc;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Wait for image to load to grab original dimensions
  await new Promise((resolve) => (image.onload = resolve));

  // Set canvas to the exact size of the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the sliced region
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg'); // Standardized format for cloud uploads
  });
};