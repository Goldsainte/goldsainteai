const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
}

type RGB = { r: number; g: number; b: number };

function sampleBorderColor(data: Uint8ClampedArray, width: number, height: number): RGB {
  const samples: RGB[] = [];
  const stepX = Math.max(1, Math.floor(width / 50));
  const stepY = Math.max(1, Math.floor(height / 50));

  for (let x = 0; x < width; x += stepX) {
    const topIndex = (x * 4);
    const bottomIndex = ((height - 1) * width + x) * 4;
    samples.push({ r: data[topIndex], g: data[topIndex + 1], b: data[topIndex + 2] });
    samples.push({ r: data[bottomIndex], g: data[bottomIndex + 1], b: data[bottomIndex + 2] });
  }

  for (let y = 0; y < height; y += stepY) {
    const leftIndex = (y * width) * 4;
    const rightIndex = (y * width + (width - 1)) * 4;
    samples.push({ r: data[leftIndex], g: data[leftIndex + 1], b: data[leftIndex + 2] });
    samples.push({ r: data[rightIndex], g: data[rightIndex + 1], b: data[rightIndex + 2] });
  }

  const total = samples.reduce<RGB>((acc, value) => ({
    r: acc.r + value.r,
    g: acc.g + value.g,
    b: acc.b + value.b,
  }), { r: 0, g: 0, b: 0 });

  const count = samples.length || 1;
  return {
    r: total.r / count,
    g: total.g / count,
    b: total.b / count,
  };
}

function colorDistance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function applyMask(imageData: ImageData, background: RGB): ImageData {
  const output = new ImageData(imageData.width, imageData.height);
  const threshold = 40; // Empirical threshold suitable for most studio-style backgrounds

  for (let i = 0; i < imageData.data.length; i += 4) {
    const current: RGB = {
      r: imageData.data[i],
      g: imageData.data[i + 1],
      b: imageData.data[i + 2],
    };

    const distance = colorDistance(current, background);
    output.data[i] = current.r;
    output.data[i + 1] = current.g;
    output.data[i + 2] = current.b;
    output.data[i + 3] = distance > threshold ? imageData.data[i + 3] : 0;
  }

  return output;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  resizeImageIfNeeded(canvas, ctx, imageElement);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const backgroundColor = sampleBorderColor(imageData.data, canvas.width, canvas.height);
  const maskedImage = applyMask(imageData, backgroundColor);

  ctx.putImageData(maskedImage, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, 'image/png', 1.0);
  });
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
