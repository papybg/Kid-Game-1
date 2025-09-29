// Практическа функция за изрязване и преоразмеряване на изображение в браузъра
export const cropAndResizeImage = (
  file: File,
  targetWidth: number,
  aspectRatio: number // напр. 16/9, 4/3, 1/1 за квадрат
): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const targetHeight = targetWidth / aspectRatio;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const originalAspectRatio = img.width / img.height;
      let sWidth = img.width;
      let sHeight = img.height;
      let sx = 0;
      let sy = 0;

      if (originalAspectRatio > aspectRatio) {
        sWidth = img.height * aspectRatio;
        sx = (img.width - sWidth) / 2;
      } else if (originalAspectRatio < aspectRatio) {
        sHeight = img.width / aspectRatio;
        sy = (img.height - sHeight) / 2;
      }
      
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => resolve(blob), "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Файлът не може да бъде прочетен."));
    };

    img.src = objectUrl;
  });
};
