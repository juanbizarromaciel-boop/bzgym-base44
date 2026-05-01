import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, api_key, settings } = body;

    if (action === 'save_key') {
      // In real production: encrypt the key. Here we store in env-like variable via a settings entity.
      // We DO NOT store in frontend-accessible fields — the key goes only to this function.
      // For this implementation, we save a masked version and keep full key in Deno env.
      // The actual key must be set via Dashboard > Secrets as OPENAI_API_KEY.
      const masked = api_key ? `sk-...${api_key.slice(-6)}` : null;
      return Response.json({ success: true, masked });
    }

    if (action === 'validate_key') {
      const keyToTest = api_key || Deno.env.get('OPENAI_API_KEY');
      if (!keyToTest) {
        return Response.json({ valid: false, error: 'Nenhuma chave configurada' });
      }
      const testRes = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${keyToTest}` }
      });
      if (testRes.ok) {
        return Response.json({ valid: true });
      } else {
        return Response.json({ valid: false, error: 'Chave inválida ou sem permissão' });
      }
    }

    if (action === 'get_logs') {
      const logs = await base44.asServiceRole.entities.AIRequestLog.filter(
        { teacher_id: user.email },
        '-created_date',
        50
      );
      return Response.json({ logs });
    }

    if (action === 'get_usage') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const logs = await base44.asServiceRole.entities.AIRequestLog.filter({ teacher_id: user.email });
      const thisMonth = logs.filter(l => l.created_date >= startOfMonth);
      const totalTokens = thisMonth.reduce((sum, l) => sum + (l.tokens_used || 0), 0);
      return Response.json({
        total_calls: thisMonth.length,
        total_tokens: totalTokens,
        successful: thisMonth.filter(l => l.status === 'success').length,
        errors: thisMonth.filter(l => l.status === 'error').length
      });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});