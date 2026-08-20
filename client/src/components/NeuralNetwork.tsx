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

    // Pre-render the pulse gradient to an offscreen canvas to avoid creating radial gradients on every edge every frame (60 FPS)
    const pulseCanvas = document.createElement("canvas");
    pulseCanvas.width = 16;
    pulseCanvas.height = 16;
    const pulseCtx = pulseCanvas.getContext("2d");
    if (pulseCtx) {
      const grad = pulseCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      grad.addColorStop(0.5, "rgba(34, 197, 94, 0.4)");
      grad.addColorStop(1, "rgba(34, 197, 94, 0)");
      pulseCtx.fillStyle = grad;
      pulseCtx.beginPath();
      pulseCtx.arc(8, 8, 8, 0, Math.PI * 2);
      pulseCtx.fill();
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

      // 1. Batch draw all edge background lines in a single path and single stroke call (O(E) -> 1 draw call)
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
        if (!fromNode || !toNode) return;

        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
      });
      ctx.stroke();

      // 2. Render edge pulses using the pre-rendered offscreen canvas texture (0 allocations/frame)
      state.edges.forEach((edge) => {
        const fromNode = state.nodes[edge.from];
        const toNode = state.nodes[edge.to];
        if (!fromNode || !toNode) return;

        const pulseX = fromNode.x + (toNode.x - fromNode.x) * edge.progress;
        const pulseY = fromNode.y + (toNode.y - fromNode.y) * edge.progress;

        ctx.drawImage(pulseCanvas, pulseX - 8, pulseY - 8);
      });

      // 3. Update nodes and draw halos
      state.nodes.forEach((node) => {
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
      });

      // 4. Batch draw node cores in a single fill call (O(N) -> 1 draw call)
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
      ctx.beginPath();
      state.nodes.forEach((node) => {
        ctx.moveTo(node.x + 3, node.y);
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
      });
      ctx.fill();

      // 5. Batch draw node outlines in a single stroke call (O(N) -> 1 draw call)
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
