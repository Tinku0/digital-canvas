import { useRef, useState, useEffect } from "react";
import AnimatedSlider from "./AnimatedSlider";
import FancyColorPicker from "./FancyColorPicker";
import { FaUndo, FaRedo, FaPencilAlt, FaEraser, FaSquare, FaCircle, FaFileExport } from "react-icons/fa";

export default function DigitalArtCanvas() {
  // Refs for canvas and its context
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const overlayRef = useRef(null);

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
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    // Create an overlay canvas for previews
    const overlay = document.createElement("canvas");
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.position = "absolute";
    overlay.style.top = `${canvas.offsetTop}px`;
    overlay.style.left = `${canvas.offsetLeft}px`;
    overlay.style.pointerEvents = "none"; // Don't interfere with main canvas events

    document.body.appendChild(overlay);
    overlayRef.current = overlay;
  };

  // Save the current canvas state into history
  const saveHistory = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    if (history.length === 0 || history[history.length - 1] !== imageData) {
      setHistory((prev) => [...prev, imageData]);
      setRedoStack([]); // Clear redo stack on new action
    }
  };

  // Undo function: restores the previous state
  const undo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      const lastState = newHistory.pop();
      setRedoStack((prev) => [lastState, ...redoStack]);
      setHistory(newHistory);
      restoreCanvas(newHistory[newHistory.length - 1]);
    }
  };

  // Redo function: reapplies an undone action
  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setHistory((prev) => [...prev, nextState]);
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

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e);

    if (mode === "draw") {
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
    } else if (mode === "erase") {
      ctxRef.current.clearRect(
        x - brushSize / 2,
        y - brushSize / 2,
        brushSize,
        brushSize
      );
    } else if (mode === "rectangle" || mode === "circle") {
      const overlayCtx = overlayRef.current.getContext("2d");
      overlayCtx.clearRect(
        0,
        0,
        overlayRef.current.width,
        overlayRef.current.height
      );

      overlayCtx.strokeStyle = brushColor;
      overlayCtx.lineWidth = brushSize;

      const width = x - startPos.x;
      const height = y - startPos.y;

      if (mode === "rectangle") {
        overlayCtx.strokeRect(startPos.x, startPos.y, width, height);
      } else if (mode === "circle") {
        const radius = Math.sqrt(width ** 2 + height ** 2);
        overlayCtx.beginPath();
        overlayCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        overlayCtx.stroke();
      }
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const { x, y } = getCanvasCoordinates(e);
    if (!startPos) return; // Ensure startPos is defined before using it

    const width = x !== null ? x - startPos.x : 0;
    const height = y !== null ? y - startPos.y : 0;

    const ctx = ctxRef.current;

    if (mode === "rectangle") {
      ctx.strokeRect(startPos.x, startPos.y, width, height);
    } else if (mode === "circle") {
      const radius = Math.sqrt(width ** 2 + height ** 2);
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    overlayRef.current
      .getContext("2d")
      .clearRect(0, 0, overlayRef.current.width, overlayRef.current.height); // Clear overlay after committing
    setStartPos(null);
    saveHistory();
  };

  const exportAsPNG = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
  
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "digital_art.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Floating header with tools */}
      <header className="fixed top-0 left-0 w-full z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="w-full mx-auto flex gap-2 flex-col lg:flex-row justify-between items-start lg:items-center px-4 py-3">
          <h1 className="text-xl font-bold text-gray-700">Canvas</h1>
          <div className="flex flex-wrap gap-2 items-center justify-start lg:justify-center">
            {/* <button
              onClick={undo}
              className="px-3 py-2 bg-yellow-500 hover:bg-yellow-300 text-white rounded cursor-pointer"
            >
              Undo
            </button>
            <button
              onClick={redo}
              className="px-3 py-2 bg-gray-500 text-white rounded cursor-pointer"
            >
              Redo
            </button>
            <button
              onClick={() => setMode("draw")}
              className={`px-3 py-2 rounded ${
                mode === "draw" ? "bg-blue-700" : "bg-blue-500"
              } text-white cursor-pointer`}
            >
              Draw
            </button>
            <button
              onClick={() => setMode("erase")}
              className={`px-3 py-2 rounded ${
                mode === "erase" ? "bg-red-700" : "bg-red-500"
              } text-white cursor-pointer`}
            >
              Eraser
            </button>
            <button
              onClick={() => setMode("rectangle")}
              className={`px-3 py-2 rounded ${
                mode === "rectangle" ? "bg-green-700" : "bg-green-500"
              } text-white cursor-pointer`}
            >
              Rectangle
            </button>
            <button
              onClick={() => setMode("circle")}
              className={`px-3 py-2 rounded ${
                mode === "circle" ? "bg-purple-700" : "bg-purple-500"
              } text-white cursor-pointer`}
            >
              Circle
            </button>
            <button
              onClick={exportAsPNG}
              className="px-3 py-2 bg-green-600 text-white rounded cursor-pointer"
            >
              Export PNG
            </button> */}
            <button
              onClick={undo}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 transition cursor-pointer"
              title="Undo"
            >
              <FaUndo className="text-yellow-300" />
            </button>
            <button
              onClick={redo}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 transition cursor-pointer"
              title="Redo"
            >
              <FaRedo className="text-gray-300" />
            </button>
            <button
              onClick={() => setMode("draw")}
              className={`p-2 rounded transition cursor-pointer ${
                mode === "draw"
                  ? "bg-blue-900"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title="Draw"
            >
              <FaPencilAlt className="text-blue-400" />
            </button>
            <button
              onClick={() => setMode("erase")}
              className={`p-2 rounded transition cursor-pointer ${
                mode === "erase"
                  ? "bg-red-900"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title="Eraser"
            >
              <FaEraser className="text-red-400" />
            </button>
            <button
              onClick={() => setMode("rectangle")}
              className={`p-2 rounded transition cursor-pointer ${
                mode === "rectangle"
                  ? "bg-green-900"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title="Rectangle"
            >
              <FaSquare className="text-green-400" />
            </button>
            <button
              onClick={() => setMode("circle")}
              className={`p-2 rounded transition cursor-pointer ${
                mode === "circle"
                  ? "bg-purple-900"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title="Circle"
            >
              <FaCircle className="text-purple-400" />
            </button>
            <button
              onClick={exportAsPNG}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 transition cursor-pointer"
              title="Export PNG"
            >
              <FaFileExport className="text-green-400" />
            </button>
          </div>

          <FancyColorPicker color={brushColor} setColor={setBrushColor} />
          <AnimatedSlider
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            min={1}
            max={20}
          />
        </div>
      </header>

      {/* Canvas container with top padding to avoid header overlap */}
      <div className="pt-[230px] lg:pt-20 flex justify-center">
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
