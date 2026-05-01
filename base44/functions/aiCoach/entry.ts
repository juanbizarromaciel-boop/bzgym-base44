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

  test: `Você é o BZ AI Coach, assistente do BZ Gym System. Responda com uma saudação curta e confirme que a conexão está funcionando. Responda em JSON: {"status": "ok", "message": "sua mensagem"}`
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas professores.' }, { status: 403 });
    }

    const body = await req.json();
    const { type, prompt, context } = body;

    if (!type || !prompt) {
      return Response.json({ error: 'Parâmetros obrigatórios: type, prompt' }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.test;

    let userMessage = prompt;
    if (context && Object.keys(context).length > 0) {
      userMessage += `\n\nContexto adicional: ${JSON.stringify(context)}`;
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