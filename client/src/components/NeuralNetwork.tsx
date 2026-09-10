import { useEffect, useRef } from "react";

interface NeuralNetworkProps {
  isActive: boolean;
  compact?: boolean;
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

    // Performance optimization: Pre-render edge pulse particle sprite on off-screen canvas
    // to avoid creating radial gradients repeatedly on every frame.
    const pulseCanvas = document.createElement("canvas");
    pulseCanvas.width = 16;
    pulseCanvas.height = 16;
    const pulseCtx = pulseCanvas.getContext("2d");
    if (pulseCtx) {
      const g = pulseCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      g.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      g.addColorStop(0.5, "rgba(34, 197, 94, 0.4)");
      g.addColorStop(1, "rgba(34, 197, 94, 0)");
      pulseCtx.fillStyle = g;
      pulseCtx.beginPath();
      pulseCtx.arc(8, 8, 8, 0, Math.PI * 2);
      pulseCtx.fill();
    }

    // Performance optimization: Pre-render static node halo sprite on off-screen canvas.
    // Scaling this pre-rendered sprite is significantly faster than dynamically creating radial gradients per node per frame.
    const haloCanvas = document.createElement("canvas");
    haloCanvas.width = 20;
    haloCanvas.height = 20;
    const haloCtx = haloCanvas.getContext("2d");
    if (haloCtx) {
      const g = haloCtx.createRadialGradient(10, 10, 0, 10, 10, 10);
      g.addColorStop(0, "rgba(34, 197, 94, 0.3)");
      g.addColorStop(1, "rgba(34, 197, 94, 0)");
      haloCtx.fillStyle = g;
      haloCtx.beginPath();
      haloCtx.arc(10, 10, 10, 0, Math.PI * 2);
      haloCtx.fill();
    }

    // Animation loop
    const animate = () => {
      if (!isActive) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
      ctx.fillRect(0, 0, width, height);

      const state = stateRef.current;

      // Optimization: Batch all static edge line paths into a single stroke call.
      // Reduces CPU-to-GPU state switches from O(E) to O(1).
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

      // Update edge progress and draw pulses using the pre-rendered sprite.
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

      // Update node states and draw halo sprites
      state.nodes.forEach((node) => {
        node.pulse += 0.02;
        node.halo = Math.sin(node.pulse) * 0.5 + 0.5;

        // Draw pre-rendered halo sprite scaled with node opacity/size
        const haloRadius = 6 + node.halo * 4;
        const drawSize = haloRadius * 2;
        ctx.globalAlpha = node.halo;
        ctx.drawImage(haloCanvas, node.x - haloRadius, node.y - haloRadius, drawSize, drawSize);
      });
      ctx.globalAlpha = 1.0;

      // Optimization: Batch draw all node cores in a single fill call
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
      ctx.beginPath();
      state.nodes.forEach((node) => {
        ctx.moveTo(node.x + 3, node.y);
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
      });
      ctx.fill();

      // Optimization: Batch draw all node outlines in a single stroke call
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
