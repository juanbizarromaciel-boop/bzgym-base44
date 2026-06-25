import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authUser = await base44.auth.me();
    if (!authUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await base44.asServiceRole.entities.User.filter({ email: authUser.email });
    const userRecord = records?.[0] || {};
    return Response.json({ user: { ...authUser, ...userRecord } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});