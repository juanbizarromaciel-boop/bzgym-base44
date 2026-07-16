/**
 * Sorts workout exercises by progression — worst progressors first.
 * Returns a new array of exercises (with their original index preserved).
 */

function calcVolume(sets) {
  if (!sets?.length) return 0;
  return sets.reduce((acc, s) => acc + ((s.reps_done || 0) * (s.load_kg || 0)), 0);
}

function normalizeExerciseName(value) {
  return (value || "").trim().toLocaleLowerCase("pt-BR");
}

function getMaxLoad(log) {
  const savedMax = Number(log?.max_load_kg) || 0;
  const setsMax = Math.max(...(log?.sets_completed || []).map(set => Number(set.load_kg) || 0), 0);
  return Math.max(savedMax, setsMax);
}

function getProgressionScore(logs) {
  // logs: sorted by date asc for this exercise
  if (!logs || logs.length === 0) return 2; // unknown, middle
  if (logs.length === 1) return 2; // only one session, neutral
  const last = logs[logs.length - 1];
  const prev = logs[logs.length - 2];
  const lastVol = calcVolume(last.sets_completed);
  const prevVol = calcVolume(prev.sets_completed);
  const lastLoad = getMaxLoad(last);
  const prevLoad = getMaxLoad(prev);

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
    const exerciseKey = normalizeExerciseName(log.exercise_name);
    if (!exerciseKey) return;
    if (!logMap[exerciseKey]) logMap[exerciseKey] = [];
    logMap[exerciseKey].push(log);
  });
  // Sort each list by date and creation time
  Object.keys(logMap).forEach(name => {
    logMap[name].sort((a, b) => new Date(a.created_date || `${a.date}T12:00:00`) - new Date(b.created_date || `${b.date}T12:00:00`));
  });

  return exercises
    .map((ex, originalIndex) => ({ ...ex, originalIndex }))
    .sort((a, b) => {
      const scoreA = getProgressionScore(logMap[normalizeExerciseName(a.exercise_name)]);
      const scoreB = getProgressionScore(logMap[normalizeExerciseName(b.exercise_name)]);
      return scoreA - scoreB;
    });
}

/**
 * Returns progression info for a single exercise
 */
export function getExerciseProgression(exerciseName, allLogs, studentId) {
  const ownerIds = Array.isArray(studentId) ? studentId.filter(Boolean) : [studentId].filter(Boolean);
  const normalizedName = normalizeExerciseName(exerciseName);
  const logs = (allLogs || [])
    .filter(l => ownerIds.includes(l.student_id) && normalizeExerciseName(l.exercise_name) === normalizedName)
    .sort((a, b) => new Date(a.created_date || `${a.date}T12:00:00`) - new Date(b.created_date || `${b.date}T12:00:00`));

  if (logs.length < 2) return null;

  const last = logs[logs.length - 1];
  const prev = logs[logs.length - 2];
  const lastVol = calcVolume(last.sets_completed);
  const prevVol = calcVolume(prev.sets_completed);
  const lastLoad = getMaxLoad(last);
  const prevLoad = getMaxLoad(prev);

  if (lastVol < prevVol || lastLoad < prevLoad) {
    return { type: "down", label: "Sem progressão no treino anterior", color: "#ec4899" };
  }
  if (lastVol === prevVol && lastLoad === prevLoad) {
    return { type: "same", label: "Sem progressão no treino anterior", color: "#f59e0b" };
  }
  return { type: "up", label: "Progrediu no treino anterior", color: "#10b981" };
}