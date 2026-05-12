import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SYSTEM_PROMPTS = {
  food: `Você é uma IA auxiliar de cadastro nutricional para um aplicativo fitness brasileiro.
Sua função é transformar o pedido do professor em alimentos estruturados para banco de dados.
Responda APENAS em JSON válido, sem markdown, sem texto extra.
Use valores nutricionais reais baseados em tabelas TACO/USDA.
Se não tiver certeza de algum valor, marque is_verified como false.
Não invente informações absurdas. Seja preciso.
Categorias válidas: proteina, carboidrato, gordura, fruta, vegetal, laticinios, leguminosa, oleaginosa, bebida, outro`,

  diet: `Você é uma IA auxiliar de montagem de planos alimentares para um aplicativo fitness brasileiro.
Use preferencialmente os alimentos fornecidos. Monte refeições com quantidades, unidades e totais de macronutrientes.
Responda APENAS em JSON válido, sem markdown, sem texto extra.
O plano deve ser revisado pelo professor antes de ser enviado ao aluno.
AVISO: Dietas clínicas exigem nutricionista habilitado. Esta IA é apenas uma ferramenta auxiliar de planejamento.
Não faça promessas médicas. Não trate doenças.`,

  workout: `Você é uma IA auxiliar de prescrição de treinos para professores de educação física brasileiros.
Crie treinos estruturados com exercícios, séries, repetições, descanso, RIR/RPE, cadência, técnicas avançadas e observações.
Responda APENAS em JSON válido, sem markdown, sem texto extra.
O treino deve ser revisado pelo professor antes de ser enviado ao aluno.
Técnicas válidas: normal, cluster, rest_pause, drop_set, super_set, giant_set, piramidal, fst7, myo_reps, tempo_controlado
Grupos musculares: peito, costas, ombros, biceps, triceps, pernas, gluteos, abdomen, panturrilha, antebraco, cardio`,

  test: `Você é o BZ AI Coach, assistente do BZ Gym System. Responda com uma saudação curta e confirme que a conexão está funcionando. Responda em JSON: {"status": "ok", "message": "sua mensagem"}`,

  exercise_desc: `Você é uma IA especialista em educação física brasileira.
Gere uma descrição técnica e motivacional para o exercício informado.
Seja direto, máximo 2 frases, em português.
Responda APENAS em JSON: {"description": "texto da descrição"}`,

  exercise_bulk: `Você é uma IA especialista em educação física brasileira com acesso à internet.
Receberá uma lista de exercícios em JSON e um comando do professor.
Execute o comando em TODOS os exercícios e retorne a lista atualizada.
Mantenha os campos id e name intactos. Retorne APENAS JSON válido.
Formato: {"exercises": [{id, name, muscle_group, description, image_url, video_url}, ...]}

REGRAS PARA LINKS DE MÍDIA:
- Quando solicitado para buscar fotos/imagens: use a internet para encontrar GIFs ou imagens reais do exercício. Prefira links diretos de .gif ou .jpg de fontes confiáveis de fitness (ex: Bodybuilding.com, Muscle & Strength, etc). O link deve ser uma URL direta de imagem.
- Quando solicitado para buscar vídeos: use a internet para encontrar o link real do YouTube do exercício em português. O campo video_url deve ser o link completo do YouTube (ex: https://www.youtube.com/watch?v=XXXX) com boa execução técnica em português.
- NUNCA invente links. Se não encontrar um link real, deixe o campo vazio "".
- Para buscas de mídia, pesquise ativamente na internet antes de responder.`,

  workout_refine: `Você é uma IA auxiliar de prescrição de treinos para professores de educação física brasileiros.
Receberá um plano de treino completo em JSON e um pedido de alteração do professor.
Analise o plano e aplique EXATAMENTE as alterações solicitadas, mantendo o restante intacto.
Responda SEMPRE em JSON com dois campos:
- "message": string curta confirmando o que foi feito (ex: "Troquei o supino por variações com halteres no Dia A e B.")
- "plan": o plano completo atualizado com a mesma estrutura do original
Responda APENAS em JSON válido, sem markdown, sem texto extra.`,

  diet_refine: `Você é uma IA auxiliar de planejamento nutricional para professores brasileiros.
Receberá um plano alimentar completo em JSON e um pedido de alteração do professor.
Analise a dieta e aplique EXATAMENTE as alterações solicitadas, mantendo o restante intacto.
Recalcule os macros e calorias totais após as mudanças.
Responda SEMPRE em JSON com dois campos:
- "message": string curta confirmando o que foi feito (ex: "Substituí o leite por leite de amêndoas e ajustei os macros.")
- "plan": a dieta completa atualizada com a mesma estrutura do original
Responda APENAS em JSON válido, sem markdown, sem texto extra.
AVISO: Esta IA é apenas ferramenta auxiliar. Dietas clínicas exigem nutricionista habilitado.`
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'personal')) {
      return Response.json({ error: 'Acesso negado. Apenas administradores e personais.' }, { status: 403 });
    }

    const body = await req.json();
    const { type, prompt, context } = body;

    const ALLOWED_TYPES = ['food', 'diet', 'workout', 'test', 'exercise_desc', 'exercise_bulk', 'workout_refine', 'diet_refine'];
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return Response.json({ error: `Tipo inválido. Permitidos: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Parâmetro "prompt" obrigatório' }, { status: 400 });
    }
    if (prompt.length > 8000) {
      return Response.json({ error: 'Prompt muito longo (máx. 8000 caracteres)' }, { status: 400 });
    }

    // personal só pode usar exercise_desc e exercise_bulk
    const PERSONAL_ALLOWED = ['exercise_desc', 'exercise_bulk'];
    if (user.role === 'personal' && !PERSONAL_ALLOWED.includes(type)) {
      return Response.json({ error: 'Acesso negado para este tipo de operação.' }, { status: 403 });
    }

    const systemPrompt = SYSTEM_PROMPTS[type];
    const { history } = body;

    let userMessage = prompt.slice(0, 8000);
    if (context) {
      const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
      if (contextStr.length > 80000) {
        return Response.json({ error: 'Contexto muito grande.' }, { status: 400 });
      }
      userMessage += `\n\nPlano atual (JSON):\n${contextStr}`;
    }
    if (history) {
      const histStr = typeof history === 'string' ? history : JSON.stringify(history);
      userMessage += `\n\nHistórico da conversa:\n${histStr}`;
    }

    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

    // exercise_bulk com busca de mídia usa modelo com internet
    const needsInternet = type === 'exercise_bulk' && (
      prompt.toLowerCase().includes('foto') ||
      prompt.toLowerCase().includes('video') ||
      prompt.toLowerCase().includes('vídeo') ||
      prompt.toLowerCase().includes('imagem') ||
      prompt.toLowerCase().includes('link') ||
      prompt.toLowerCase().includes('mídia') ||
      prompt.toLowerCase().includes('midia') ||
      prompt.toLowerCase().includes('youtube') ||
      prompt.toLowerCase().includes('gif')
    );

    // Use Base44 InvokeLLM - no API key needed
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      model: needsInternet ? 'gemini_3_1_pro' : 'claude_sonnet_4_6',
      add_context_from_internet: needsInternet,
      response_json_schema: type !== 'test' ? {
        type: 'object',
        additionalProperties: true
      } : {
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' }
        }
      }
    });

    let parsed = result;

    // Log success
    await base44.asServiceRole.entities.AIRequestLog.create({
      teacher_id: user.email,
      type,
      prompt: prompt.slice(0, 500),
      response_summary: JSON.stringify(result).slice(0, 300),
      tokens_used: 0,
      model: needsInternet ? 'gemini_3_1_pro' : 'claude_sonnet_4_6',
      status: 'success'
    });

    return Response.json({
      success: true,
      data: parsed,
      tokens_used: 0,
      model: needsInternet ? 'gemini_3_1_pro' : 'claude_sonnet_4_6'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});