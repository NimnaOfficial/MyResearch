export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: any,
  rotation = 0,
  filterStyle = 'none'
): Promise<Blob | null> => {
  const image = new Image();
  image.crossOrigin = 'anonymous'; // Prevents CORS canvas taint when re-editing existing URLs
  image.src = imageSrc;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Wait for image to load to grab original dimensions
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const radians = (rotation * Math.PI) / 180;

  // Calculate bounding box for rotated image
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  // Temporary canvas to handle rotation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = bBoxWidth;
  tempCanvas.height = bBoxHeight;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return null;

  tempCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  tempCtx.rotate(radians);
  tempCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // Set final cropped canvas size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Apply optional cyber visual filters if requested
  if (filterStyle === 'cyber') {
    ctx.filter = 'contrast(120%) saturate(140%) hue-rotate(185deg)';
  } else if (filterStyle === 'matrix') {
    ctx.filter = 'contrast(130%) saturate(160%) hue-rotate(90deg)';
  } else if (filterStyle === 'mono') {
    ctx.filter = 'grayscale(100%) contrast(125%)';
  } else if (filterStyle === 'vibrant') {
    ctx.filter = 'saturate(150%) contrast(110%)';
  }

  // Draw the cropped region from rotated canvas
  ctx.drawImage(
    tempCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
};
