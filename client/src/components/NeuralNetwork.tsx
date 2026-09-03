import { useEffect, useRef } from "react";

interface NeuralNetworkProps {
  isActive: boolean;
  compact?: boolean;
}

/**
 * Optimized NeuralNetwork Component
 *
 * Performance improvements:
 * 1. Animation Loop Idle Management: The loop is explicitly paused when `isActive` is false
 *    instead of continuing to queue requestAnimationFrame calls, eliminating background CPU/GPU usage.
 * 2. Pre-rendered Radial Gradients: Pulse and halo gradients are pre-rendered onto offscreen canvases
 *    once during setup instead of allocating and recreating radial gradients via `createRadialGradient`
 *    for every single node and edge on every single frame (~600+ gradient allocations/sec saved).
 * 3. Batched Draw Calls: Edge lines are drawn using a single `beginPath()` and `stroke()` batch per frame
 *    rather than separate stroke context switches per edge (reduces draw call overhead from O(E) to O(1)).
 */
export default function NeuralNetwork({ isActive, compact = false }: NeuralNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef({
    nodes: [] as Array<{ x: number; y: number; pulse: number; halo: number }>,
    edges: [] as Array<{ from: number; to: number; progress: number; speed: number }>,
  });

  useEffect(() => {
    // If component is inactive, skip setup and do not run animation loop
    if (!isActive) return;

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

    // Offscreen Canvas 1: Edge pulse gradient pre-render (16x16 px)
    const pulseCanvas = document.createElement("canvas");
    pulseCanvas.width = 16;
    pulseCanvas.height = 16;
    const pulseCtx = pulseCanvas.getContext("2d");
    if (pulseCtx) {
      const pGrad = pulseCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      pGrad.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      pGrad.addColorStop(0.5, "rgba(34, 197, 94, 0.4)");
      pGrad.addColorStop(1, "rgba(34, 197, 94, 0)");
      pulseCtx.fillStyle = pGrad;
      pulseCtx.beginPath();
      pulseCtx.arc(8, 8, 8, 0, Math.PI * 2);
      pulseCtx.fill();
    }

    // Offscreen Canvas 2: Node halo gradient pre-render (20x20 px)
    const haloCanvas = document.createElement("canvas");
    haloCanvas.width = 20;
    haloCanvas.height = 20;
    const haloCtx = haloCanvas.getContext("2d");
    if (haloCtx) {
      const hGrad = haloCtx.createRadialGradient(10, 10, 0, 10, 10, 10);
      hGrad.addColorStop(0, "rgba(34, 197, 94, 0.3)");
      hGrad.addColorStop(1, "rgba(34, 197, 94, 0)");
      haloCtx.fillStyle = hGrad;
      haloCtx.beginPath();
      haloCtx.arc(10, 10, 10, 0, Math.PI * 2);
      haloCtx.fill();
    }

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

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
      ctx.fillRect(0, 0, width, height);

      const state = stateRef.current;

      // 1. Batch draw all edge background lines in a single stroke call
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

      // 2. Update edges and render pre-rendered pulse overlays
      state.edges.forEach((edge) => {
        edge.progress += edge.speed;
        if (edge.progress > 1) {
          edge.progress = 0;
        }

        const fromNode = state.nodes[edge.from];
        const toNode = state.nodes[edge.to];
        if (!fromNode || !toNode) return;

        // Draw pre-rendered pulse along edge
        const pulseX = fromNode.x + (toNode.x - fromNode.x) * edge.progress;
        const pulseY = fromNode.y + (toNode.y - fromNode.y) * edge.progress;
        ctx.drawImage(pulseCanvas, pulseX - 8, pulseY - 8);
      });

      // 3. Update and draw nodes using pre-rendered halo sprites
      state.nodes.forEach((node) => {
        node.pulse += 0.02;
        node.halo = Math.sin(node.pulse) * 0.5 + 0.5;

        // Draw halo using pre-rendered offscreen canvas with globalAlpha for scaling opacity
        const haloRadius = 6 + node.halo * 4;
        const scale = haloRadius / 10;
        ctx.save();
        ctx.globalAlpha = node.halo;
        ctx.drawImage(
          haloCanvas,
          node.x - 10 * scale,
          node.y - 10 * scale,
          20 * scale,
          20 * scale
        );
        ctx.restore();

        // Draw node core
        ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw node outline
        ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, compact]);

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
