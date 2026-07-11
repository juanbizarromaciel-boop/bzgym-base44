/**
 * Sorts workout exercises by progression — worst progressors first.
 * Returns a new array of exercises (with their original index preserved).
 */

function calcVolume(sets) {
  if (!sets?.length) return 0;
  return sets.reduce((acc, s) => acc + ((s.reps_done || 0) * (s.load_kg || 0)), 0);
}

function getProgressionScore(logs) {
  // logs: sorted by date asc for this exercise
  if (!logs || logs.length === 0) return 2; // unknown, middle
  if (logs.length === 1) return 2; // only one session, neutral
  const last = logs[logs.length - 1];
  const prev = logs[logs.length - 2];
  const lastVol = calcVolume(last.sets_completed);
  const prevVol = calcVolume(prev.sets_completed);
  const lastLoad = last.max_load_kg || 0;
  const prevLoad = prev.max_load_kg || 0;

  if (lastVol < prevVol || lastLoad < prevLoad) return 0; // regressing — first
  if (lastVol === prevVol && lastLoad === prevLoad) return 1; // stagnant
  return 3; // progressing — last
}

/**
 * @param {Array} exercises - plan exercises array
 * @param {Array} allLogs - all WorkoutLog records
 * @param {string} studentId
 * @returns {Array} exercises sorted by progression (worst first), each with originalIndex
 */
export function sortExercisesByProgression(exercises, allLogs, studentId) {
  if (!exercises?.length) return [];
  const ownerIds = Array.isArray(studentId) ? studentId.filter(Boolean) : [studentId].filter(Boolean);

  // Build per-exercise log map
  const studentLogs = (allLogs || []).filter(l => ownerIds.includes(l.student_id));
  const logMap = {};
  studentLogs.forEach(log => {
    if (!log.exercise_name) return;
    if (!logMap[log.exercise_name]) logMap[log.exercise_name] = [];
    logMap[log.exercise_name].push(log);
  });
  // Sort each list by date
  Object.keys(logMap).forEach(name => {
    logMap[name].sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  return exercises
    .map((ex, originalIndex) => ({ ...ex, originalIndex }))
    .sort((a, b) => {
      const scoreA = getProgressionScore(logMap[a.exercise_name]);
      const scoreB = getProgressionScore(logMap[b.exercise_name]);
      return scoreA - scoreB;
    });
}

/**
 * Returns progression info for a single exercise
 */
export function getExerciseProgression(exerciseName, allLogs, studentId) {
  const ownerIds = Array.isArray(studentId) ? studentId.filter(Boolean) : [studentId].filter(Boolean);
  const logs = (allLogs || [])
    .filter(l => ownerIds.includes(l.student_id) && l.exercise_name === exerciseName)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (logs.length < 2) return null;

  const last = logs[logs.length - 1];
  const prev = logs[logs.length - 2];
  const lastVol = calcVolume(last.sets_completed);
  const prevVol = calcVolume(prev.sets_completed);
  const lastLoad = last.max_load_kg || 0;
  const prevLoad = prev.max_load_kg || 0;

  if (lastVol < prevVol || lastLoad < prevLoad) {
    return { type: "down", label: "Sem progressão no treino anterior", color: "#ec4899" };
  }
  if (lastVol === prevVol && lastLoad === prevLoad) {
    return { type: "same", label: "Sem progressão no treino anterior", color: "#f59e0b" };
  }
  return { type: "up", label: "Progrediu no treino anterior", color: "#10b981" };
}