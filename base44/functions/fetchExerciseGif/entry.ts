import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Map PT exercise name → ExerciseDB exercise ID
// GIF URL = https://static.exercisedb.dev/media/{id}.gif
const PT_TO_EXERCISEDB = {
  // Peito
  "supino reto": "EIeI8Vf",
  "supino barra": "EIeI8Vf",
  "bench press": "EIeI8Vf",
  "supino inclinado": "3_bRBo0",
  "supino declinado": "0nx8MtO",
  "supino fechado": "0I2dSGx",
  "supino halteres": "1J2GFMO",
  "supino reto halteres": "1J2GFMO",
  "supino inclinado halteres": "1LMzGsv",
  "crucifixo": "0nHFYPm",
  "crucifixo halteres": "0nHFYPm",
  "crucifixo inclinado": "1LMzGsv",
  "crucifixo maquina": "0ex3sXt",
  "crossover": "0CXGHya",
  "voador": "0ex3sXt",
  "peck deck": "0ex3sXt",
  "flexao": "0L3Bozp",
  "flexao de braco": "0L3Bozp",
  "push up": "0L3Bozp",
  "mergulho": "0K31Oqm",
  "dip peito": "0K31Oqm",
  // Costas
  "barra fixa": "0nHXWmW",
  "pullup": "0nHXWmW",
  "pull up": "0nHXWmW",
  "chin up": "3SNbvmH",
  "puxada": "0XTBZM2",
  "pulley": "0XTBZM2",
  "puxada frontal": "0XTBZM2",
  "puxada aberta": "0XTBZM2",
  "puxada fechada": "0XTBZM2",
  "pulldown": "0XTBZM2",
  "lat pulldown": "0XTBZM2",
  "remada curvada": "24oQWJ6",
  "remada barra": "24oQWJ6",
  "remada serrote": "1J2GL6v",
  "remada unilateral": "1J2GL6v",
  "remada halteres": "1J2GL6v",
  "remada baixa": "2J0GHsE",
  "remada sentada": "2J0GHsE",
  "remada polia": "2J0GHsE",
  "remada cavalinho": "3_bRBo3",
  "t bar": "3_bRBo3",
  "encolhimento": "0K31Jl9",
  "shrug": "0K31Jl9",
  "voador invertido": "0I2dSFm",
  "reverse fly": "0I2dSFm",
  "hiperextensao": "0L3Bomz",
  "hiperextensão": "0L3Bomz",
  "back extension": "0L3Bomz",
  // Ombros
  "desenvolvimento": "0dCyly0",
  "desenvolvimento barra": "0dCyly0",
  "overhead press": "0dCyly0",
  "desenvolvimento halteres": "1J2GHsq",
  "arnold": "0I5fBBR",
  "arnold press": "0I5fBBR",
  "elevacao lateral": "0I5fBcO",
  "elevação lateral": "0I5fBcO",
  "lateral raise": "0I5fBcO",
  "elevacao frontal": "0I5f4Lq",
  "elevação frontal": "0I5f4Lq",
  "front raise": "0I5f4Lq",
  "face pull": "2J0GMTR",
  // Bíceps
  "rosca direta": "0IgNhSM",
  "rosca barra": "0IgNhSM",
  "barbell curl": "0IgNhSM",
  "rosca halteres": "0IgNjSM",
  "rosca simultanea": "0IgNjSM",
  "rosca alternada": "0IgNjSM",
  "rosca martelo": "0IgNikf",
  "hammer curl": "0IgNikf",
  "rosca concentrada": "0IgNjAI",
  "concentration curl": "0IgNjAI",
  "rosca scott": "0IgNjUI",
  "preacher curl": "0IgNjUI",
  "rosca inclinada": "2J0GHsi",
  "rosca spider": "0IgNhS2",
  "rosca arrastada": "0IgNhS2",
  "drag curl": "0IgNhS2",
  "rosca polia": "2J0GHMF",
  "rosca na polia": "2J0GHMF",
  "cable curl": "2J0GHMF",
  "rosca zottman": "0IgNjSM",
  "chin": "3SNbvmH",
  // Tríceps
  "triceps testa": "24oQXL4",
  "skull crusher": "24oQXL4",
  "triceps corda": "2J0GMTi",
  "triceps polia": "2J0GMTi",
  "pushdown": "2J0GMTi",
  "triceps frances": "24oQXMk",
  "frances": "24oQXMk",
  "french press": "24oQXMk",
  "dip triceps": "0K31Oqm",
  "triceps aeronave": "0I5f8hq",
  "overhead extension": "0I5f8hq",
  "kickback triceps": "0I5fCpO",
  // Pernas
  "agachamento": "0lQnUGH",
  "squat": "0lQnUGH",
  "agachamento livre": "0lQnUGH",
  "leg press": "2J0GMLl",
  "cadeira extensora": "2J0GMMl",
  "extensao joelho": "2J0GMMl",
  "leg extension": "2J0GMMl",
  "mesa flexora": "2J0GMLc",
  "flexao joelho": "2J0GMLc",
  "leg curl": "2J0GMLc",
  "stiff": "24oQXK4",
  "romeno": "24oQXK4",
  "romanian deadlift": "24oQXK4",
  "afundo": "0lQnVFR",
  "lunge": "0lQnVFR",
  "hack squat": "2J0GMKl",
  "agachamento bulgaro": "3_bRBpB",
  "bulgaro": "3_bRBpB",
  "agachamento sumo": "0lQnXWn",
  "sumo": "0lQnXWn",
  // Glúteos
  "hip thrust": "3_bRBpK",
  "elevacao pelvica": "0L3BoWf",
  "glute bridge": "0L3BoWf",
  "kick back": "2J0GMG8",
  "kickback": "2J0GMG8",
  // Abdômen
  "abdominal": "0lQnUuF",
  "crunch": "0lQnUuF",
  "prancha": "0nHFXc8",
  "plank": "0nHFXc8",
  "elevacao de pernas": "2J0GMLv",
  "elevação de pernas": "2J0GMLv",
  "leg raise": "2J0GMLv",
  "russian twist": "0nHXYFO",
  "mountain climber": "0br3E38",
  // Panturrilha
  "panturrilha": "0jp9Rlz",
  "calf raise": "0jp9Rlz",
  "gemeos": "0jp9Rlz",
  "panturrilha sentado": "2J0GMMw",
  // Compostos
  "levantamento terra": "3_bRBq5",
  "deadlift": "3_bRBq5",
  "terra": "3_bRBq5",
  "farmer walk": "2J0GLC7",
  "burpee": "0JtKWum",
};

