import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      amount = 0,
      description = 'Assinatura BZ Gym System',
      targetEmail,
      targetName,
      targetRole = 'assinante',
      successUrl,
      cancelUrl,
      billingInterval = null,
      billingPlan = 'monthly'
    } = await req.json();

    const finalAmount = Math.round(Number(amount) * 100);
    if (!finalAmount || finalAmount < 100) return Response.json({ error: 'Valor inválido' }, { status: 400 });

    const payerEmail = targetEmail || user.email;
    if (targetEmail && targetEmail !== user.email && user.role !== 'admin' && user.role !== 'personal') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const origin = req.headers.get('origin') || 'https://app.base44.com';
    const isRecurring = billingInterval === 'month' || billingInterval === 'year';

    const metadata = {
      base44_app_id: Deno.env.get('BASE44_APP_ID'),
      payer_email: payerEmail,
      payer_name: targetName || user.full_name || payerEmail,
      payer_role: targetRole,
      created_by: user.email,
      amount_brl: String(Number(amount)),
      billing_interval: billingInterval || 'month',
      billing_plan: billingPlan
    };

    const sessionConfig = {
      mode: isRecurring ? 'subscription' : 'payment',
      customer_email: payerEmail,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'brl',
          unit_amount: finalAmount,
          product_data: { name: description },
          ...(isRecurring ? { recurring: { interval: billingInterval } } : {})
        }
      }],
      success_url: successUrl || `${origin}/SubscriberBilling?payment=success`,
      cancel_url: cancelUrl || `${origin}/SubscriberBilling?payment=cancelled`,
      metadata
    };

    if (isRecurring) sessionConfig.subscription_data = { metadata };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('createSubscriptionCheckout error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});