import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@17.5.0';
import { secrets } from 'base44:runtime';
import { downgradeToStudentFields, scheduledCancellationFields } from '../../shared/subscription.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const authUser = await base44.auth.me();
    if (!authUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId } = await req.json();
    const isAdminAction = Boolean(targetUserId);
    if (isAdminAction && authUser.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const target = isAdminAction
      ? await base44.asServiceRole.entities.User.get(targetUserId)
      : (await base44.asServiceRole.entities.User.filter({ email: authUser.email }, '-created_date', 1))?.[0];
    if (!target) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const hasSubscription = target.role === 'assinante' || ['ativa', 'cancelamento_agendado'].includes(target.assinatura_status) || Boolean(target.stripe_subscription_id);
    if (!hasSubscription && !isAdminAction) return Response.json({ error: 'Nenhuma assinatura ativa encontrada' }, { status: 400 });

    let periodEnd = target.assinatura_vencimento || new Date().toISOString().slice(0, 10);
    if (target.stripe_subscription_id) {
      const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
      if (isAdminAction) {
        await stripe.subscriptions.cancel(target.stripe_subscription_id);
      } else {
        const subscription = await stripe.subscriptions.update(target.stripe_subscription_id, { cancel_at_period_end: true });
        if (subscription.current_period_end) periodEnd = new Date(subscription.current_period_end * 1000).toISOString().slice(0, 10);
      }
    }

    const fields = isAdminAction
      ? downgradeToStudentFields()
      : scheduledCancellationFields(periodEnd);
    const updated = await base44.asServiceRole.entities.User.update(target.id, fields);

    return Response.json({
      status: isAdminAction ? 'cancelada' : 'cancelamento_agendado',
      access_until: isAdminAction ? null : periodEnd,
      user: updated
    });
  } catch (error) {
    console.error('cancelSubscription error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}