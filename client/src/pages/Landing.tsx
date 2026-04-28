/**
 * Neon Nomad Empire Landing - Cinematic "Enter the Swarm"
 * Extends existing Landing.tsx with cyberpunk aesthetics
 */
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import NeuralGlobe from "./NeuralGlobe";

// 7 Pillars data
const PILLARS = [
  { id: "nomad", name: "Nomad Navigator", icon: "🗺️", color: "#00f5ff", desc: "Visa optimization, presence tracking, travel intelligence" },
  { id: "tax", name: "Tax Strategist", icon: "💰", color: "#ffd700", desc: "NHR optimization, treaty analysis, entity structuring" },
  { id: "legal", name: "Legal Guardian", icon: "⚖️", color: "#ff00aa", desc: "Residency compliance, regulatory monitoring" },
  { id: "wellness", name: "Wellness Director", icon: "🏥", color: "#00ffcc", desc: "Health insurance, clinic networks, longevity protocols" },
  { id: "luxury", name: "Luxury Optimiser", icon: "✈️", color: "#ff6600", desc: "Premium travel, hotel programs, lifestyle management" },
  { id: "wealth", name: "Wealth Architect", icon: "📈", color: "#8844ff", desc: "Investment strategy, banking optimization, fund structures" },
  { id: "compliance", name: "Compliance Auditor", icon: "🔐", color: "#00ff88", desc: "SOC2, GDPR, substance requirements, audit trails" },
];

// 8 Personas
const PERSONAS = [
  { name: "Tax Strategist", type: "Data Analyst", tags: ["NHR", "Treaties", "Optimization"], color: "#ffd700" },
  { name: "Legal Guardian", type: "Entity Structuring", tags: ["Residency", "Compliance", "Contracts"], color: "#ff00aa" },
  { name: "Nomad Navigator", type: "Travel Intelligence", tags: ["Visas", "Presence", "Logistics"], color: "#00f5ff" },
  { name: "Wellness Director", type: "Health Longevity", tags: ["Clinics", "Insurance", "Protocols"], color: "#00ffcc" },
  { name: "Luxury Optimiser", type: "Premium Experiences", tags: ["Hotels", "Flights", "Concierge"], color: "#ff6600" },
  { name: "Wealth Architect", type: "Investment Strategy", tags: ["Banking", "Funds", "Structures"], color: "#8844ff" },
  { name: "Compliance Auditor", type: "Regulatory Intelligence", tags: ["SOC2", "GDPR", "Audits"], color: "#00ff88" },
  { name: "CEO Agent", type: "Strategic Orchestration", tags: ["Leadership", "Vision", "Execution"], color: "#ffffff" },
];

// Minimalist skills (slavingia)
const SKILLS = [
  { cmd: "/find-community", name: "Find Community", desc: "Identify your founding community before building" },
  { cmd: "/validate-idea", name: "Validate Idea", desc: "Test demand before writing code" },
  { cmd: "/processize", name: "Processize", desc: "Manual-first, then automate" },
  { cmd: "/minimalist-review", name: "Minimalist Review", desc: "Apply The Minimalist Entrepreneur principles" },
  { cmd: "/mvp", name: "MVP Builder", desc: "Ship in a weekend" },
  { cmd: "/first-customers", name: "First Customers", desc: "Sell to 10 before scaling" },
  { cmd: "/pricing", name: "Pricing", desc: "Charge from day one" },
  { cmd: "/grow-sustainably", name: "Grow Sustainably", desc: "Profitability-first expansion" },
  { cmd: "/company-values", name: "Company Values", desc: "Build the house you want to live in" },
  { cmd: "/marketing-plan", name: "Marketing Plan", desc: "Content-driven growth after PMF" },
];

function GlitchText({ children, className }: { children: React.ReactNode; className?: string }) {
  const [glitch, setGlitch] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) setGlitch(true);
      else setGlitch(false);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.span
      className={`${className} ${glitch ? "animate-pulse" : ""}`}
      style={{
        textShadow: glitch ? "2px 0 #ff00aa, -2px 0 #00f5ff" : "none",
      }}
    >
      {children}
    </motion.span>
  );
}

function OrbitingOrbs() {
  const orbs = [
    { angle: 0, color: "#00f5ff", label: "Nomad" },
    { angle: 51, color: "#ffd700", label: "Tax" },
    { angle: 103, color: "#ff00aa", label: "Legal" },
    { angle: 154, color: "#00ffcc", label: "Wellness" },
    { angle: 206, color: "#ff6600", label: "Luxury" },
    { angle: 257, color: "#8844ff", label: "Wealth" },
    { angle: 309, color: "#00ff88", label: "Compliance" },
  ];

  return (
    <div className="relative w-64 h-64">
      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-pulse" />
      <div className="absolute inset-4 rounded-full border border-slate-700/50" />
      {orbs.map((orb, i) => {
        const rad = (orb.angle * Math.PI) / 180;
        const x = 32 + 28 * Math.cos(rad);
        const y = 32 + 28 * Math.sin(rad);
        return (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full cursor-pointer"
            style={{
              left: `${x * 2}%`,
              top: `${y * 2}%`,
              backgroundColor: orb.color,
              boxShadow: `0 0 20px ${orb.color}`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.5 }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-white/70 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
              {orb.label}
            </div>
          </motion.div>
        );
      })}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-magenta-500 animate-pulse" />
      </div>
    </div>
  );
}

function SkillPill({ skill }: { skill: typeof SKILLS[0] }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-full hover:border-cyan-500/50 transition-colors text-left"
    >
      <span className="text-cyan-400 font-mono text-sm">{skill.cmd}</span>
      <span className="text-slate-400 text-xs">{skill.desc}</span>
    </motion.button>
  );
}

