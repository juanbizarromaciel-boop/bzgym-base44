import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EXERCISE_GIFS = {
  // Bíceps
  "rosca direta": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-direta.gif",
  "rosca simultanea": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-simultanea.gif",
  "rosca simultânea": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/04/rosca-simultanea.gif",
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

  // Costas
  "barra fixa": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/pullup.gif",
  "pulley costas": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/cable-pulldown.gif",
  "puxada na polia": "https://www.hipertrofia.org/blog/wp-content/uploads/2019/05/cable-pulldown.gif",
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
  "hiperextensão": "https://www.hipertrofia.org/blog/wp-content/uploads/2020/06/hiperextensao.gif",

  // Peito
  "supino reto": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-reto.gif",
  "supino inclinado": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-inclinado.gif",
  "supino declinado": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-declinado.gif",
  "supino reto com halteres": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-reto-halteres.gif",
  "supino inclinado com halteres": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/supino-inclinado-halteres.gif",
  "crossover": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/crossover.gif",
  "crucifixo": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/crucifixo.gif",
  "voador": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/voador-maquina.gif",
  "flexao de braco": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/flexao.gif",
  "flexão de braço": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/flexao.gif",
  "mergulho": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/12/mergulho.gif",

  // Ombros
  "desenvolvimento com barra": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/overhead-press.gif",
  "desenvolvimento com halteres": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/dumbbell-shoulder-press.gif",
  "elevacao lateral": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/elevacao-lateral.gif",
  "elevação lateral": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/elevacao-lateral.gif",
  "elevacao frontal": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/elevacao-frontal.gif",
  "elevação frontal": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/elevacao-frontal.gif",
  "arnold press": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/arnold-press.gif",
  "face pull": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/face-pull.gif",

  // Tríceps
  "triceps testa": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/skull-crusher.gif",
  "tríceps testa": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/skull-crusher.gif",
  "skull crusher": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/skull-crusher.gif",
  "triceps corda": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/triceps-corda.gif",
  "tríceps corda": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/triceps-corda.gif",
  "triceps polia": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/triceps-polia.gif",
  "tríceps polia": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/triceps-polia.gif",
  "triceps frances": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/triceps-frances.gif",
  "tríceps francês": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/triceps-frances.gif",
  "dip": "https://www.hipertrofia.org/blog/wp-content/uploads/exercicios-para-triceps/dip.gif",

  // Pernas
  "agachamento": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/agachamento.gif",
  "leg press": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/leg-press.gif",
  "extensao de joelho": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/extensao-joelho.gif",
  "extensão de joelho": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/extensao-joelho.gif",
  "flexao de joelho": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/leg-curl.gif",
  "flexão de joelho": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/leg-curl.gif",
  "leg curl": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/leg-curl.gif",
  "stiff": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/stiff.gif",
  "afundo": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/afundo.gif",
  "hack squat": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/hack-squat.gif",
  "cadeira extensora": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/07/extensao-joelho.gif",

  // Glúteos
  "hip thrust": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/hip-thrust.gif",
  "elevacao pelvica": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/hip-thrust.gif",
  "elevação pélvica": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/hip-thrust.gif",
  "agachamento sumô": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/agachamento-sumo.gif",
  "agachamento sumo": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/agachamento-sumo.gif",
  "kick back": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/09/kickback.gif",

  // Abdômen
  "abdominal": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/abdominal-crunch.gif",
  "crunch": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/abdominal-crunch.gif",
  "prancha": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/prancha.gif",
  "elevacao de pernas": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/elevacao-pernas.gif",
  "elevação de pernas": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/elevacao-pernas.gif",
  "russian twist": "https://www.hipertrofia.org/blog/wp-content/uploads/2017/09/russian-twist.gif",

  // Panturrilha
  "panturrilha em pe": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/calf-raise.gif",
  "panturrilha em pé": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/calf-raise.gif",
  "calf raise": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/calf-raise.gif",
  "gêmeos": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/calf-raise.gif",
  "gemeos": "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/calf-raise.gif",

  // Antebraço
  "rosca punho": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/02/rosca-punho.gif",
  "farmer walk": "https://www.hipertrofia.org/blog/wp-content/uploads/2018/02/farmer-walk.gif",

  // Compostos
  "levantamento terra": "https://www.hipertrofia.org/blog/wp-content/uploads/deadlift.gif",
  "deadlift": "https://www.hipertrofia.org/blog/wp-content/uploads/deadlift.gif",
};

function normalizeExerciseName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function findGifUrl(exerciseName) {
  const normalized = normalizeExerciseName(exerciseName);

  for (const [key, url] of Object.entries(EXERCISE_GIFS)) {
    if (normalizeExerciseName(key) === normalized) return url;
  }

  for (const [key, url] of Object.entries(EXERCISE_GIFS)) {
    const normalKey = normalizeExerciseName(key);
    if (normalized.includes(normalKey) || normalKey.includes(normalized)) return url;
  }

  const words = normalized.split(" ").filter(w => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, url] of Object.entries(EXERCISE_GIFS)) {
    const keyWords = normalizeExerciseName(key).split(" ").filter(w => w.length > 2);
    const matches = words.filter(w => keyWords.some(kw => kw.includes(w) || w.includes(kw)));
    const score = matches.length / Math.max(words.length, keyWords.length);
    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = url;
    }
  }

  return bestMatch;
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

    // If a direct URL was provided (e.g. user pasted a hipertrofia.org URL), proxy it directly
    if (direct_url) {
      const gifResponse = await fetch(direct_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.hipertrofia.org/',
          'Accept': 'image/gif,image/*,*/*;q=0.8',
        }
      });
      if (gifResponse.ok) {
        const contentType = gifResponse.headers.get('content-type') || 'image/gif';
        const buffer = await gifResponse.arrayBuffer();
        const file = new File([buffer], 'exercise.gif', { type: contentType });
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        return Response.json({ success: true, gif_url: uploadResult.file_url, found: true });
      }
      return Response.json({ success: true, gif_url: direct_url, found: true });
    }

    const sourceUrl = findGifUrl(exercise_name);

    if (!sourceUrl) {
      return Response.json({ success: true, gif_url: null, found: false, exercise_name });
    }

    // Download the GIF server-side (no CORS/hotlink issues here)
    const gifResponse = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.hipertrofia.org/',
        'Accept': 'image/gif,image/*,*/*;q=0.8',
      }
    });

    if (gifResponse.ok) {
      const contentType = gifResponse.headers.get('content-type') || 'image/gif';
      const buffer = await gifResponse.arrayBuffer();
      const file = new File([buffer], 'exercise.gif', { type: contentType });

      // Upload to Base44 public storage — no CORS issues when loaded in frontend
      const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });

      return Response.json({
        success: true,
        gif_url: uploadResult.file_url,
        found: true,
        exercise_name
      });
    }

    // Fallback: return source URL if download failed
    return Response.json({
      success: true,
      gif_url: sourceUrl,
      found: true,
      exercise_name
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});