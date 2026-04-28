/**
 * SwarmHub - Main Dashboard with Bento Grid
 * "Private Command Cockpit" for Mantra
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NeuralGlobe from "./NeuralGlobe";

// Live agent activity feed
const AGENT_ACTIVITY = [
  { agent: "Tax Strategist", action: "Calculated Q2 NHR optimization", time: "2m ago", icon: "💰" },
  { agent: "Luxury Optimiser", action: "Secured 2 empty-leg flights saving 41%", time: "5m ago", icon: "✈️" },
  { agent: "Compliance Auditor", action: "Completed 94% SOC2 gap analysis", time: "8m ago", icon: "🔒" },
  { agent: "Nomad Navigator", action: "Updated Portugal presence to 67/183 days", time: "12m ago", icon: "🗺️" },
  { agent: "Wellness Director", action: "Scheduled clinic appointment in Lisbon", time: "15m ago", icon: "🏥" },
  { agent: "Wealth Architect", action: "Analyzed dividend strategy for UAE holding", time: "18m ago", icon: "📊" },
];

// Pillar data
const PILLARS = [
  { id: "nomad", name: "Nomad Navigator", icon: "🗺️", color: "#00f5ff", agents: 12, desc: "Visa optimization, presence tracking, travel intelligence" },
  { id: "tax", name: "Tax Strategist", icon: "💰", color: "#ffd700", agents: 8, desc: "NHR optimization, treaty analysis, entity structuring" },
  { id: "legal", name: "Legal Guardian", icon: "⚖️", color: "#ff00aa", agents: 6, desc: "Residency compliance, regulatory monitoring" },
  { id: "wellness", name: "Wellness Director", icon: "🏥", color: "#00ffcc", agents: 5, desc: "Health insurance, clinic networks, longevity protocols" },
  { id: "luxury", name: "Luxury Optimiser", icon: "✈️", color: "#ff6600", agents: 9, desc: "Premium travel, hotel programs, lifestyle management" },
  { id: "wealth", name: "Wealth Architect", icon: "📈", color: "#8844ff", agents: 11, desc: "Investment strategy, banking optimization, fund structures" },
  { id: "compliance", name: "Compliance Auditor", icon: "🔐", color: "#00ff88", agents: 7, desc: "SOC2, GDPR, substance requirements, audit trails" },
];

// Minimalist skills (slavingia)
const SKILLS = [
  { cmd: "/find-community", name: "Find Community", desc: "Identify your founding community" },
  { cmd: "/validate-idea", name: "Validate Idea", desc: "Test before building" },
  { cmd: "/processize", name: "Processize", desc: "Manual-first, then automate" },
  { cmd: "/minimalist-review", name: "Minimalist Review", desc: "Apply TME principles" },
  { cmd: "/mvp", name: "MVP Builder", desc: "Ship in a weekend" },
  { cmd: "/first-customers", name: "First Customers", desc: "Sell before scaling" },
  { cmd: "/pricing", name: "Pricing", desc: "Charge from day one" },
  { cmd: "/company-values", name: "Company Values", desc: "Build the house you want" },
];

function ActivityFeed() {
  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 h-full overflow-hidden">
      <h3 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Swarm Activity
      </h3>
      <div className="space-y-3 overflow-y-auto max-h-64">
        {AGENT_ACTIVITY.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer"
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{item.agent}</p>
              <p className="text-xs text-slate-400 truncate">{item.action}</p>
            </div>
            <span className="text-xs text-slate-500">{item.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PillarCard({ pillar, onClick }: { pillar: typeof PILLARS[0]; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-slate-900/50 border rounded-2xl p-4 cursor-pointer group relative overflow-hidden"
      style={{ borderColor: pillar.color + "40" }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: `radial-gradient(circle at 50% 0%, ${pillar.color}40, transparent 70%)` }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{pillar.icon}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">{pillar.agents} agents</span>
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: pillar.color }}
            />
          </div>
        </div>
        <h4 className="font-bold text-white mb-1" style={{ color: pillar.color }}>{pillar.name}</h4>
        <p className="text-xs text-slate-400 line-clamp-2">{pillar.desc}</p>
      </div>
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${pillar.color}, transparent)` }}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transformOrigin="left"
      />
    </motion.div>
  );
}

function CommandBar() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center bg-slate-900/80 border border-cyan-500/30 rounded-xl px-4 py-3 backdrop-blur-xl">
        <span className="text-cyan-400 mr-3">⟨</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setActive(true)}
          placeholder="Command the swarm... (e.g., 'Optimize my Portugal tax strategy')"
          className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
        />
        <motion.div
          animate={{ opacity: query ? 1 : 0.5 }}
          className="text-cyan-400/50 text-sm"
        >
          ⏎ to execute
        </motion.div>
      </div>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50"
          >
            <div className="p-2">
              <p className="text-xs text-slate-500 px-2 py-1">Quick Actions</p>
              {SKILLS.slice(0, 4).map((skill) => (
                <button
                  key={skill.cmd}
                  onClick={() => { setQuery(skill.cmd + " "); setActive(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-left"
                >
                  <span className="text-cyan-400 font-mono text-sm">{skill.cmd}</span>
                  <span className="text-slate-400 text-xs">{skill.desc}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PresenceGauge() {
  const [days, setDays] = useState(67);
  const total = 183;
  const pct = (days / total) * 100;
  const risk = pct > 90 ? "High" : pct > 70 ? "Medium" : "Low";
  const riskColor = risk === "High" ? "#ff4444" : risk === "Medium" ? "#ffaa00" : "#00ff88";

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        🇵🇹 Portugal Presence
      </h3>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{days} days</span>
          <span>{total} annual limit</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: riskColor }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: riskColor }}>{risk} Risk</span>
        <span className="text-xs text-slate-500">NHR Valid</span>
      </div>
    </div>
  );
}

function MorningDigest() {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">☀️ Morning Digest</h3>
          <span className="text-xs text-slate-500">Updated 6:00 AM</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
            <span className="text-xl">📋</span>
            <div className="flex-1">
              <p className="text-sm text-white">Tax filing due in 12 days</p>
              <p className="text-xs text-amber-400">IRS Q2 estimated payment</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
            <span className="text-xl">✈️</span>
            <div className="flex-1">
              <p className="text-sm text-white">Dubai meeting detected</p>
              <p className="text-xs text-slate-400">Substance requirements may apply</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
            <span className="text-xl">✅</span>
            <div className="flex-1">
              <p className="text-sm text-emerald-400">SOC2 audit passed</p>
              <p className="text-xs text-slate-400">94% compliance score</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">Minimalist Review: Focus on Dubai substance before Q3. Portugal NHR safe for now.</p>
        </div>
      </div>
    </div>
  );
}

export default function SwarmHub() {
  const [activePillar, setActivePillar] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            <span className="text-cyan-400">VENTURE</span>
            <span className="text-white">MIND</span>
          </h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">7 Pillars Live • 18 Agents</span>
          </div>
        </div>
        <div className="w-96">
          <CommandBar />
        </div>
        <div className="flex items-center gap-4">
          <PresenceGauge />
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium text-sm">
            Summon Swarm
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
        {/* Left Column - Digest + Activity */}
        <div className="col-span-3 space-y-4">
          <MorningDigest />
          <ActivityFeed />
        </div>

        {/* Center - Globe */}
        <div className="col-span-6 bg-slate-900/30 border border-slate-700/30 rounded-2xl overflow-hidden">
          <NeuralGlobe activePillar={activePillar || undefined} />
        </div>

        {/* Right Column - Pillars */}
        <div className="col-span-3 space-y-4">
          <h3 className="text-sm font-bold text-slate-400">7 Pillars</h3>
          <div className="grid grid-cols-2 gap-3">
            {PILLARS.map((pillar) => (
              <PillarCard
                key={pillar.id}
                pillar={pillar}
                onClick={() => setActivePillar(activePillar === pillar.id ? null : pillar.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
