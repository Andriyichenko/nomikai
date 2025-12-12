"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((src, index) => (
          <div 
            key={index}
            onClick={() => openLightbox(index)}
            className={cn(
              "relative overflow-hidden rounded-xl cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300",
              // First image takes 2 columns on large screens if there are enough images
              index === 0 && images.length >= 3 ? "md:col-span-2 lg:col-span-2 aspect-[16/9]" : "aspect-[4/3]"
            )}
          >
            <Image 
              src={src} 
              alt={`Gallery Image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="text-white w-8 h-8 drop-shadow-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
            onClick={closeLightbox}
        >
            {/* Close Button */}
            <button 
                onClick={closeLightbox}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
            >
                <X size={24} />
            </button>

            {/* Navigation */}
            {images.length > 1 && (
                <>
                    <button 
                        onClick={prevImage}
                        className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button 
                        onClick={nextImage}
                        className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                    >
                        <ChevronRight size={32} />
                    </button>
                </>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full max-w-5xl max-h-[85vh] p-4">
                <Image 
                    src={images[selectedIndex]}
                    alt="Lightbox"
                    fill
                    className="object-contain"
                    priority
                />
                <div className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm font-medium bg-black/50 py-2 rounded-full mx-auto w-fit px-4 backdrop-blur-md">
                    {selectedIndex + 1} / {images.length}
                </div>
            </div>
        </div>
      )}
    </>
  );
}
