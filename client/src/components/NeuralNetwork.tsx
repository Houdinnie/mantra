import { useEffect, useRef } from "react";

interface NeuralNetworkProps {
  isActive: boolean;
  compact?: boolean;
}

/**
 * Pre-render radial gradient texture for edge pulse particles.
 * Performance Optimization: Prevents invoking `ctx.createRadialGradient()` dozens of
 * times per frame at 60 FPS, eliminating GC pressure and context state overhead.
 */
function createPulseCanvas(): HTMLCanvasElement {
  const pCanvas = document.createElement("canvas");
  pCanvas.width = 16;
  pCanvas.height = 16;
  const pCtx = pCanvas.getContext("2d");
  if (pCtx) {
    const gradient = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)");
    gradient.addColorStop(0.5, "rgba(34, 197, 94, 0.4)");
    gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
    pCtx.fillStyle = gradient;
    pCtx.beginPath();
    pCtx.arc(8, 8, 8, 0, Math.PI * 2);
    pCtx.fill();
  }
  return pCanvas;
}

/**
 * Pre-render radial gradient texture for node halos.
 * Performance Optimization: Reusable offscreen texture scaled and drawn via fast
 * hardware-accelerated `drawImage` blits with dynamic `globalAlpha`.
 */
function createHaloCanvas(): HTMLCanvasElement {
  const hCanvas = document.createElement("canvas");
  hCanvas.width = 20;
  hCanvas.height = 20;
  const hCtx = hCanvas.getContext("2d");
  if (hCtx) {
    const gradient = hCtx.createRadialGradient(10, 10, 0, 10, 10, 10);
    gradient.addColorStop(0, "rgba(34, 197, 94, 0.3)");
    gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
    hCtx.fillStyle = gradient;
    hCtx.beginPath();
    hCtx.arc(10, 10, 10, 0, Math.PI * 2);
    hCtx.fill();
  }
  return hCanvas;
}

export default function NeuralNetwork({ isActive, compact = false }: NeuralNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef({
    nodes: [] as Array<{ x: number; y: number; pulse: number; halo: number }>,
    edges: [] as Array<{ from: number; to: number; progress: number; speed: number }>,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Pre-render static offscreen textures for pulses and halos once on setup
    const pulseCanvas = createPulseCanvas();
    const haloCanvas = createHaloCanvas();

    // Set canvas size with DPR scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Initialize neural network structure
    const layers = compact ? [3, 5, 5, 3] : [4, 6, 6, 4];
    const nodes: Array<{ x: number; y: number; pulse: number; halo: number }> = [];
    const edges: Array<{ from: number; to: number; progress: number; speed: number }> = [];

    // Create nodes
    let nodeIndex = 0;
    const nodesByLayer: number[][] = [];

    layers.forEach((count, layerIdx) => {
      const layerNodes: number[] = [];
      const layerWidth = (width / (layers.length + 1)) * (layerIdx + 1);
      const spacing = height / (count + 1);

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: layerWidth,
          y: spacing * (i + 1),
          pulse: Math.random() * Math.PI * 2,
          halo: 0,
        });
        layerNodes.push(nodeIndex);
        nodeIndex++;
      }
      nodesByLayer.push(layerNodes);
    });

    // Create edges between layers
    for (let i = 0; i < nodesByLayer.length - 1; i++) {
      const currentLayer = nodesByLayer[i];
      const nextLayer = nodesByLayer[i + 1];

      currentLayer.forEach((fromIdx) => {
        nextLayer.forEach((toIdx) => {
          edges.push({
            from: fromIdx,
            to: toIdx,
            progress: Math.random(),
            speed: 0.004 + Math.random() * 0.008,
          });
        });
      });
    }

    stateRef.current = { nodes, edges };

    // Optimized Animation Loop
    const animate = () => {
      if (!isActive) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas with trail effect
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
      ctx.fillRect(0, 0, width, height);

      const state = stateRef.current;

      // Performance Optimization 1: Batch all edge lines into a single path and single stroke()
      // Reduces edge stroke calls from O(E) to O(1) per frame.
      ctx.strokeStyle = "rgba(100, 116, 139, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      state.edges.forEach((edge) => {
        const fromNode = state.nodes[edge.from];
        const toNode = state.nodes[edge.to];
        if (fromNode && toNode) {
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
        }
      });
      ctx.stroke();

      // Performance Optimization 2: Draw pulses using pre-rendered offscreen canvas texture
      state.edges.forEach((edge) => {
        edge.progress += edge.speed;
        if (edge.progress > 1) {
          edge.progress = 0;
        }

        const fromNode = state.nodes[edge.from];
        const toNode = state.nodes[edge.to];
        if (!fromNode || !toNode) return;

        const pulseX = fromNode.x + (toNode.x - fromNode.x) * edge.progress;
        const pulseY = fromNode.y + (toNode.y - fromNode.y) * edge.progress;

        ctx.drawImage(pulseCanvas, pulseX - 8, pulseY - 8);
      });

      // Performance Optimization 3: Draw node halos using pre-rendered texture
      state.nodes.forEach((node) => {
        node.pulse += 0.02;
        node.halo = Math.sin(node.pulse) * 0.5 + 0.5;

        const haloRadius = 6 + node.halo * 4;
        ctx.globalAlpha = node.halo;
        ctx.drawImage(
          haloCanvas,
          node.x - haloRadius,
          node.y - haloRadius,
          haloRadius * 2,
          haloRadius * 2
        );
      });
      ctx.globalAlpha = 1.0;

      // Performance Optimization 4: Batch node core fills into a single path
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
      ctx.beginPath();
      state.nodes.forEach((node) => {
        ctx.moveTo(node.x + 3, node.y);
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
      });
      ctx.fill();

      // Performance Optimization 5: Batch node outline strokes into a single path
      ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      state.nodes.forEach((node) => {
        ctx.moveTo(node.x + 4, node.y);
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      });
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{
        display: isActive ? "block" : "none",
      }}
    />
  );
}
