import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Lista de síntomas
const symptomsList = [
  "fever",
  "headache",
  "cough",
  "chest pain",
  "shortness of breath",
  "nausea",
];

// Función para elegir random
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generador de registros
function generateRecord() {
  const rand = Math.random();

  let color = "GREEN";
  if (rand < 0.05) color = "RED";
  else if (rand < 0.30) color = "YELLOW";

  return {
    nombre: "Paciente simulado",
    sintomas: randomItem(symptomsList),
    color: color,
    mensaje: "Auto generated",
    reasons: [],
    red_flags: [],
    created_at: new Date().toISOString(),
  };
}

// Inserción en batches
async function insertData() {
  const batchSize = 100;
  const total = 1500;

  for (let i = 0; i < total; i += batchSize) {
    const batch = [];

    for (let j = 0; j < batchSize; j++) {
      batch.push(generateRecord());
    }

    const { error } = await supabase
      .from('triage_records')
      .insert(batch);

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log(`✅ Inserted ${i + batchSize}`);
  }

  console.log("🚀 Done!");
}

// Ejecutar
insertData();