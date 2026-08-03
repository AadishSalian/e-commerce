'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/lib/mockData';
import { Maximize2, RotateCcw, Box } from 'lucide-react';
import ModelViewerWrapper from './ModelViewerWrapper';

type ProductViewerProps = {
  product: Product;
};

export default function ProductViewer({ product }: ProductViewerProps) {
  const images = product.images || (product.hoverImage ? [product.image, product.hoverImage] : [product.image]);
  const has360 = product.spinImages && product.spinImages.length > 0;

  const [activeIndex, setActiveIndex] = useState(0);
  const [is360Mode, setIs360Mode] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [spinIndex, setSpinIndex] = useState(0);

  // Zoom state
  const [isHovering, setIsHovering] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState('0% 0%');
  const imageRef = useRef<HTMLDivElement>(null);

  // 360 Spin state
  const dragContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (is360Mode || !imageRef.current) return;
    
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setBackgroundPosition(`${x}% ${y}%`);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!is360Mode) return;
    setIsDragging(true);
    setStartX(e.clientX);
    dragContainerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !is360Mode || !product.spinImages) return;
    
    const deltaX = e.clientX - startX;
    // Sensitivity: how many pixels to drag to change one frame
    const sensitivity = 5;
    
    if (Math.abs(deltaX) > sensitivity) {
      let change = deltaX > 0 ? -1 : 1;
      let newIndex = (spinIndex + change) % product.spinImages.length;
      if (newIndex < 0) newIndex = product.spinImages.length - 1;
      
      setSpinIndex(newIndex);
      setStartX(e.clientX); // reset start for continuous drag
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!is360Mode) return;
    setIsDragging(false);
    dragContainerRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 h-full">
      {/* Thumbnail Filmstrip */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto w-full lg:w-24 shrink-0 pb-2 lg:pb-0 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
        {product.modelUrl && (
          <button
            onClick={() => { setIs3DMode(true); setIs360Mode(false); }}
            className={`w-20 h-20 lg:w-full lg:h-24 shrink-0 rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center gap-1 transition-colors ${is3DMode ? 'border-accent text-accent bg-accent/5' : 'border-border text-text-muted hover:border-text-muted'}`}
          >
            <Box size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">3D / AR View</span>
          </button>
        )}
        {has360 && (
          <button
            onClick={() => { setIs360Mode(true); setIs3DMode(false); }}
            className={`w-20 h-20 lg:w-full lg:h-24 shrink-0 rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center gap-1 transition-colors ${is360Mode ? 'border-accent text-accent bg-accent/5' : 'border-border text-text-muted hover:border-text-muted'}`}
          >
            <RotateCcw size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">360° View</span>
          </button>
        )}
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => {
              setActiveIndex(idx);
              setIs360Mode(false);
              setIs3DMode(false);
            }}
            className={`w-20 h-20 lg:w-full lg:h-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${!is360Mode && !is3DMode && activeIndex === idx ? 'border-accent opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main Viewer area */}
      <div className="relative w-full aspect-square lg:aspect-[4/5] bg-surface rounded-2xl overflow-hidden border border-border">
        <AnimatePresence mode="wait">
          {is3DMode && product.modelUrl ? (
            <motion.div
              key="3d-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-surface"
            >
              <ModelViewerWrapper 
                src={product.modelUrl} 
                iosSrc={product.iosModelUrl} 
                alt={product.name} 
              />
            </motion.div>
          ) : is360Mode && product.spinImages ? (
            <motion.div
              key="360-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 select-none"
              style={{
                cursor: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'/><path d='M3 3v5h5'/></svg>") 16 16, ew-resize`
              }}
              ref={dragContainerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <img 
                src={product.spinImages[spinIndex]} 
                alt="360 view" 
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-lg pointer-events-none text-sm font-medium">
                <RotateCcw size={16} className="text-foreground" />
                <span className="text-foreground">Drag to Rotate</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`image-${activeIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
              style={{
                cursor: isHovering ? 'crosshair' : `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/><line x1='11' y1='8' x2='11' y2='14'/><line x1='8' y1='11' x2='14' y2='11'/></svg>") 16 16, zoom-in`
              }}
              ref={imageRef}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setIsHovering(!isHovering)} // Toggle for mobile/click
            >
              {/* Normal Image */}
              <img 
                src={images[activeIndex]} 
                alt={product.name} 
                className={`w-full h-full object-cover transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-100'}`} 
              />
              
              {/* Zoomed Image Overlay */}
              <div 
                className={`absolute inset-0 w-full h-full bg-no-repeat transition-opacity duration-300 pointer-events-none ${isHovering ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  backgroundImage: `url(${images[activeIndex]})`,
                  backgroundPosition: backgroundPosition,
                  backgroundSize: '250%', // Magnification level
                }}
              />
              
              {!isHovering && (
                <div className="absolute top-4 right-4 p-2 bg-background/50 backdrop-blur-md rounded-full pointer-events-none text-text-muted">
                  <Maximize2 size={20} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
