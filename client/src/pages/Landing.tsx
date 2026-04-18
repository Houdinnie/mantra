import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, Zap, Brain, Sparkles, MessageSquare } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/app");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Mantra
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/app")} className="bg-cyan-600 hover:bg-cyan-700">
                Open App
              </Button>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())} className="bg-cyan-600 hover:bg-cyan-700">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-6 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full">
              <span className="text-sm text-cyan-400 font-medium">AI-Powered Intent Decomposition</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Turn Ideas Into
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Executable Plans
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              Mantra is an action-oriented AI agent that breaks down your goals into concrete steps and delivers verifiable results. Every interaction produces something tangible.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold h-12 px-8"
              >
                Start Chatting <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 h-12 px-8"
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: "Intent Decomposition",
                description: "AI breaks down complex goals into actionable steps",
              },
              {
                icon: Zap,
                title: "Real-Time Processing",
                description: "Instant responses powered by Claude LLM",
              },
              {
                icon: MessageSquare,
                title: "Persistent History",
                description: "Your conversations are saved and retrievable",
              },
              {
                icon: Sparkles,
                title: "Neural Visualization",
                description: "Watch AI thinking with animated neural networks",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-slate-800/30 border border-slate-700 rounded-lg hover:border-cyan-500/50 transition-colors group"
                >
                  <div className="mb-4 p-3 bg-slate-700/50 rounded-lg w-fit group-hover:bg-cyan-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What You Can Do With Mantra
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Plan Projects",
                description:
                  "Describe your project idea and get a structured breakdown with timelines and deliverables.",
              },
              {
                title: "Solve Problems",
                description:
                  "Present a challenge and receive step-by-step solutions with actionable recommendations.",
              },
              {
                title: "Generate Ideas",
                description:
                  "Brainstorm with an AI partner that turns vague concepts into concrete, executable plans.",
              },
            ].map((item, idx) => (
              <div key={idx} className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-slate-400 mb-8">
            Join thousands of users turning their ideas into reality with Mantra.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold h-12 px-8"
          >
            Start Your First Chat <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>© 2026 Mantra. Built with precision and care.</p>
        </div>
      </footer>
    </div>
  );
}
