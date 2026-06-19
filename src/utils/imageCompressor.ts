/**
 * Utility for client-side image compression and resizing using HTML5 Canvas
 * to stay safely within Firestore's 1MB document size limit, improve load performance,
 * and reduce local/session storage footprint.
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresses an uploaded image File and returns a JPEG Base64 Data URL.
 */
export function compressImageFile(
  file: File,
  { maxWidth = 900, maxHeight = 900, quality = 0.75 }: CompressionOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to highly-compressed JPEG format
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.error("Canvas draw and output failed, using fallback:", err);
          resolve(event.target?.result as string);
        }
      };
      
      img.onerror = (err) => {
        console.error("Image loading failed:", err);
        reject(err);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => {
      console.error("FileReader failed:", err);
      reject(err);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Defensively resizes / compresses any existing oversized JPEG/PNG Base64 string.
 * Skip if it's already a standard URL (like Unsplash) or already small enough (< 200KB).
 */
export function compressBase64Image(
  base64Str: string,
  { maxWidth = 900, maxHeight = 900, quality = 0.75 }: CompressionOptions = {}
): Promise<string> {
  // If it's not a local Data URL, it's a remote image link - leave it exactly as-is
  if (!base64Str || !base64Str.startsWith("data:image/")) {
    return Promise.resolve(base64Str);
  }

  // If the base64 string is already compact (roughly < 200KB / 200,000 chars),
  // skip compression to avoid unnecessary loss of quality.
  if (base64Str.length < 200000) {
    return Promise.resolve(base64Str);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (err) {
        console.warn("Base64 defensive resize failed, returning original:", err);
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      resolve(base64Str);
    };

    img.src = base64Str;
  });
}
