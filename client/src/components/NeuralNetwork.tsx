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

    // Optimization: Pre-render edge pulse radial gradient to an off-screen canvas once during initialization.
    // Avoids creating CanvasGradient objects and re-rasterizing radial gradients per edge per frame (O(N) -> O(1) creation).
    const pulseRadius = 8;
    const pulseCanvas = document.createElement("canvas");
    pulseCanvas.width = pulseRadius * 2;
    pulseCanvas.height = pulseRadius * 2;
    const pulseCtx = pulseCanvas.getContext("2d");
    if (pulseCtx) {
      const gradient = pulseCtx.createRadialGradient(
        pulseRadius,
        pulseRadius,
        0,
        pulseRadius,
        pulseRadius,
        pulseRadius
      );
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      gradient.addColorStop(0.5, "rgba(34, 197, 94, 0.4)");
      gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
      pulseCtx.fillStyle = gradient;
      pulseCtx.beginPath();
      pulseCtx.arc(pulseRadius, pulseRadius, pulseRadius, 0, Math.PI * 2);
      pulseCtx.fill();
    }

    // Animation loop
    const animate = () => {
      if (!isActive) {
        // Optimization: Stop requesting animation frames when component is inactive.
        // Prevents background CPU/GPU thread execution when canvas is hidden.
        return;
      }

      // Clear canvas
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
      ctx.fillRect(0, 0, width, height);

      const state = stateRef.current;

      // Optimization: Batch edge line drawing into a single path and single stroke() call.
      // Reduces 80+ separate stroke calls to 1 draw call per frame.
      ctx.strokeStyle = "rgba(100, 116, 139, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < state.edges.length; i++) {
        const edge = state.edges[i];
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
      }
      ctx.stroke();

      // Draw pulse along edges using pre-rendered offscreen canvas (fast bitmap transfer)
      for (let i = 0; i < state.edges.length; i++) {
        const edge = state.edges[i];
        const fromNode = state.nodes[edge.from];
        const toNode = state.nodes[edge.to];
        if (fromNode && toNode) {
          const pulseX = fromNode.x + (toNode.x - fromNode.x) * edge.progress;
          const pulseY = fromNode.y + (toNode.y - fromNode.y) * edge.progress;
          ctx.drawImage(pulseCanvas, pulseX - pulseRadius, pulseY - pulseRadius);
        }
      }

      // Update nodes and draw halos
      for (let i = 0; i < state.nodes.length; i++) {
        const node = state.nodes[i];
        node.pulse += 0.02;
        node.halo = Math.sin(node.pulse) * 0.5 + 0.5;

        // Draw halo
        const haloRadius = 6 + node.halo * 4;
        const haloGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, haloRadius);
        haloGradient.addColorStop(0, `rgba(34, 197, 94, ${0.3 * node.halo})`);
        haloGradient.addColorStop(1, "rgba(34, 197, 94, 0)");

        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Optimization: Batch draw node cores with a single fill() call.
      // Explicit moveTo(node.x + 3, node.y) ensures subpaths are disconnected cleanly.
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
      ctx.beginPath();
      for (let i = 0; i < state.nodes.length; i++) {
        const node = state.nodes[i];
        ctx.moveTo(node.x + 3, node.y);
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
      }
      ctx.fill();

      // Optimization: Batch draw node outlines with a single stroke() call.
      ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < state.nodes.length; i++) {
        const node = state.nodes[i];
        ctx.moveTo(node.x + 4, node.y);
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      }
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isActive) {
      animationRef.current = requestAnimationFrame(animate);
    }

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
