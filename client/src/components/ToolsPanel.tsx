import { useState } from "react";
import { 
  Search, Code, Globe, FileText, MemoryStick, Bell, 
  ListTodo, Box, Building2, DollarSign, Users, Brain,
  ChevronRight, X, Play, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TOOL_CATEGORIES = [
  {
    name: "Search",
    icon: Search,
    color: "cyan",
    tools: [
      { name: "Web Search", desc: "Search the web with DuckDuckGo, Bing, or Google", method: "search" },
    ]
  },
  {
    name: "Code",
    icon: Code,
    color: "blue",
    tools: [
      { name: "Execute Code", desc: "Run Python, JavaScript, Bash, Go, Java, C++", method: "executeCode" },
    ]
  },
  {
    name: "Browser",
    icon: Globe,
    color: "purple",
    tools: [
      { name: "Browser Control", desc: "Navigate, click, type, screenshot", method: "browser" },
    ]
  },
  {
    name: "Notes",
    icon: FileText,
    color: "green",
    tools: [
      { name: "Create Note", desc: "Save a note with tags", method: "createNote" },
      { name: "Search Notes", desc: "Find notes by content or tags", method: "searchNotes" },
    ]
  },
  {
    name: "Memory",
    icon: MemoryStick,
    color: "yellow",
    tools: [
      { name: "Set Memory", desc: "Store key-value for cross-session context", method: "setMemory" },
      { name: "Get Memory", desc: "Retrieve stored memories", method: "getMemory" },
    ]
  },
  {
    name: "Tasks",
    icon: ListTodo,
    color: "orange",
    tools: [
      { name: "Create Project", desc: "Kanban-style project with task lists", method: "createProject" },
      { name: "Add Task", desc: "Add tasks to a project", method: "createTask" },
    ]
  },
  {
    name: "Sandbox",
    icon: Box,
    color: "red",
    tools: [
      { name: "Create Sandbox", desc: "AI Manus-style isolated Docker environment", method: "createSandbox" },
    ]
  },
  {
    name: "Company",
    icon: Building2,
    color: "pink",
    tools: [
      { name: "Execute Mission", desc: "ClawCompany 38-role mission framework", method: "executeMission" },
      { name: "Get Roles", desc: "View all available company roles", method: "getRoles" },
    ]
  },
  {
    name: "Money",
    icon: DollarSign,
    color: "emerald",
    tools: [
      { name: "Smart Route", desc: "ClawRouter x402 micropayment routing", method: "routePrompt" },
    ]
  },
  {
    name: "Swarm",
    icon: Users,
    color: "violet",
    tools: [
      { name: "Create Swarm", desc: "ClawSwarm multi-agent group chat", method: "createSwarm" },
      { name: "Send Message", desc: "Send message to swarm agents", method: "sendMessage" },
    ]
  },
  {
    name: "Learning",
    icon: Brain,
    color: "amber",
    tools: [
      { name: "Capture Experience", desc: "ClawCode ECAP experience capture", method: "captureExperience" },
    ]
  },
];

export default function ToolsPanel({ onClose }: { onClose: () => void }) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTool = async (tool: any) => {
    setSelectedTool(tool.name);
    setIsRunning(true);
    // Tool integration handled via chat context
    setTimeout(() => {
      setIsRunning(false);
      setSelectedTool(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Mantra Tools</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOL_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.name}
                  className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg bg-${category.color}-500/20`}>
                      <Icon className={`w-4 h-4 text-${category.color}-400`} />
                    </div>
                    <span className="font-semibold text-white">{category.name}</span>
                  </div>
                  <div className="space-y-2">
                    {category.tools.map((tool) => (
                      <button
                        key={tool.name}
                        onClick={() => handleRunTool(tool)}
                        disabled={isRunning}
                        className="w-full flex items-center justify-between p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left"
                      >
                        <div>
                          <p className="text-sm text-white font-medium">{tool.name}</p>
                          <p className="text-xs text-slate-400">{tool.desc}</p>
                        </div>
                        {selectedTool === tool.name && isRunning ? (
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <p className="text-xs text-slate-400 text-center">
            Tools are accessed through conversation. Just describe what you need!
          </p>
        </div>
      </div>
    </div>
  );
}