import { section } from "framer-motion/client";
import React from "react";

const presetColors = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#4F46E5",
  "#10B981",
];

export default function FancyColorPicker({ color, setColor }) {
  return (
    <section className="flex gap-3">
      <div className="flex flex-row lg:flex-col items-center lg:item-center gap-3">
        <div className="flex gap-2">
          {presetColors.slice(0, 4)?.map((preset) => (
            <div
              key={preset}
              onClick={() => setColor(preset)}
              className={`w-4 h-4 rounded-full cursor-pointer border-2 transition-all hover:scale-105 ${
                color === preset ? "border-gray-800" : "border-transparent"
              }`}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {presetColors.slice(5, 9)?.map((preset) => (
            <div
              key={preset}
              onClick={() => setColor(preset)}
              className={`w-4 h-4 rounded-full cursor-pointer border-2 transition-all hover:scale-105 ${
                color === preset ? "border-gray-800" : "border-transparent"
              }`}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
      </div>
      {/* Custom color input */}
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-10 h-10 p-0 border-none rounded-lg cursor-pointer"
      />
    </section>
  );
}
