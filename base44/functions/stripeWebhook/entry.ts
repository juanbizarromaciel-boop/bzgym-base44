import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.5.0';

function addBillingPeriod(date, interval) {
  const d = new Date(date);
  const day = d.getUTCDate();
  if (interval === 'year') d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  if (d.getUTCDate() !== day) d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const event = secret ? await stripe.webhooks.constructEventAsync(body, signature, secret) : JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.metadata?.payer_email || session.customer_details?.email;
      const amount = Number(session.metadata?.amount_brl || (session.amount_total || 0) / 100);
      const paidDate = new Date().toISOString().slice(0, 10);
      const interval = session.metadata?.billing_interval || 'month';
      const nextDue = addBillingPeriod(`${paidDate}T00:00:00Z`, interval);
      await base44.asServiceRole.entities.Payment.create({
        user_email: email,
        user_name: session.metadata?.payer_name || session.customer_details?.name || email,
        user_role: session.metadata?.payer_role || 'assinante',
        personal_id: session.metadata?.created_by || '',
        amount,
        payment_date: paidDate,
        due_date: paidDate,
        next_due_date: nextDue,
        status: 'pago',
        description: 'Assinatura paga via Stripe',
        payment_method: 'stripe',
        stripe_checkout_session_id: session.id,
        stripe_customer_id: session.customer || '',
        stripe_subscription_id: session.subscription || '',
        stripe_payment_intent_id: session.payment_intent || ''
      });
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users?.[0]) await base44.asServiceRole.entities.User.update(users[0].id, { role: session.metadata?.payer_role || 'assinante', assinatura_status: 'ativa', assinatura_origem: 'stripe', assinatura_bloqueio_manual: false, assinatura_vencimento: nextDue, assinatura_valor: amount, assinatura_plano: session.metadata?.billing_plan || 'monthly', stripe_customer_id: session.customer || '', stripe_subscription_id: session.subscription || '' });
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      if (invoice.billing_reason !== 'subscription_create') {
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;
        const metadata = subscription?.metadata || invoice.metadata || {};
        const customer = invoice.customer ? await stripe.customers.retrieve(invoice.customer) : null;
        const email = metadata.payer_email || customer?.email || invoice.customer_email;
        const amount = Number(metadata.amount_brl || (invoice.amount_paid || 0) / 100);
        const paidDate = new Date((invoice.status_transitions?.paid_at || Math.floor(Date.now() / 1000)) * 1000).toISOString().slice(0, 10);
        const nextDue = invoice.lines?.data?.[0]?.period?.end ? new Date(invoice.lines.data[0].period.end * 1000).toISOString().slice(0, 10) : addBillingPeriod(`${paidDate}T00:00:00Z`, metadata.billing_interval || 'month');
        await base44.asServiceRole.entities.Payment.create({
          user_email: email,
          user_name: metadata.payer_name || customer?.name || email,
          user_role: metadata.payer_role || 'assinante',
          personal_id: metadata.created_by || '',
          amount,
          payment_date: paidDate,
          due_date: paidDate,
          next_due_date: nextDue,
          status: 'pago',
          description: 'Renovação de assinatura via Stripe',
          payment_method: 'stripe',
          stripe_checkout_session_id: '',
          stripe_customer_id: invoice.customer || '',
          stripe_subscription_id: subscriptionId || '',
          stripe_payment_intent_id: invoice.payment_intent || ''
        });
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users?.[0]) await base44.asServiceRole.entities.User.update(users[0].id, { role: metadata.payer_role || 'assinante', assinatura_status: 'ativa', assinatura_origem: 'stripe', assinatura_bloqueio_manual: false, assinatura_vencimento: nextDue, assinatura_valor: amount, assinatura_plano: metadata.billing_plan || 'monthly', stripe_customer_id: invoice.customer || '', stripe_subscription_id: subscriptionId || '' });
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const metadata = subscription.metadata || {};
      const email = metadata.payer_email;
      if (email) {
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const nextDue = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString().slice(0, 10) : '';
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users?.[0]) await base44.asServiceRole.entities.User.update(users[0].id, {
          role: isActive ? (metadata.payer_role || 'assinante') : 'bloqueado',
          assinatura_status: isActive ? 'ativa' : 'bloqueada',
          assinatura_origem: 'stripe',
          assinatura_bloqueio_manual: false,
          assinatura_vencimento: nextDue || users[0].assinatura_vencimento || '',
          assinatura_valor: Number(metadata.amount_brl || users[0].assinatura_valor || 0),
          assinatura_plano: metadata.billing_plan || users[0].assinatura_plano || 'monthly',
          stripe_customer_id: subscription.customer || users[0].stripe_customer_id || '',
          stripe_subscription_id: subscription.id || users[0].stripe_subscription_id || ''
        });
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;
      const metadata = subscription?.metadata || invoice.metadata || {};
      const customer = invoice.customer ? await stripe.customers.retrieve(invoice.customer) : null;
      const email = metadata.payer_email || customer?.email || invoice.customer_email;
      const users = email ? await base44.asServiceRole.entities.User.filter({ email }) : [];
      if (users?.[0]) await base44.asServiceRole.entities.User.update(users[0].id, { role: 'bloqueado', assinatura_status: 'bloqueada', assinatura_origem: 'stripe', assinatura_bloqueio_manual: false });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});