import React, { useRef, useEffect, useState } from "react";
import Enviroment from "./models/enviroment/core"; // Supondo que o arquivo com a classe Enviroment esteja localizado no mesmo diretório
import "./App.css"; // Supondo que o arquivo com a classe Enviroment esteja localizado no mesmo diretório

const App: React.FC = () => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let simulation: Enviroment | null = null;

  if (canvas) {
    simulation = new Enviroment(canvas);
  }
  useEffect(() => {
    simulation?.resizeCanvas();
    setCanvas(canvasRef.current);
    return () => {
      simulation = null;
    };
  }, [canvasRef.current]);

  return (
    <div className="relative bg-black">
      <canvas ref={canvasRef} className="w-full h-full canvas"></canvas>
    </div>
  );
};

export default App;
