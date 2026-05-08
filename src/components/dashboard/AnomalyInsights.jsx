function formatShortDate(dateString) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

export default function AnomalyInsights({
  insights = [],
  title = "Anomaly insights",
  description = "Simulated operational signals based on case volume, RED cases, and symptom clusters.",
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            AI Monitoring Layer
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          No abnormal patterns detected in the current dataset.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((item) => (
            <div
              key={item.day}
              className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-violet-700">
                    {formatShortDate(item.day)}
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-slate-900">
                    Unusual case volume detected
                  </h3>
                </div>

                <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-bold text-violet-700">
                  {item.total} cases
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Volume was approximately{" "}
                <span className="font-semibold text-slate-900">
                  {item.volumeRatio.toFixed(1)}x
                </span>{" "}
                above the baseline. Dominant signal:{" "}
                <span className="font-semibold text-slate-900">
                  {item.topCluster.label}
                </span>
                .
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 font-semibold text-red-700">
                  RED: {item.red}
                </span>

                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                  YELLOW: {item.yellow}
                </span>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  GREEN: {item.green}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}