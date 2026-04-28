/**
 * Dashboard - Swarm Hub Command Cockpit
 * Extends Mantra with VentureMind "Neon Nomad Empire" design
 */
import { useState } from "react";
import SwarmHub from "../components/SwarmHub";
import NeuralGlobe from "../components/NeuralGlobe";

export default function Dashboard() {
  const [view, setView] = useState<"swarm" | "globe">("swarm");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Toggle for views */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setView("swarm")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === "swarm" 
              ? "bg-cyan-600 text-white" 
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          🏠 Swarm Hub
        </button>
        <button
          onClick={() => setView("globe")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === "globe" 
              ? "bg-cyan-600 text-white" 
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          🌍 Globe View
        </button>
      </div>

      {view === "swarm" ? <SwarmHub /> : (
        <div className="h-screen">
          <NeuralGlobe />
        </div>
      )}
    </div>
  );
}
