import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Fallback static map for the most common exercises (normalized keys)
const STATIC_GIFS = {
  "rosca direta": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-direta.gif",
  "rosca simultanea": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-simultanea.gif",
  "rosca direta na polia": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-direta-polia.gif",
  "rosca concentrada": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-concentrada.gif",
  "rosca inclinada": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-inclinada.gif",
  "rosca spider": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-spider.gif",
  "rosca alternada": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-alternada.gif",
  "chin up": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/chin-up.gif",
  "rosca scott": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-scott.gif",
  "rosca martelo": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-martelo.gif",
  "rosca arrastada": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/drag-curl.gif",
  "drag curl": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/drag-curl.gif",
  "rosca zottman": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-zottman.gif",
  "barra fixa": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/pullup.gif",
  "pullup": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/pullup.gif",
  "pull up": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/pullup.gif",
  "pulley costas": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/cable-pulldown.gif",
  "puxada na polia": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/cable-pulldown.gif",
  "puxada frontal": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/cable-pulldown.gif",
  "puxada aberta": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/cable-pulldown.gif",
  "puxada fechada": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/pulldown.gif",
  "remada curvada": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/05/barbell-bent-over-row.gif",
  "remada serrote": "https://www.hipertrofia.org/blog/wp-content/uploads/2023/11/dumbbell-one-arm-bentover-row.gif",
  "remada unilateral": "https://www.hipertrofia.org/blog/wp-content/uploads/2023/11/dumbbell-one-arm-bentover-row.gif",
  "pull down": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/pulldown.gif",
  "pulldown": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/pulldown.gif",
  "remada baixa": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/cable-row.gif",
  "remada sentada": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/cable-row.gif",
  "remada cavalinho": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/t-bar-row.gif",
  "encolhimento": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/03/encolhimento-com-barra.gif",
  "voador invertido": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/reverse-fly.gif",
  "hiperextensao": "https://www.hipertrofia.org/blog/wp-content/uploads/2020/06/hiperextensao.gif",
  "supino reto": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-reto.gif",
  "supino inclinado": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-inclinado.gif",
  "supino declinado": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-declinado.gif",
  "supino fechado": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-fechado.gif",
  "supino halteres": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-reto-halteres.gif",
  "supino reto halteres": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-reto-halteres.gif",
  "supino inclinado halteres": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-inclinado-halteres.gif",
  "crossover": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/crossover.gif",
  "crucifixo": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/crucifixo.gif",
  "crucifixo inclinado": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/crucifixo.gif",
  "voador": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/voador-maquina.gif",
  "peck deck": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/voador-maquina.gif",
  "flexao de braco": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/flexao.gif",
  "flexao": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/flexao.gif",
  "push up": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/flexao.gif",
  "mergulho": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/mergulho.gif",
  "desenvolvimento barra": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/overhead-press.gif",
  "desenvolvimento halteres": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/dumbbell-shoulder-press.gif",
  "desenvolvimento": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/overhead-press.gif",
  "overhead press": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/overhead-press.gif",
  "arnold press": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/arnold-press.gif",
  "elevacao lateral": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/elevacao-lateral.gif",
  "elevacao frontal": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/elevacao-frontal.gif",
  "face pull": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/face-pull.gif",
  "triceps testa": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/skull-crusher.gif",
  "skull crusher": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/skull-crusher.gif",
  "triceps corda": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/triceps-corda.gif",
  "triceps polia": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/triceps-polia.gif",
  "triceps frances": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/triceps-frances.gif",
  "dip": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/dip.gif",
  "agachamento": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/agachamento.gif",
  "squat": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/agachamento.gif",
  "leg press": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/leg-press.gif",
  "extensao de joelho": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/extensao-joelho.gif",
  "cadeira extensora": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/extensao-joelho.gif",
  "flexao de joelho": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/leg-curl.gif",
  "leg curl": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/leg-curl.gif",
  "mesa flexora": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/leg-curl.gif",
  "stiff": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/stiff.gif",
  "romeno": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/stiff.gif",
  "romanian deadlift": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/stiff.gif",
  "afundo": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/afundo.gif",
  "lunge": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/afundo.gif",
  "hack squat": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/hack-squat.gif",
  "hip thrust": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/hip-thrust.gif",
  "elevacao pelvica": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/hip-thrust.gif",
  "agachamento sumo": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/agachamento-sumo.gif",
  "sumo": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/agachamento-sumo.gif",
  "kick back": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/kickback.gif",
  "kickback": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/kickback.gif",
  "abdominail": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/abdominal-crunch.gif",
  "abdominal": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/abdominal-crunch.gif",
  "crunch": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/abdominal-crunch.gif",
  "prancha": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/prancha.gif",
  "plank": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/prancha.gif",
  "elevacao de pernas": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/elevacao-pernas.gif",
  "russian twist": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/russian-twist.gif",
  "panturrilha": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/calf-raise.gif",
  "calf raise": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/calf-raise.gif",
  "gemeos": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/calf-raise.gif",
  "rosca punho": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/02/rosca-punho.gif",
  "farmer walk": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/02/farmer-walk.gif",
  "levantamento terra": "https://www.hipertrofia.org/blog/wp-content/uploads/deadlift.gif",
  "deadlift": "https://www.hipertrofia.org/blog/wp-content/uploads/deadlift.gif",
  "terra": "https://www.hipertrofia.org/blog/wp-content/uploads/deadlift.gif",
  "burpee": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/burpee.gif",
  "mountain climber": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/mountain-climber.gif",
};