function norm(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function findExerciseId(exerciseName) {
  const n = norm(exerciseName);

  // 1. Exact
  for (const [pt, id] of Object.entries(PT_TO_EXERCISEDB)) {
    if (norm(pt) === n) return id;
  }

  // 2. Input contains key
  for (const [pt, id] of Object.entries(PT_TO_EXERCISEDB)) {
    const k = norm(pt);
    if (n.includes(k)) return id;
  }

  // 3. Key contains input
  for (const [pt, id] of Object.entries(PT_TO_EXERCISEDB)) {
    const k = norm(pt);
    if (k.includes(n)) return id;
  }

  // 4. Token overlap ≥ 40%
  const tokens = n.split(" ").filter(w => w.length > 2);
  let best = null, bestScore = 0;
  for (const [pt, id] of Object.entries(PT_TO_EXERCISEDB)) {
    const kt = norm(pt).split(" ").filter(w => w.length > 2);
    const shared = tokens.filter(t => kt.some(k => k === t || k.includes(t) || t.includes(k)));
    const score = shared.length / Math.max(tokens.length, kt.length, 1);
    if (score > bestScore && score >= 0.4) { bestScore = score; best = id; }
  }
  if (best) return best;

  // 5. Any single meaningful keyword
  const SKIP = new Set(["com", "de", "da", "do", "no", "na", "em", "para", "the", "with", "on"]);
  for (const t of tokens) {
    if (SKIP.has(t) || t.length < 4) continue;
    for (const [pt, id] of Object.entries(PT_TO_EXERCISEDB)) {
      if (norm(pt).includes(t)) return id;
    }
  }

  return null;
}

// Search full ExerciseDB (1500 exercises) using AI-translated English term
async function searchExerciseDB(englishTerm) {
  const keywords = norm(englishTerm).split(" ").filter(w => w.length > 2);
  let cursor = null;

  for (let page = 0; page < 15; page++) {
    const url = cursor
      ? `https://oss.exercisedb.dev/api/v1/exercises?limit=100&cursor=${cursor}`
      : `https://oss.exercisedb.dev/api/v1/exercises?limit=100`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) break;
    const json = await res.json();
    const exercises = json.data || [];

    let bestMatch = null, bestScore = 0;
    for (const ex of exercises) {
      const exNorm = norm(ex.name);
      const matched = keywords.filter(kw => exNorm.includes(kw));
      const score = matched.length / keywords.length;
      if (score > bestScore) { bestScore = score; bestMatch = ex; }
    }

    if (bestMatch && bestScore >= 0.5) return bestMatch.gifUrl;
    if (!json.meta?.hasNextPage) break;
    cursor = json.meta?.nextCursor;
  }
  return null;
}

