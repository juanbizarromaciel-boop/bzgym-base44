import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { downgradeToStudentFields } from '../../shared/subscription.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const authUser = await base44.auth.me();
    if (!authUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await base44.asServiceRole.entities.User.filter({ email: authUser.email }, '-created_date', 1);
    let userRecord = records?.[0] || {};
    const today = new Date().toISOString().slice(0, 10);
    const cancellationExpired = userRecord.assinatura_status === 'cancelamento_agendado'
      && userRecord.assinatura_vencimento
      && userRecord.assinatura_vencimento < today;

    if (cancellationExpired && userRecord.id) {
      userRecord = await base44.asServiceRole.entities.User.update(userRecord.id, downgradeToStudentFields());
    }

    return Response.json({ user: { ...authUser, ...userRecord } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}