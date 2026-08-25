import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Delegates entirely to fetchExerciseGif which has the full search logic
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'personal') {
      return Response.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    let exerciseId = null;
    let exerciseName = null;

    if (body.event && body.data) {
      exerciseId = body.event.entity_id;
      exerciseName = body.data.name;
      if (body.data.image_url) {
        return Response.json({ skipped: true, reason: "already has image" });
      }
    } else {
      exerciseId = body.exercise_id;
      exerciseName = body.exercise_name;
    }

    if (!exerciseName || !exerciseId) {
      return Response.json({ error: 'exercise_id e exercise_name são obrigatórios' }, { status: 400 });
    }

    const result = await base44.functions.invoke('fetchExerciseGif', {
      exercise_name: exerciseName,
    });

    const gifUrl = result?.gif_url;

    if (!gifUrl) {
      return Response.json({ success: true, found: false, exercise_name: exerciseName });
    }

    await base44.entities.Exercise.update(exerciseId, { image_url: gifUrl });

    return Response.json({ success: true, found: true, gif_url: gifUrl, exercise_name: exerciseName });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}