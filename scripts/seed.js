// scripts/seed.js
// MediFlow AI - Realistic English demo data generator
// Generates 5000 triage records across the last 3 months by default.
//
// Run:
// node scripts/seed.js
//
// Recommended clean run:
// CLEAR_TRIAGE_RECORDS=true node scripts/seed.js
//
// Windows PowerShell:
// $env:CLEAR_TRIAGE_RECORDS="true"; node scripts/seed.js
//
// Optional controls:
// TOTAL_RECORDS=5000
// SEED_DAYS_BACK=90
// SEED_START_DATE=2026-02-07
// SEED_END_DATE=2026-05-07
// BATCH_SIZE=500
// SEED=20260507

try {
  require("dotenv").config({ path: ".env.local" });
  require("dotenv").config({ path: ".env" });
} catch {
  // dotenv is optional, but recommended
}

const { createClient } = require("@supabase/supabase-js");

const CONFIG = {
  TABLE_NAME: "triage_records",
  TOTAL_RECORDS: Number(process.env.TOTAL_RECORDS || 5000),
  DAYS_BACK: Number(process.env.SEED_DAYS_BACK || 90),
  START_DATE: process.env.SEED_START_DATE || null,
  END_DATE: process.env.SEED_END_DATE || null,
  BATCH_SIZE: Number(process.env.BATCH_SIZE || 500),
  CLEAR_OLD_DATA: String(process.env.CLEAR_TRIAGE_RECORDS || "false") === "true",
  SEED: Number(process.env.SEED || 20260507),
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

if (!SUPABASE_KEY) {
  console.error(
    "❌ Missing Supabase key. Recommended: SUPABASE_SERVICE_ROLE_KEY for seeding."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --------------------------------------------------
// Deterministic random generator
// This makes the seed reproducible.
// --------------------------------------------------
let internalSeed = CONFIG.SEED;

function random() {
  internalSeed = (internalSeed * 1664525 + 1013904223) % 4294967296;
  return internalSeed / 4294967296;
}

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pickOne(items) {
  return items[Math.floor(random() * items.length)];
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let value = random() * total;

  for (const item of items) {
    value -= item.weight;
    if (value <= 0) return item.value;
  }

  return items[items.length - 1].value;
}

// --------------------------------------------------
// Patient names
// --------------------------------------------------
const FIRST_NAMES = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Charles",
  "Karen",
  "Daniel",
  "Nancy",
  "Matthew",
  "Lisa",
  "Anthony",
  "Betty",
  "Mark",
  "Sandra",
  "Donald",
  "Ashley",
  "Steven",
  "Kimberly",
  "Paul",
  "Emily",
  "Andrew",
  "Donna",
  "Joshua",
  "Michelle",
  "Kevin",
  "Carol",
  "Brian",
  "Amanda",
  "George",
  "Melissa",
  "Edward",
  "Deborah",
  "Ronald",
  "Stephanie",
  "Timothy",
  "Rebecca",
  "Jason",
  "Laura",
  "Jeffrey",
  "Sharon",
  "Ryan",
  "Cynthia",
  "Jacob",
  "Kathleen",
  "Gary",
  "Amy",
  "Nicholas",
  "Angela",
  "Eric",
  "Shirley",
  "Jonathan",
  "Brenda",
  "Stephen",
  "Emma",
  "Larry",
  "Olivia",
  "Justin",
  "Sophia",
  "Scott",
  "Isabella",
  "Brandon",
  "Mia",
  "Benjamin",
  "Charlotte",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
];

function generatePatientName() {
  return `${pickOne(FIRST_NAMES)} ${pickOne(LAST_NAMES)}`;
}

// --------------------------------------------------
// Clinical scenarios in English
// --------------------------------------------------
const GREEN_SCENARIOS = [
  {
    sintomas: "Mild sore throat, nasal congestion, and dry cough since yesterday.",
    mensaje:
      "Low-risk case. The patient can receive general guidance and routine follow-up if symptoms worsen.",
    reasons: [
      "Symptoms suggest a mild upper respiratory condition.",
      "No emergency warning signs were reported.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Mild headache, fatigue, and general discomfort without fever.",
    mensaje:
      "Low-risk case. Rest, hydration, and observation are recommended.",
    reasons: [
      "The headache is mild and not associated with neurological symptoms.",
      "No high fever or breathing difficulty was reported.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Mild nausea after eating, without persistent vomiting or severe abdominal pain.",
    mensaje:
      "Low-risk case. The patient can be monitored with general supportive care.",
    reasons: [
      "Digestive symptoms are mild.",
      "No severe abdominal pain or dehydration symptoms were reported.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Mild muscle pain after physical activity.",
    mensaje:
      "Low-risk case. No urgent medical evaluation is required at this time.",
    reasons: [
      "Pain appears related to physical exertion.",
      "No systemic warning signs were reported.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Localized skin irritation with mild itching and no facial swelling.",
    mensaje:
      "Low-risk case. Observation and non-urgent care are appropriate if symptoms persist.",
    reasons: [
      "The skin reaction appears localized.",
      "No signs of severe allergic reaction were reported.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Mild back pain after lifting a heavy object, no numbness or weakness.",
    mensaje:
      "Low-risk case. The patient may need non-urgent guidance and symptom monitoring.",
    reasons: [
      "Pain is associated with a mechanical trigger.",
      "No weakness, numbness, or loss of bladder control was reported.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Runny nose, sneezing, and mild watery eyes.",
    mensaje:
      "Low-risk case. Symptoms are consistent with a mild allergy or cold-like presentation.",
    reasons: [
      "Symptoms are mild and localized.",
      "No fever or respiratory distress was reported.",
    ],
    red_flags: [],
  },
];

const YELLOW_SCENARIOS = [
  {
    sintomas: "Fever of 101.8°F, persistent cough, body aches, and fatigue.",
    mensaje:
      "Moderate-risk case. Same-day medical evaluation or close follow-up is recommended.",
    reasons: [
      "Fever and persistent cough may indicate a respiratory infection.",
      "The patient should be evaluated if fever continues or symptoms worsen.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Moderate abdominal pain for several hours with nausea.",
    mensaje:
      "Moderate-risk case. Medical evaluation is recommended to rule out complications.",
    reasons: [
      "Persistent abdominal pain requires clinical assessment.",
      "Nausea increases the need for monitoring and evaluation.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Frequent dizziness, weakness, and feeling faint when standing.",
    mensaje:
      "Moderate-risk case. The patient should be evaluated for hydration, blood pressure, or other causes.",
    reasons: [
      "Recurring dizziness may be related to several clinical conditions.",
      "Persistent weakness requires medical review.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Severe ear pain, low-grade fever, and pressure in the ear.",
    mensaje:
      "Moderate-risk case. Non-emergency medical evaluation is recommended.",
    reasons: [
      "Severe ear pain may require treatment.",
      "Fever suggests a possible infection.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Repeated vomiting during the day, intense thirst, and fatigue.",
    mensaje:
      "Moderate-risk case. Evaluation is recommended due to possible dehydration.",
    reasons: [
      "Repeated vomiting can lead to dehydration.",
      "Intense thirst and fatigue require monitoring.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Worsening sore throat, swollen glands, fever, and difficulty swallowing.",
    mensaje:
      "Moderate-risk case. The patient should receive same-day or next-day evaluation.",
    reasons: [
      "Worsening throat symptoms with fever may require clinical evaluation.",
      "Difficulty swallowing increases the level of concern.",
    ],
    red_flags: [],
  },
  {
    sintomas: "Painful urination, lower abdominal discomfort, and chills.",
    mensaje:
      "Moderate-risk case. Medical evaluation is recommended for possible infection.",
    reasons: [
      "Urinary symptoms with chills may indicate infection.",
      "Timely evaluation may prevent worsening symptoms.",
    ],
    red_flags: [],
  },
];

const RED_SCENARIOS = [
  {
    sintomas: "Chest pain, shortness of breath, cold sweating, and nausea.",
    mensaje: "Critical case. Immediate medical attention is required.",
    reasons: [
      "Chest pain with breathing difficulty is an emergency warning sign.",
      "Symptoms may be associated with a cardiovascular emergency.",
    ],
    red_flags: ["chest_pain", "shortness_of_breath"],
  },
  {
    sintomas: "Severe difficulty breathing, bluish lips, and confusion.",
    mensaje: "Critical case. Immediate medical attention is required.",
    reasons: [
      "Severe breathing difficulty is an emergency warning sign.",
      "Confusion may indicate low oxygen levels or another serious condition.",
    ],
    red_flags: ["severe_breathing_difficulty", "confusion"],
  },
  {
    sintomas:
      "Sudden weakness on one side of the body, trouble speaking, and severe headache.",
    mensaje:
      "Critical case. Immediate evaluation is required due to possible neurological emergency.",
    reasons: [
      "One-sided weakness and trouble speaking are major warning signs.",
      "Symptoms may indicate a stroke-like event.",
    ],
    red_flags: ["one_sided_weakness", "trouble_speaking"],
  },
  {
    sintomas: "Heavy bleeding after an injury, dizziness, and pale skin.",
    mensaje: "Critical case. Immediate medical attention is required.",
    reasons: [
      "Heavy bleeding may compromise the patient's stability.",
      "Dizziness and pale skin may suggest significant blood loss.",
    ],
    red_flags: ["heavy_bleeding", "dizziness"],
  },
  {
    sintomas: "Severe abdominal pain, high fever, and rigid abdomen.",
    mensaje: "Critical case. Immediate medical attention is required.",
    reasons: [
      "Severe abdominal pain with high fever may indicate an abdominal emergency.",
      "A rigid abdomen is a serious clinical warning sign.",
    ],
    red_flags: ["severe_abdominal_pain", "high_fever"],
  },
  {
    sintomas:
      "Severe allergic reaction with facial swelling, wheezing, and difficulty breathing.",
    mensaje: "Critical case. Immediate medical attention is required.",
    reasons: [
      "Facial swelling with breathing difficulty may indicate anaphylaxis.",
      "Wheezing and respiratory symptoms require urgent intervention.",
    ],
    red_flags: ["facial_swelling", "wheezing", "difficulty_breathing"],
  },
  {
    sintomas: "Loss of consciousness, confusion after waking, and repeated vomiting.",
    mensaje: "Critical case. Immediate medical attention is required.",
    reasons: [
      "Loss of consciousness is an emergency warning sign.",
      "Confusion and repeated vomiting require urgent evaluation.",
    ],
    red_flags: ["loss_of_consciousness", "confusion", "repeated_vomiting"],
  },
];

const RESPIRATORY_CLUSTER_SCENARIOS = [
  {
    sintomas: "Fever, persistent cough, nasal congestion, and intense fatigue.",
    mensaje:
      "Moderate-risk case within an elevated respiratory pattern. Evaluation and follow-up are recommended.",
    reasons: [
      "Symptoms are consistent with a respiratory infection.",
      "This case belongs to a simulated increase in respiratory complaints.",
    ],
    red_flags: [],
    color: "YELLOW",
  },
  {
    sintomas: "Strong cough, fever of 102.2°F, sore throat, and body aches.",
    mensaje:
      "Moderate-risk case. Same-day evaluation is recommended if symptoms persist.",
    reasons: [
      "High fever and persistent cough increase the level of concern.",
      "The patient may require testing or clinical follow-up.",
    ],
    red_flags: [],
    color: "YELLOW",
  },
  {
    sintomas: "Shortness of breath, high fever, and persistent cough.",
    mensaje:
      "Critical respiratory case. Immediate medical attention is required.",
    reasons: [
      "Shortness of breath is an emergency warning sign.",
      "High fever with respiratory compromise requires rapid evaluation.",
    ],
    red_flags: ["shortness_of_breath", "high_fever"],
    color: "RED",
  },
];

const GASTRO_CLUSTER_SCENARIOS = [
  {
    sintomas: "Vomiting, diarrhea, stomach cramps, and weakness after eating.",
    mensaje:
      "Moderate-risk case within a gastrointestinal pattern. Hydration and evaluation may be needed.",
    reasons: [
      "Vomiting and diarrhea may lead to dehydration.",
      "Cluster pattern suggests a possible food-related increase in cases.",
    ],
    red_flags: [],
    color: "YELLOW",
  },
  {
    sintomas:
      "Severe vomiting, dizziness, dry mouth, and inability to keep fluids down.",
    mensaje:
      "Critical dehydration risk. Immediate medical evaluation is recommended.",
    reasons: [
      "Inability to keep fluids down increases dehydration risk.",
      "Dizziness and dry mouth are concerning signs.",
    ],
    red_flags: ["possible_dehydration", "persistent_vomiting"],
    color: "RED",
  },
];

const HEAT_CLUSTER_SCENARIOS = [
  {
    sintomas: "Dizziness, headache, intense thirst, and weakness after heat exposure.",
    mensaje:
      "Moderate-risk heat-related case. Cooling, hydration, and evaluation are recommended.",
    reasons: [
      "Heat exposure with weakness may indicate heat exhaustion.",
      "Dizziness and intense thirst require monitoring.",
    ],
    red_flags: [],
    color: "YELLOW",
  },
  {
    sintomas: "Confusion, very high temperature, dry skin, and collapse after heat exposure.",
    mensaje:
      "Critical heat-related case. Immediate medical attention is required.",
    reasons: [
      "Confusion and collapse after heat exposure are emergency warning signs.",
      "Symptoms may indicate heat stroke.",
    ],
    red_flags: ["confusion", "collapse", "possible_heat_stroke"],
    color: "RED",
  },
];

// --------------------------------------------------
// Date controls
// --------------------------------------------------
function parseDateOnly(value, label) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    console.error(`❌ Invalid ${label}: ${value}. Use YYYY-MM-DD.`);
    process.exit(1);
  }

  return date;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function getDateRange() {
  const end = CONFIG.END_DATE
    ? endOfDay(parseDateOnly(CONFIG.END_DATE, "SEED_END_DATE"))
    : endOfDay(new Date());

  const start = CONFIG.START_DATE
    ? startOfDay(parseDateOnly(CONFIG.START_DATE, "SEED_START_DATE"))
    : (() => {
      const date = startOfDay(end);
      date.setDate(date.getDate() - CONFIG.DAYS_BACK + 1);
      return date;
    })();

  if (start > end) {
    console.error("❌ SEED_START_DATE cannot be after SEED_END_DATE.");
    process.exit(1);
  }

  return { start, end };
}

function getDaysBetween(start, end) {
  const days = [];
  const cursor = startOfDay(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

// --------------------------------------------------
// Realistic distribution
// --------------------------------------------------
function buildDayProfiles() {
  const { start, end } = getDateRange();
  const dates = getDaysBetween(start, end);
  const totalDays = dates.length;

  const anomalyOffsets = new Set([
    Math.floor(totalDays * 0.18),
    Math.floor(totalDays * 0.43),
    Math.floor(totalDays * 0.69),
    Math.max(totalDays - 5, 0),
  ]);

  return dates.map((date, offset) => {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isMonday = dayOfWeek === 1;
    const isFriday = dayOfWeek === 5;
    const isRecent = offset >= totalDays - 10;
    const isAnomalyDay = anomalyOffsets.has(offset);

    let anomalyType = null;

    if (isAnomalyDay) {
      anomalyType = pickWeighted([
        { value: "respiratory", weight: 55 },
        { value: "gastro", weight: 25 },
        { value: "heat", weight: 20 },
      ]);
    }

    let weight = 1;

    // Fewer non-urgent visits on weekends
    if (isWeekend) weight *= 0.72;

    // Mondays are often heavier
    if (isMonday) weight *= 1.2;

    // Fridays slightly higher
    if (isFriday) weight *= 1.08;

    // Recent days look active in the dashboard
    if (isRecent) weight *= 1.15;

    // Anomaly days have visible spikes
    if (isAnomalyDay) weight *= 2.35;

    // Controlled noise
    weight *= 0.75 + random() * 0.65;

    return {
      date,
      offset,
      weight,
      isWeekend,
      isMonday,
      isFriday,
      isRecent,
      isAnomalyDay,
      anomalyType,
      count: 0,
    };
  });
}

function distributeRecordsAcrossDays() {
  const days = buildDayProfiles();
  const totalWeight = days.reduce((sum, day) => sum + day.weight, 0);

  let assigned = 0;

  for (const day of days) {
    day.count = Math.floor((day.weight / totalWeight) * CONFIG.TOTAL_RECORDS);
    assigned += day.count;
  }

  while (assigned < CONFIG.TOTAL_RECORDS) {
    const day = pickWeighted(days.map((d) => ({ value: d, weight: d.weight })));
    day.count += 1;
    assigned += 1;
  }

  return days;
}

function pickColorForDay(day) {
  if (day.isAnomalyDay) {
    return pickWeighted([
      { value: "GREEN", weight: 30 },
      { value: "YELLOW", weight: 52 },
      { value: "RED", weight: 18 },
    ]);
  }

  if (day.isRecent) {
    return pickWeighted([
      { value: "GREEN", weight: 46 },
      { value: "YELLOW", weight: 40 },
      { value: "RED", weight: 14 },
    ]);
  }

  return pickWeighted([
    { value: "GREEN", weight: 54 },
    { value: "YELLOW", weight: 36 },
    { value: "RED", weight: 10 },
  ]);
}

function pickScenario(color, day) {
  if (day.isAnomalyDay && random() < 0.66) {
    let pool = RESPIRATORY_CLUSTER_SCENARIOS;

    if (day.anomalyType === "gastro") pool = GASTRO_CLUSTER_SCENARIOS;
    if (day.anomalyType === "heat") pool = HEAT_CLUSTER_SCENARIOS;

    const matchingColor = pool.filter((scenario) => scenario.color === color);

    if (matchingColor.length > 0 && random() < 0.75) {
      return pickOne(matchingColor);
    }

    return pickOne(pool);
  }

  if (color === "RED") return pickOne(RED_SCENARIOS);
  if (color === "YELLOW") return pickOne(YELLOW_SCENARIOS);

  return pickOne(GREEN_SCENARIOS);
}

function pickRealisticHour(color) {
  const group =
    color === "RED"
      ? pickWeighted([
        { value: "morning", weight: 26 },
        { value: "afternoon", weight: 28 },
        { value: "evening", weight: 23 },
        { value: "night", weight: 23 },
      ])
      : pickWeighted([
        { value: "morning", weight: 39 },
        { value: "afternoon", weight: 35 },
        { value: "evening", weight: 19 },
        { value: "night", weight: 7 },
      ]);

  if (group === "morning") return randomInt(8, 11);
  if (group === "afternoon") return randomInt(12, 17);
  if (group === "evening") return randomInt(18, 22);

  return pickOne([0, 1, 2, 3, 4, 5, 6, 23]);
}

function buildCreatedAt(day, color) {
  const date = new Date(day.date);
  const hour = pickRealisticHour(color);

  date.setHours(hour);
  date.setMinutes(randomInt(0, 59));
  date.setSeconds(randomInt(0, 59));
  date.setMilliseconds(0);

  return date.toISOString();
}

function generateRecord(day) {
  const selectedColor = pickColorForDay(day);
  const scenario = pickScenario(selectedColor, day);
  const finalColor = scenario.color || selectedColor;

  return {
    nombre: generatePatientName(),
    sintomas: scenario.sintomas,
    color: finalColor,
    mensaje: scenario.mensaje,
    reasons: scenario.reasons,
    red_flags: scenario.red_flags,
    created_at: buildCreatedAt(day, finalColor),
  };
}

// --------------------------------------------------
// Supabase operations
// --------------------------------------------------
async function clearOldData() {
  console.log("🧹 CLEAR_TRIAGE_RECORDS=true detected.");
  console.log("🧹 Deleting existing triage records...");

  const { error } = await supabase
    .from(CONFIG.TABLE_NAME)
    .delete()
    .not("created_at", "is", null);

  if (error) {
    console.error("❌ Error deleting old records:");
    console.error(error);
    process.exit(1);
  }

  console.log("✅ Existing triage records deleted.");
}

async function insertInBatches(records) {
  let inserted = 0;

  for (let i = 0; i < records.length; i += CONFIG.BATCH_SIZE) {
    const batch = records.slice(i, i + CONFIG.BATCH_SIZE);

    const { error } = await supabase.from(CONFIG.TABLE_NAME).insert(batch);

    if (error) {
      console.error(`❌ Error inserting batch starting at index ${i}:`);
      console.error(error);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`✅ Inserted ${inserted}/${records.length}`);
  }
}

function printSummary(records, days) {
  const counts = records.reduce(
    (acc, record) => {
      acc.total += 1;
      acc[record.color] += 1;
      return acc;
    },
    { total: 0, RED: 0, YELLOW: 0, GREEN: 0 }
  );

  const sortedDates = records
    .map((record) => record.created_at)
    .sort((a, b) => new Date(a) - new Date(b));

  const anomalyDays = days
    .filter((day) => day.isAnomalyDay)
    .map((day) => ({
      date: day.date.toISOString().slice(0, 10),
      type: day.anomalyType,
      count: day.count,
    }));

  console.log("");
  console.log("📊 Seed summary");
  console.log("---------------");
  console.log(`Total records: ${counts.total}`);
  console.log(`GREEN: ${counts.GREEN}`);
  console.log(`YELLOW: ${counts.YELLOW}`);
  console.log(`RED: ${counts.RED}`);
  console.log(`First record date: ${sortedDates[0]}`);
  console.log(`Last record date: ${sortedDates[sortedDates.length - 1]}`);
  console.log("");
  console.log("⚠️ Simulated anomaly days:");
  console.table(anomalyDays);
  console.log("");
}

async function main() {
  console.log("🚀 MediFlow AI seed started");
  console.log(`Records: ${CONFIG.TOTAL_RECORDS}`);
  console.log(`Table: ${CONFIG.TABLE_NAME}`);

  const { start, end } = getDateRange();

  console.log(`Start date: ${start.toISOString().slice(0, 10)}`);
  console.log(`End date: ${end.toISOString().slice(0, 10)}`);
  console.log("");

  if (CONFIG.CLEAR_OLD_DATA) {
    await clearOldData();
  }

  const days = distributeRecordsAcrossDays();

  const records = days.flatMap((day) =>
    Array.from({ length: day.count }, () => generateRecord(day))
  );

  records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  await insertInBatches(records);

  printSummary(records, days);

  console.log("🎉 Seed completed successfully.");
}

main().catch((error) => {
  console.error("❌ Unexpected seed error:");
  console.error(error);
  process.exit(1);
});