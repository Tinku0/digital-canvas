import { useRef, useState, useEffect } from "react";
import AnimatedSlider from "./AnimatedSlider";

export default function DigitalArtCanvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [mode, setMode] = useState("draw"); // "draw" | "erase" | "rectangle" | "circle"
  const [startPos, setStartPos] = useState(null);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Setup canvas on mount and when window resizes
  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, []);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    // Set canvas to 80% width and 60% height of window
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
    // Optionally, restore the latest history state if available
    if (history.length) {
      restoreCanvas(history[history.length - 1]);
    }
  };

  // Save current canvas state into history
  const saveHistory = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    if (history.length === 0 || history[history.length - 1] !== imageData) {
      setHistory(prev => [...prev, imageData]);
      setRedoStack([]); // Clear redo stack when a new action occurs
    }
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      const lastState = newHistory.pop(); // remove the current state
      setRedoStack(prev => [lastState, ...redoStack]);
      setHistory(newHistory);
      restoreCanvas(newHistory[newHistory.length - 1]);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setHistory(prev => [...prev, nextState]);
      setRedoStack(redoStack.slice(1));
      restoreCanvas(nextState);
    }
  };

  const restoreCanvas = (imageData) => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      const canvas = canvasRef.current;
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      ctxRef.current.drawImage(img, 0, 0);
    };
  };

  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    // Save current state before drawing
    saveHistory();
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

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e);
    if (mode === "draw") {
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
    } else if (mode === "erase") {
      // Clear a small rectangle centered on the cursor for erasing
      ctxRef.current.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
  };

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
    // Save state after finishing drawing
    saveHistory();
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen py-10 px-4">
      <h1 className="text-3xl font-bold mb-5">🎨 Digital Art Canvas</h1>
      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="w-10 h-10 border"
        />
        <AnimatedSlider brushSize={brushSize} setBrushSize={setBrushSize} />
        <button onClick={undo} className="px-4 py-2 bg-yellow-500 text-white rounded">
          Undo
        </button>
        <button onClick={redo} className="px-4 py-2 bg-gray-500 text-white rounded">
          Redo
        </button>
        <button
          onClick={() => setMode("draw")}
          className={`px-4 py-2 rounded ${mode === "draw" ? "bg-blue-700" : "bg-blue-500"} text-white`}
        >
          Draw
        </button>
        <button
          onClick={() => setMode("erase")}
          className={`px-4 py-2 rounded ${mode === "erase" ? "bg-red-700" : "bg-red-500"} text-white`}
        >
          Eraser
        </button>
        <button
          onClick={() => setMode("rectangle")}
          className={`px-4 py-2 rounded ${mode === "rectangle" ? "bg-green-700" : "bg-green-500"} text-white`}
        >
          Rectangle
        </button>
        <button
          onClick={() => setMode("circle")}
          className={`px-4 py-2 rounded ${mode === "circle" ? "bg-purple-700" : "bg-purple-500"} text-white`}
        >
          Circle
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="rounded-lg bg-white shadow-lg"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </div>
  );
}
