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

  exercise_bulk: `Você é uma IA especialista em educação física brasileira.
Receberá uma lista de exercícios em JSON e um comando do professor.
Execute o comando em TODOS os exercícios e retorne a lista atualizada.
Mantenha os campos id e name intactos. Retorne APENAS JSON válido.
Formato: {"exercises": [{id, name, muscle_group, description, video_url}, ...]}`
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

    const ALLOWED_TYPES = ['food', 'diet', 'workout', 'test', 'exercise_desc', 'exercise_bulk'];
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

    let userMessage = prompt.slice(0, 8000);
    if (context) {
      const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
      if (contextStr.length > 50000) {
        return Response.json({ error: 'Contexto muito grande. Reduza o número de exercícios por vez.' }, { status: 400 });
      }
      userMessage += `\n\nContexto adicional: ${contextStr}`;
    }

    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

    // Use Base44 InvokeLLM - no API key needed
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      model: 'claude_sonnet_4_6',
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
      model: 'claude_sonnet_4_6',
      status: 'success'
    });

    return Response.json({
      success: true,
      data: parsed,
      tokens_used: 0,
      model: 'claude_sonnet_4_6'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});