import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";

export default function CustomSlider({ brushSize, setBrushSize, min = 1, max = 20 }) {
  const sliderRef = useRef(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  // Assume handle width is 24px (w-6 in Tailwind is typically 1.5rem, or about 24px)
  const handleWidth = 24; 
  // Motion value for the handle's x-position
  const x = useMotionValue(0);

  // Measure slider width and set initial handle position on mount
  useEffect(() => {
    if (sliderRef.current) {
      const width = sliderRef.current.offsetWidth;
      setSliderWidth(width);
      // Calculate initial x position for the handle
      const initX = ((brushSize - min) / (max - min)) * (width - handleWidth);
      x.set(initX);
    }
  }, [sliderRef, brushSize, min, max, x]);

  // Update brush size based on a given clientX (from drag or click)
  const updateBrushSize = (clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    let relativeX = clientX - rect.left;
    // Clamp relativeX between 0 and the max allowed position
    relativeX = Math.max(0, Math.min(relativeX, sliderWidth - handleWidth));
    // Map the relative position back to brush size
    const newBrushSize = min + (relativeX / (sliderWidth - handleWidth)) * (max - min);
    setBrushSize(Math.round(newBrushSize));
  };

  // Update brush size continuously while dragging
  const handleDrag = (event, info) => {
    updateBrushSize(info.point.x);
  };

  // Update brush size when drag ends (for final adjustments)
  const handleDragEnd = (event, info) => {
    updateBrushSize(info.point.x);
  };

  // Clicking on the track updates the brush size immediately
  const handleClick = (e) => {
    updateBrushSize(e.clientX);
  };

  // Update the handle's position when brushSize changes externally
  useEffect(() => {
    if (sliderWidth) {
      const newX = ((brushSize - min) / (max - min)) * (sliderWidth - handleWidth);
      x.set(newX);
    }
  }, [brushSize, sliderWidth, min, max, x]);

  return (
    <div
      ref={sliderRef}
      onClick={handleClick}
      className="relative w-64 h-4 bg-gray-300 rounded-full overflow-hidden shadow-inner"
    >
      {/* Animated fill bar */}
      <motion.div
        className="absolute top-0 left-0 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
        style={{ width: x }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      {/* Draggable handle */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: sliderWidth - handleWidth }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="absolute w-6 h-4 bg-white border border-gray-400 rounded-full shadow-md cursor-pointer"
      />
    </div>
  );
}
