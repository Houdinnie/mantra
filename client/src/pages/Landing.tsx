/**
 * Public landing page. Plain description of what the app does, with links into it.
 */
const FEATURES = [
  {
    name: "Chat",
    path: "/app",
    text: "Describe a goal and the message is routed to the specialist that fits it, such as a code reviewer, a researcher or a planning agent. Sessions are saved so you can pick them up later.",
  },
  {
    name: "Sandbox",
    path: "/sandbox",
    text: "Run code and scripts in an isolated environment (Docker when available, a restricted process otherwise), upload files into it, and read the output.",
  },
  {
    name: "Tasks",
    path: "/tasks",
    text: "Dispatch a one-off task or save a multi-step flow that runs on demand or on a schedule.",
  },
  {
    name: "Notes",
    path: "/notes",
    text: "A markdown notebook with search, kept next to the conversations that produced it.",
  },
  {
    name: "Channels",
    path: "/channels",
    text: "Topic channels where you can mention an agent by name, so one project stays in one place.",
  },
  {
    name: "Memory",
    path: "/brain",
    text: "Facts and context from earlier sessions are stored and searchable, so you do not repeat yourself.",
  },
];

const STEPS = [
  ["Validate", "Find the people who have the problem and check they will pay before you build anything."],
  ["Process", "Do the work by hand first and write down the steps."],
  ["Automate", "Turn the repeated steps into tasks and flows."],
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="font-serif text-lg font-semibold">Mantra</span>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a className="hidden hover:text-foreground sm:inline" href="#what">What it does</a>
            <a className="hidden hover:text-foreground sm:inline" href="#method">Method</a>
            <a className="hidden hover:text-foreground sm:inline" href="https://github.com/Houdinnie/mantra">Source</a>
            <a
              href="/app"
              className="whitespace-nowrap rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90"
            >
              Open the app
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20 sm:py-28">
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            A workspace for starting a business, with an assistant that keeps the context.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Mantra puts chat, a code sandbox, scheduled tasks, notes and memory in one place. It follows the method
            from The Minimalist Entrepreneur: validate first, then do the work by hand, then automate it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="/app"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Open the app
            </a>
            <a href="https://github.com/Houdinnie/mantra" className="text-sm underline underline-offset-4">
              Read the source on GitHub
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Signing in is required. AI replies need a model key set by whoever runs the server.</p>
        </section>

        <section id="what" className="border-t border-border py-16">
          <h2 className="font-serif text-2xl font-semibold">What is in it</h2>
          <dl className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.name}>
                <dt className="font-medium">
                  <a href={f.path} className="underline-offset-4 hover:underline">{f.name}</a>
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="method" className="border-t border-border py-16">
          <h2 className="font-serif text-2xl font-semibold">The method it is built around</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <div className="text-sm text-muted-foreground">Step {i + 1}</div>
                <div className="mt-1 font-medium">{title}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>MIT licence</span>
          <a href="https://github.com/Houdinnie/mantra" className="hover:text-foreground">github.com/Houdinnie/mantra</a>
        </div>
      </footer>
    </div>
  );
}