function PersonaCard({ persona }: { persona: typeof PERSONAS[0] }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative p-4 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden group"
    >
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-20 transition-opacity"
        style={{ background: `radial-gradient(circle at 50% 0%, ${persona.color}30, transparent 60%)` }}
      />
      <div className="relative">
        <div
          className="w-12 h-12 rounded-xl mb-3"
          style={{ background: `linear-gradient(135deg, ${persona.color}40, ${persona.color}10)` }}
        />
        <h4 className="font-bold text-white mb-1">{persona.name}</h4>
        <p className="text-xs text-slate-400 mb-3">{persona.type}</p>
        <div className="flex flex-wrap gap-1">
          {persona.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full"
              style={{ backgroundColor: `${persona.color}20`, color: persona.color }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function NeonLanding() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  const [typed, setTyped] = useState("");
  const fullText = "Speak your intention.\nThe Swarm validates • processizes • executes • optimizes —\nacross borders, balance sheets, and first-class cabins.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTyped(fullText.slice(0, i));
        i++;
      } else clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />

        <motion.div
          ref={ref}
          style={{ opacity, scale }}
          className="relative z-10 text-center max-w-6xl mx-auto px-6"
        >
          {/* Logo */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl md:text-8xl font-black mb-4"
          >
            <GlitchText className="bg-gradient-to-r from-cyan-400 via-white to-magenta-400 bg-clip-text text-transparent">
              VENTUREMIND
            </GlitchText>
          </motion.h1>

          {/* Orbiting Swarm */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex justify-center mb-8"
          >
            <OrbitingOrbs />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-slate-300 mb-6 font-mono whitespace-pre-line"
          >
            {typed}
            <span className="animate-pulse">|</span>
          </motion.p>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-slate-500 mb-8"
          >
            Mantra-Powered Agent Swarm • Guided by The Minimalist Entrepreneur • Built for the Global Nomad Founder
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center gap-4 mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-magenta-600 rounded-xl font-bold text-lg"
            >
              ⚡ Summon the Swarm
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-slate-800/50 border border-slate-700 rounded-xl font-medium"
            >
              View Dashboard
            </motion.button>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex justify-center gap-8"
          >
            {[
              { value: "69", label: "Specialized Agents" },
              { value: "27+", label: "Tools Integrated" },
              { value: "800+", label: "App Integrations" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-cyan-400">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" />
          </div>
        </motion.div>
      </section>

      {/* 7 Pillars Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-center mb-4"
          >
            <span className="text-cyan-400">The 7 Pillars</span>
          </motion.h2>
          <p className="text-slate-400 text-center mb-12">Your global empire, orchestrated by AI</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden group cursor-pointer"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${pillar.color}20, transparent 60%)` }}
                />
                <div className="relative">
                  <div className="text-4xl mb-4">{pillar.icon}</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: pillar.color }}>{pillar.name}</h3>
                  <p className="text-sm text-slate-400">{pillar.desc}</p>
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: pillar.color }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 Personas Section */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-center mb-4"
          >
            <span className="text-magenta-400">Your 8 Personas</span>
          </motion.h2>
          <p className="text-slate-400 text-center mb-12">Specialized AI agents for every dimension of your empire</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PERSONAS.map((persona, i) => (
              <motion.div key={persona.name} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <PersonaCard persona={persona} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimalist Skills Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent" />
        <div className="max-w-5xl mx-auto relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-center mb-4"
          >
            <span className="text-emerald-400">Discipline Layer</span>
          </motion.h2>
          <p className="text-slate-400 text-center mb-12">Powered by The Minimalist Entrepreneur — 10 skills for building right</p>

          <div className="flex flex-wrap justify-center gap-3">
            {SKILLS.map((skill, i) => (
              <motion.div key={skill.cmd} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <SkillPill skill={skill} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-4">Ready to Command Your Empire?</h2>
          <p className="text-slate-400 mb-8">Join the vetted founder network. Self-hosted. Privacy-first. SOC2-aligned by design.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-12 py-5 bg-gradient-to-r from-cyan-600 to-magenta-600 rounded-2xl font-bold text-xl"
          >
            Enter the Swarm →
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-slate-500">
          <div>Self-hosted • Privacy-first • SOC2-aligned by design</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Docs</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Guild</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
