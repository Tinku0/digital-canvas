import { useRef, useState, useEffect } from "react";

export default function DigitalArtCanvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [mode, setMode] = useState("draw"); // draw | erase | rectangle | circle
  const [layers, setLayers] = useState([]);
  const [activeLayer, setActiveLayer] = useState(0);
  const [startPos, setStartPos] = useState(null);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    setupCanvas();
  }, [activeLayer]);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
    if (layers[activeLayer]) {
      const img = new Image();
      img.src = layers[activeLayer];
      img.onload = () => ctx.drawImage(img, 0, 0);
    }
  };

  const saveLayer = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    
    // Prevent duplicate saves (check if the last history entry is the same)
    if (history.length === 0 || history[history.length - 1] !== imageData) {
      setHistory((prev) => [...prev, imageData]);
      setRedoStack([]); // Clear redo when new action occurs
    }
  };
  
  

  const undo = () => {
    if (history.length > 1) {
      const lastState = history[history.length - 2]; // Always pick the exact previous state
      setRedoStack([history[history.length - 1], ...redoStack]); // Store current state in redo
      setHistory(history.slice(0, -1)); // Remove only one step
      restoreCanvas(lastState);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0]; // Get next redo state
      setHistory([...history, nextState]); // Add back to history
      setRedoStack(redoStack.slice(1)); // Remove from redo stack
      restoreCanvas(nextState);
    }
  };

  const restoreCanvas = (imageData) => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      ctxRef.current.clearRect(0, 0, 800, 500);
      ctxRef.current.drawImage(img, 0, 0);
    };
  };

  const startDrawing = (e) => {
    saveLayer(); // Save current layer before starting a new one
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctxRef.current.strokeStyle = brushColor;
    ctxRef.current.lineWidth = brushSize;
    setIsDrawing(true);
    if (mode === "rectangle" || mode === "circle") {
      setStartPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (mode === "draw") {
      ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctxRef.current.stroke();
    } else if (mode === "erase") {
      ctxRef.current.clearRect(e.nativeEvent.offsetX, e.nativeEvent.offsetY, brushSize, brushSize);
    }
  };

  const stopDrawing = (e) => {
    setIsDrawing(false);
    if (!startPos) return;

    const ctx = ctxRef.current;
    const width = e.nativeEvent.offsetX - startPos.x;
    const height = e.nativeEvent.offsetY - startPos.y;

    if (mode === "rectangle") {
      ctx.strokeRect(startPos.x, startPos.y, width, height);
    } else if (mode === "circle") {
      const radius = Math.sqrt(width ** 2 + height ** 2);
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    saveLayer();
    setStartPos(null);
  };

  const addLayer = () => setLayers([...layers, null]);

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen py-10">
      <h1 className="text-3xl font-bold mb-5">🎨 Digital Art Canvas</h1>
      <div className="flex gap-3 mb-4">
        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-10 h-10 border" />
        <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(e.target.value)} className="w-32" />

        <button onClick={undo} className="px-4 py-2 bg-yellow-500 text-white rounded">Undo</button>
        <button onClick={redo} className="px-4 py-2 bg-gray-500 text-white rounded">Redo</button>

        <button onClick={() => setMode("draw")} className={`px-4 py-2 rounded ${mode === "draw" ? "bg-blue-700" : "bg-blue-500"} text-white`}>Draw</button>
        <button onClick={() => setMode("erase")} className={`px-4 py-2 rounded ${mode === "erase" ? "bg-red-700" : "bg-red-500"} text-white`}>Eraser</button>
        <button onClick={() => setMode("rectangle")} className={`px-4 py-2 rounded ${mode === "rectangle" ? "bg-green-700" : "bg-green-500"} text-white`}>Rectangle</button>
        <button onClick={() => setMode("circle")} className={`px-4 py-2 rounded ${mode === "circle" ? "bg-purple-700" : "bg-purple-500"} text-white`}>Circle</button>
        <button onClick={addLayer} className="px-4 py-2 bg-gray-700 text-white rounded">New Layer</button>
      </div>
      <canvas
        ref={canvasRef}
        className="border bg-white shadow-lg"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
      <div className="mt-4">
        {layers.map((_, index) => (
          <button key={index} onClick={() => setActiveLayer(index)} className={`px-4 py-2 mx-1 rounded ${activeLayer === index ? "bg-yellow-500" : "bg-gray-500"} text-white`}>
            Layer {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