function norm(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Improved matching: exact → substring → token overlap → single keyword
function findInStatic(exerciseName) {
  const n = norm(exerciseName);
  const entries = Object.entries(STATIC_GIFS);

  // 1. Exact match
  for (const [key, url] of entries) {
    if (norm(key) === n) return url;
  }

  // 2. Input contains key OR key contains input (substring)
  for (const [key, url] of entries) {
    const k = norm(key);
    if (n.includes(k) || k.includes(n)) return url;
  }

  // 3. Token overlap ≥ 60%
  const tokens = n.split(" ").filter(w => w.length > 2);
  let best = null, bestScore = 0;
  for (const [key, url] of entries) {
    const kt = norm(key).split(" ").filter(w => w.length > 2);
    const shared = tokens.filter(t => kt.some(k => k === t || k.includes(t) || t.includes(k)));
    const score = shared.length / Math.max(tokens.length, kt.length, 1);
    if (score > bestScore && score >= 0.55) { bestScore = score; best = url; }
  }
  if (best) return best;

  // 4. Any single meaningful keyword match
  const SKIP = new Set(["com", "de", "da", "do", "no", "na", "em", "para", "por", "the", "on", "in", "with"]);
  for (const t of tokens) {
    if (SKIP.has(t) || t.length < 4) continue;
    for (const [key, url] of entries) {
      if (norm(key).includes(t)) return url;
    }
  }

  return null;
}

// Try fetching from ExerciseDB public API (no key required for basic use)
async function searchExerciseDB(exerciseName) {
  const query = encodeURIComponent(norm(exerciseName).replace(/\s+/g, " "));
  const url = `https://exercisedb.p.rapidapi.com/exercises/name/${query}?limit=1`;
  // No key — will likely 401, but worth a try on public tier
  const res = await fetch(url, { headers: { "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" } });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.gifUrl || null;
}

// wger.de open API — no auth needed
async function searchWger(exerciseName) {
  const query = encodeURIComponent(exerciseName);
  const url = `https://wger.de/api/v2/exercise/search/?term=${query}&language=portuguese&format=json`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  const suggestions = data?.suggestions;
  if (!suggestions?.length) return null;
  // Get exercise detail
  const ex = suggestions[0]?.data;
  const exerciseId = ex?.id;
  if (!exerciseId) return null;
  // Try to get images
  const imgRes = await fetch(`https://wger.de/api/v2/exerciseimage/?exercise=${exerciseId}&format=json`);
  if (!imgRes.ok) return null;
  const imgData = await imgRes.json();
  return imgData?.results?.[0]?.image || null;
}

async function downloadAndUpload(sourceUrl, base44) {
  const gifResponse = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.hipertrofia.org/',
      'Accept': 'image/gif,image/*,*/*;q=0.8',
    }
  });
  if (!gifResponse.ok) return null;
  const contentType = gifResponse.headers.get('content-type') || 'image/gif';
  if (contentType.includes('text/html')) return null; // hotlink blocked
  const buffer = await gifResponse.arrayBuffer();
  if (buffer.byteLength < 1000) return null; // too small = likely error page
  const file = new File([buffer], 'exercise.gif', { type: contentType });
  const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
  return uploadResult.file_url;
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

    // Direct URL provided — just proxy it
    if (direct_url) {
      const hosted = await downloadAndUpload(direct_url, base44);
      const finalUrl = hosted || direct_url;
      return Response.json({ success: true, gif_url: finalUrl, found: true });
    }

    // Step 1: Static map lookup (fast, no external call)
    const staticUrl = findInStatic(exercise_name);
    if (staticUrl) {
      const hosted = await downloadAndUpload(staticUrl, base44);
      if (hosted) {
        return Response.json({ success: true, gif_url: hosted, found: true, source: "static", exercise_name });
      }
    }

    // Step 2: wger.de open API
    const wgerUrl = await searchWger(exercise_name).catch(() => null);
    if (wgerUrl) {
      const hosted = await downloadAndUpload(wgerUrl, base44);
      if (hosted) {
        return Response.json({ success: true, gif_url: hosted, found: true, source: "wger", exercise_name });
      }
    }

    // Step 3: AI-generated image as last resort (guaranteed result)
    const aiResult = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: `Realistic fitness diagram showing the exercise "${exercise_name}". Clear white background, anatomical style illustration showing correct form and muscle engagement. Professional gym instruction poster style.`
    });

    if (aiResult?.url) {
      return Response.json({ success: true, gif_url: aiResult.url, found: true, source: "ai_generated", exercise_name });
    }

    return Response.json({ success: true, gif_url: null, found: false, exercise_name });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});