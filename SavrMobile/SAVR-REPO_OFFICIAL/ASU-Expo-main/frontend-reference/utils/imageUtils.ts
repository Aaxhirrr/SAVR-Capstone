/**
 * Compress an image file using canvas-based resizing and JPEG encoding.
 * Shared between ChatPage and OnboardingChat.
 */
export const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => {
      reject(err);
    };
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.floor(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.floor(width * (maxHeight / height));
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
      const outputType = 'image/jpeg';
      const attemptEmit = (b: Blob | null, suffix: string) => {
        if (b) {
          const base = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
          const outName = `${base}${suffix}.jpg`;
          const compressedFile = new File([b], outName, { type: outputType });
          resolve(compressedFile);
        } else {
          reject(new Error('Compression failed'));
        }
      };

      // First pass encode
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Compression failed'));
          return;
        }
        // If still large (> ~900KB), try a lower quality
        if (blob.size > 900 * 1024) {
          canvas.toBlob((blob2) => {
            if (!blob2) {
              attemptEmit(blob, '-q70');
              return;
            }
            if (blob2.size > 900 * 1024) {
              // Scale down dimensions by 20% and encode again at 0.6
              const w2 = Math.floor(width * 0.8);
              const h2 = Math.floor(height * 0.8);
              canvas.width = w2;
              canvas.height = h2;
              if (ctx) {
                ctx.drawImage(img, 0, 0, w2, h2);
              }
              canvas.toBlob((blob3) => {
                attemptEmit(blob3 || blob2, '-q60-0_8x');
              }, outputType, 0.6);
            } else {
              attemptEmit(blob2, '-q60');
            }
          }, outputType, 0.6);
        } else {
          attemptEmit(blob, '');
        }
      }, outputType, quality);
    };
    reader.readAsDataURL(file);
  });
};