async function aiTranslateAndSearch(exerciseName, base44) {
  // Use Base44's InvokeLLM (no quota issues)
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Translate this Portuguese gym exercise name to English. Return ONLY the standard English gym name (2-5 words, no extra text). Exercise: "${exerciseName}"`,
    model: "gpt_5_mini",
  });
  const englishTerm = typeof result === "string" ? result.trim() : String(result).trim();
  console.log(`[GIF] AI translated "${exerciseName}" → "${englishTerm}"`);
  return searchExerciseDB(englishTerm);
}

async function downloadAndUpload(sourceUrl, base44) {
  const res = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/gif,image/*,*/*' }
  });
  if (!res.ok) return null;
  const contentType = res.headers.get('content-type') || 'image/gif';
  if (contentType.includes('text/html')) return null;
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength < 500) return null;
  const file = new File([buffer], 'exercise.gif', { type: contentType });
  const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
  return result.file_url;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'personal')) {
      return Response.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const { exercise_name, direct_url } = body;

    if (!exercise_name && !direct_url) {
      return Response.json({ error: 'exercise_name ou direct_url é obrigatório' }, { status: 400 });
    }

    // Direct URL — proxy and re-host
    if (direct_url) {
      const hosted = await downloadAndUpload(direct_url, base44);
      return Response.json({ success: true, gif_url: hosted || direct_url, found: true });
    }

    // Step 1: Look up in our PT→ExerciseDB ID map
    const exerciseId = findExerciseId(exercise_name);
    if (exerciseId) {
      const gifUrl = `https://static.exercisedb.dev/media/${exerciseId}.gif`;
      console.log(`[GIF] Found ID ${exerciseId} for "${exercise_name}"`);
      const hosted = await downloadAndUpload(gifUrl, base44);
      if (hosted) {
        return Response.json({ success: true, gif_url: hosted, found: true, source: "exercisedb_map", exercise_name });
      }
    }

    // Step 2: AI translate → full ExerciseDB search
    const gifUrl = await aiTranslateAndSearch(exercise_name, base44).catch(() => null);
    if (gifUrl) {
      const hosted = await downloadAndUpload(gifUrl, base44);
      if (hosted) {
        return Response.json({ success: true, gif_url: hosted, found: true, source: "exercisedb_search", exercise_name });
      }
      return Response.json({ success: true, gif_url: gifUrl, found: true, source: "exercisedb_direct", exercise_name });
    }

    // Step 3: AI-generated image (guaranteed result, always works)
    console.log(`[GIF] Generating AI image for "${exercise_name}"`);
    const aiResult = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: `Professional fitness exercise diagram of "${exercise_name}". A person demonstrating correct exercise form. Clean white background, clear muscle activation diagram, gym instruction poster style.`
    });

    if (aiResult?.url) {
      return Response.json({ success: true, gif_url: aiResult.url, found: true, source: "ai_generated", exercise_name });
    }

    return Response.json({ success: true, gif_url: null, found: false, exercise_name });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});