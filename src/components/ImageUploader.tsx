import { useState } from 'react';

interface ImageUploaderProps {
  onImagesSet: (images: string[]) => void;
  defaultImages: string[];
}

export function ImageUploader({ onImagesSet, defaultImages }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(defaultImages);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImages = [...images];
      newImages[index] = event.target?.result as string;
      setImages(newImages);
      onImagesSet(newImages);
      
      // Save to localStorage
      localStorage.setItem('watermelon-custom-images', JSON.stringify(newImages));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-5 gap-2 p-4 bg-white rounded-lg shadow-md">
      {images.map((img, index) => (
        <div key={index} className="relative">
          <img 
            src={img || `https://via.placeholder.com/50?text=${index + 1}`}
            alt={`Fruit ${index + 1}`}
            className="w-12 h-12 rounded-full object-cover"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, index)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      ))}
    </div>
  );
}