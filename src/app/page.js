import Link from "next/link";

const modules = [
  {
    title: "Patient Intake",
    subtitle: "Submit symptoms for AI triage classification",
    href: "/patient",
    icon: "🩺",
    badge: "AI Triage",
    className:
      "border-blue-200 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20",
    badgeClass: "bg-white/20 text-white",
  },
  {
    title: "Appointment Center",
    subtitle: "Schedule, manage, and review patient appointments",
    href: "/dashboard/appointments",
    icon: "📅",
    badge: "Scheduling",
    className:
      "border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20",
    badgeClass: "bg-white/20 text-white",
  },
  {
    title: "Hospital Dashboard",
    subtitle: "View real-time patient flow and triage insights",
    href: "/dashboard",
    icon: "🏥",
    badge: "Operations",
    className:
      "border-slate-800 bg-slate-950 text-white hover:bg-slate-900 shadow-slate-950/20",
    badgeClass: "bg-white/15 text-white",
  },
  {
    title: "ML Insights",
    subtitle: "Analyze anomalies, patterns, and predicted hospital load",
    href: "/dashboard/machine-learning",
    icon: "📊",
    badge: "Machine Learning",
    className:
      "border-violet-200 bg-violet-600 text-white hover:bg-violet-700 shadow-violet-600/20",
    badgeClass: "bg-white/20 text-white",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-700">
              AI-powered hospital triage & load prediction system
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              MediFlow AI
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Helping hospitals reduce overcrowding by combining AI triage,
              appointment routing, operational dashboards, and machine learning
              insights from real-time patient data.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {modules.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`group rounded-3xl border p-6 shadow-lg transition active:scale-[0.99] ${item.className}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${item.badgeClass}`}
                    >
                      {item.badge}
                    </span>

                    <h2 className="mt-5 text-2xl font-black tracking-tight">
                      {item.title}
                    </h2>

                    <p className="mt-2 max-w-sm text-sm font-semibold leading-6 opacity-85">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/15 px-4 py-3 text-3xl">
                    {item.icon}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm font-black opacity-90">
                  <span>Open module</span>
                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm leading-6 text-slate-600">
              Emergency rooms are overwhelmed. MediFlow AI helps prioritize
              patients, route appointments, monitor hospital load, and detect
              early warning patterns before saturation happens.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}