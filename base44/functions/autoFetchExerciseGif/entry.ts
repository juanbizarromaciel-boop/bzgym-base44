import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Delegates entirely to fetchExerciseGif which has the full search logic
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));

    let exerciseId = null;
    let exerciseName = null;

    // Called from entity automation
    if (body.event && body.data) {
      exerciseId = body.event.entity_id;
      exerciseName = body.data.name;
      if (body.data.image_url) {
        return Response.json({ skipped: true, reason: "already has image" });
      }
    } else {
      // Called manually from frontend
      const user = await base44.auth.me();
      if (!user || (user.role !== 'admin' && user.role !== 'personal')) {
        return Response.json({ error: 'Acesso negado.' }, { status: 403 });
      }
      exerciseId = body.exercise_id;
      exerciseName = body.exercise_name;
    }

    if (!exerciseName || !exerciseId) {
      return Response.json({ error: 'exercise_id e exercise_name são obrigatórios' }, { status: 400 });
    }

    // Delegate to fetchExerciseGif for the actual search
    const result = await base44.asServiceRole.functions.invoke('fetchExerciseGif', {
      exercise_name: exerciseName,
    });

    const gifUrl = result?.gif_url;

    if (!gifUrl) {
      return Response.json({ success: true, found: false, exercise_name: exerciseName });
    }

    await base44.asServiceRole.entities.Exercise.update(exerciseId, { image_url: gifUrl });

    return Response.json({ success: true, found: true, gif_url: gifUrl, exercise_name: exerciseName });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});