import { useEffect, useRef } from "react";

interface NeuralNetworkProps {
  isActive: boolean;
  compact?: boolean;
}

/**
 * Optimized Neural Network canvas animation component.
 *
 * Performance Optimizations:
 * 1. Early return on `!isActive`: Completely pauses `requestAnimationFrame` when component is inactive,
 *    eliminating background CPU/RAF overhead when hidden (O(1) idle performance).
 * 2. Off-screen Sprite Pre-rendering: Pre-renders radial gradient glows (edge pulse and node halo)
 *    to off-screen canvas buffers, avoiding ~70 `createRadialGradient` allocations per frame and reducing GC pressure.
 * 3. Batched Draw Calls: Groups all edge line paths into a single `beginPath()` / `stroke()` pass,
 *    reducing draw call context overhead from O(E) to O(1) where E is the number of edges.
 */
export default function NeuralNetwork({ isActive, compact = false }: NeuralNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef({
    nodes: [] as Array<{ x: number; y: number; pulse: number; halo: number }>,
    edges: [] as Array<{ from: number; to: number; progress: number; speed: number }>,
  });

  useEffect(() => {
    // 1. Early exit if inactive to save RAF cycles completely
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

    // Pre-render pulse sprite to offscreen canvas
    const pulseSprite = document.createElement("canvas");
    pulseSprite.width = 16;
    pulseSprite.height = 16;
    const pCtx = pulseSprite.getContext("2d");
    if (pCtx) {
      const g = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      g.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      g.addColorStop(0.5, "rgba(34, 197, 94, 0.4)");
      g.addColorStop(1, "rgba(34, 197, 94, 0)");
      pCtx.fillStyle = g;
      pCtx.beginPath();
      pCtx.arc(8, 8, 8, 0, Math.PI * 2);
      pCtx.fill();
    }

    // Pre-render halo sprite to offscreen canvas
    const haloSprite = document.createElement("canvas");
    haloSprite.width = 20;
    haloSprite.height = 20;
    const hCtx = haloSprite.getContext("2d");
    if (hCtx) {
      const g = hCtx.createRadialGradient(10, 10, 0, 10, 10, 10);
      g.addColorStop(0, "rgba(34, 197, 94, 0.3)");
      g.addColorStop(1, "rgba(34, 197, 94, 0)");
      hCtx.fillStyle = g;
      hCtx.beginPath();
      hCtx.arc(10, 10, 10, 0, Math.PI * 2);
      hCtx.fill();
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

      // 1. Batch draw edge lines in single stroke call
      ctx.strokeStyle = "rgba(100, 116, 139, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();

      state.edges.forEach((edge) => {
        edge.progress += edge.speed;
        if (edge.progress > 1) {
          edge.progress = 0;
        }

        const fromNode = state.nodes[edge.from];
        const toNode = state.nodes[edge.to];
        if (fromNode && toNode) {
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
        }
      });
      ctx.stroke();

      // 2. Draw edge pulses using pre-rendered sprite
      state.edges.forEach((edge) => {
        const fromNode = state.nodes[edge.from];
        const toNode = state.nodes[edge.to];
        if (!fromNode || !toNode) return;

        const pulseX = fromNode.x + (toNode.x - fromNode.x) * edge.progress;
        const pulseY = fromNode.y + (toNode.y - fromNode.y) * edge.progress;
        ctx.drawImage(pulseSprite, pulseX - 8, pulseY - 8);
      });

      // 3. Update and draw nodes
      state.nodes.forEach((node) => {
        node.pulse += 0.02;
        node.halo = Math.sin(node.pulse) * 0.5 + 0.5;

        // Draw halo using pre-rendered sprite scaled by radius
        const haloRadius = 6 + node.halo * 4;
        const size = haloRadius * 2;
        ctx.globalAlpha = node.halo;
        ctx.drawImage(haloSprite, node.x - haloRadius, node.y - haloRadius, size, size);
        ctx.globalAlpha = 1;

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
