import { useRef, useState, useEffect } from "react";
import AnimatedSlider from "./AnimatedSlider";
import FancyColorPicker from "./FancyColorPicker";

export default function DigitalArtCanvas() {
  // Refs for canvas and its context
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // States for drawing, tools, and history
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [mode, setMode] = useState("draw"); // "draw", "erase", "rectangle", "circle"
  const [startPos, setStartPos] = useState(null);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Setup the canvas on mount and handle window resize
  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, []);

  // Initialize canvas dimensions and context
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
    // Optionally restore the latest state if available
    if (history.length) {
      restoreCanvas(history[history.length - 1]);
    }
  };

  // Save the current canvas state into history
  const saveHistory = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    if (history.length === 0 || history[history.length - 1] !== imageData) {
      setHistory(prev => [...prev, imageData]);
      setRedoStack([]); // Clear redo stack on new action
    }
  };

  // Undo function: restores the previous state
  const undo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      const lastState = newHistory.pop();
      setRedoStack(prev => [lastState, ...redoStack]);
      setHistory(newHistory);
      restoreCanvas(newHistory[newHistory.length - 1]);
    }
  };

  // Redo function: reapplies an undone action
  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setHistory(prev => [...prev, nextState]);
      setRedoStack(redoStack.slice(1));
      restoreCanvas(nextState);
    }
  };

  // Restore canvas state from saved image data
  const restoreCanvas = (imageData) => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      const canvas = canvasRef.current;
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      ctxRef.current.drawImage(img, 0, 0);
    };
  };

  // Get mouse coordinates relative to the canvas
  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Begin drawing
  const startDrawing = (e) => {
    saveHistory(); // Save current state before starting new drawing
    const { x, y } = getCanvasCoordinates(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    ctxRef.current.strokeStyle = brushColor;
    ctxRef.current.lineWidth = brushSize;
    setIsDrawing(true);
    if (mode === "rectangle" || mode === "circle") {
      setStartPos({ x, y });
    }
  };

  // Continue drawing on mouse move
  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e);
    if (mode === "draw") {
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
    } else if (mode === "erase") {
      // Eraser: clear a rectangle centered on the cursor
      ctxRef.current.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
  };

  // Finish drawing and save the state
  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const { x, y } = getCanvasCoordinates(e);
    if (mode === "rectangle" || mode === "circle") {
      if (!startPos) return;
      const width = x - startPos.x;
      const height = y - startPos.y;
      if (mode === "rectangle") {
        ctxRef.current.strokeRect(startPos.x, startPos.y, width, height);
      } else if (mode === "circle") {
        const radius = Math.sqrt(width ** 2 + height ** 2);
        ctxRef.current.beginPath();
        ctxRef.current.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctxRef.current.stroke();
      }
      setStartPos(null);
    }
    saveHistory();
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Floating header with tools */}
      <header className="fixed top-0 left-0 w-full z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="w-full mx-auto flex gap-2 flex-col lg:flex-row justify-between items-start lg:items-center px-4 py-3">
          <h1 className="text-xl font-bold text-gray-700">Canvas</h1>
          <div className="flex gap-2 items-center">
            <button onClick={undo} className="px-3 py-2 bg-yellow-500 text-white rounded">Undo</button>
            <button onClick={redo} className="px-3 py-2 bg-gray-500 text-white rounded">Redo</button>
            <button onClick={() => setMode("draw")} className={`px-3 py-2 rounded ${mode === "draw" ? "bg-blue-700" : "bg-blue-500"} text-white`}>Draw</button>
            <button onClick={() => setMode("erase")} className={`px-3 py-2 rounded ${mode === "erase" ? "bg-red-700" : "bg-red-500"} text-white`}>Eraser</button>
            <button onClick={() => setMode("rectangle")} className={`px-3 py-2 rounded ${mode === "rectangle" ? "bg-green-700" : "bg-green-500"} text-white`}>Rectangle</button>
            <button onClick={() => setMode("circle")} className={`px-3 py-2 rounded ${mode === "circle" ? "bg-purple-700" : "bg-purple-500"} text-white`}>Circle</button>
          </div>
          <FancyColorPicker color={brushColor} setColor={setBrushColor} />
          <AnimatedSlider brushSize={brushSize} setBrushSize={setBrushSize} min={1} max={20} />
        </div>
      </header>

      {/* Canvas container with top padding to avoid header overlap */}
      <div className="pt-[200px] lg:pt-20 flex justify-center">
        <canvas
          ref={canvasRef}
          className="rounded-lg bg-white shadow-lg"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
        />
      </div>
    </div>
  );
}
