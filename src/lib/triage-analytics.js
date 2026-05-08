export function normalizeColor(color) {
  return String(color || "").toUpperCase();
}

function buildRecordSearchText(record) {
  return [
    record?.sintomas,
    record?.mensaje,
    Array.isArray(record?.reasons) ? record.reasons.join(" ") : "",
    Array.isArray(record?.red_flags) ? record.red_flags.join(" ") : "",
  ]
    .join(" ")
    .toLowerCase();
}

export function getLastDaysData(records, days = 14) {
  const map = new Map();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const key = date.toISOString().slice(0, 10);

    map.set(key, {
      day: key,
      total: 0,
      red: 0,
      yellow: 0,
      green: 0,
    });
  }

  records.forEach((record) => {
    if (!record.created_at) return;

    const key = new Date(record.created_at).toISOString().slice(0, 10);
    const color = normalizeColor(record.color);

    if (map.has(key)) {
      const item = map.get(key);
      item.total += 1;

      if (color === "RED") item.red += 1;
      if (color === "YELLOW") item.yellow += 1;
      if (color === "GREEN") item.green += 1;
    }
  });

  return Array.from(map.values());
}

function getDailyStats(records) {
  const map = new Map();

  records.forEach((record) => {
    if (!record.created_at) return;

    const key = new Date(record.created_at).toISOString().slice(0, 10);
    const color = normalizeColor(record.color);
    const text = buildRecordSearchText(record);

    if (!map.has(key)) {
      map.set(key, {
        day: key,
        total: 0,
        red: 0,
        yellow: 0,
        green: 0,
        respiratory: 0,
        gastro: 0,
        heat: 0,
      });
    }

    const item = map.get(key);

    item.total += 1;

    if (color === "RED") item.red += 1;
    if (color === "YELLOW") item.yellow += 1;
    if (color === "GREEN") item.green += 1;

    if (
      text.includes("cough") ||
      text.includes("fever") ||
      text.includes("breath") ||
      text.includes("respiratory") ||
      text.includes("sore throat")
    ) {
      item.respiratory += 1;
    }

    if (
      text.includes("vomit") ||
      text.includes("diarrhea") ||
      text.includes("stomach") ||
      text.includes("abdominal") ||
      text.includes("gastro")
    ) {
      item.gastro += 1;
    }

    if (
      text.includes("heat") ||
      text.includes("thirst") ||
      text.includes("dry skin") ||
      text.includes("collapse")
    ) {
      item.heat += 1;
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.day) - new Date(b.day)
  );
}

export function getAnomalyInsights(records) {
  const dailyStats = getDailyStats(records);

  if (dailyStats.length === 0) {
    return [];
  }

  const averageVolume =
    dailyStats.reduce((sum, item) => sum + item.total, 0) / dailyStats.length;

  const averageRed =
    dailyStats.reduce((sum, item) => sum + item.red, 0) / dailyStats.length;

  return dailyStats
    .map((item) => {
      const volumeRatio = averageVolume > 0 ? item.total / averageVolume : 0;
      const redRatio = averageRed > 0 ? item.red / averageRed : 0;

      const clusterCandidates = [
        { label: "Respiratory cluster", value: item.respiratory },
        { label: "Gastrointestinal cluster", value: item.gastro },
        { label: "Heat-related cluster", value: item.heat },
      ].sort((a, b) => b.value - a.value);

      const topCluster = clusterCandidates[0];

      return {
        ...item,
        volumeRatio,
        redRatio,
        topCluster,
        score:
          volumeRatio +
          redRatio * 0.7 +
          topCluster.value / Math.max(item.total, 1),
      };
    })
    .filter((item) => item.volumeRatio >= 1.45 || item.redRatio >= 1.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export function getTopClinicalPattern(records) {
  const counts = {
    respiratory: 0,
    gastro: 0,
    heat: 0,
    cardiac: 0,
    neurological: 0,
  };

  records.forEach((record) => {
    const text = buildRecordSearchText(record);

    if (
      text.includes("cough") ||
      text.includes("fever") ||
      text.includes("breath") ||
      text.includes("respiratory") ||
      text.includes("sore throat")
    ) {
      counts.respiratory += 1;
    }

    if (
      text.includes("vomit") ||
      text.includes("diarrhea") ||
      text.includes("stomach") ||
      text.includes("abdominal") ||
      text.includes("gastro")
    ) {
      counts.gastro += 1;
    }

    if (
      text.includes("heat") ||
      text.includes("thirst") ||
      text.includes("dry skin") ||
      text.includes("collapse")
    ) {
      counts.heat += 1;
    }

    if (
      text.includes("chest") ||
      text.includes("cardiovascular") ||
      text.includes("cold sweating")
    ) {
      counts.cardiac += 1;
    }

    if (
      text.includes("weakness on one side") ||
      text.includes("trouble speaking") ||
      text.includes("neurological") ||
      text.includes("stroke")
    ) {
      counts.neurological += 1;
    }
  });

  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  const labels = {
    respiratory: "Respiratory symptoms",
    gastro: "Gastrointestinal symptoms",
    heat: "Heat-related symptoms",
    cardiac: "Cardiac warning signs",
    neurological: "Neurological warning signs",
  };

  return {
    label: labels[winner?.[0]] || "General triage symptoms",
    count: winner?.[1] || 0,
  };
}