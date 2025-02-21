import { useState, useEffect } from "react";

export function useImagePreloader(imageUrls: string[], threshold: number = 20) {
  const [loadedImages, setLoadedImages] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    const urls = imageUrls.slice(0, threshold);
    let loaded = 0;

    urls.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        setLoadedImages(loaded);
        if (loaded === urls.length) {
          setIsPreloaded(true);
        }
      };
      img.onerror = () => {
        loaded++;
        setLoadedImages(loaded);
        if (loaded === urls.length) {
          setIsPreloaded(true);
        }
      };
      img.src = url;
    });
  }, [imageUrls, threshold]);

  return { isPreloaded, loadedImages };
}
