import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.5.0';

function addMonth(date) {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + 1);
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
      const nextDue = addMonth(`${paidDate}T00:00:00Z`);
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
        stripe_payment_intent_id: session.payment_intent || ''
      });
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users?.[0]) await base44.asServiceRole.entities.User.update(users[0].id, { role: session.metadata?.payer_role || users[0].role || 'assinante', assinatura_status: 'ativa', assinatura_vencimento: nextDue, assinatura_valor: amount, stripe_customer_id: session.customer || '' });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});