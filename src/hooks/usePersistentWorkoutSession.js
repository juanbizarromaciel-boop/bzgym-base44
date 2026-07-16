import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function usePersistentWorkoutSession({ trainerEmail, snapshot, enabled }) {
  const [session, setSession] = useState(null);
  const queryClient = useQueryClient();
  const sessionRef = useRef(null);
  const queueRef = useRef(Promise.resolve());
  const closedRef = useRef(false);

  const { data: drafts = [], isFetched } = useQuery({
    queryKey: ["workout-session", trainerEmail],
    queryFn: () => base44.entities.WorkoutSession.filter({ trainer_email: trainerEmail, status: "active" }, "-updated_date", 1),
    enabled: !!trainerEmail,
  });

  useEffect(() => {
    if (!isFetched) return;
    const restored = drafts[0] || null;
    sessionRef.current = restored;
    setSession(restored);
  }, [drafts, isFetched]);

  useEffect(() => {
    if (!isFetched || !enabled || closedRef.current) return;
    queueRef.current = queueRef.current.then(async () => {
      if (closedRef.current) return;
      if (sessionRef.current?.id) {
        const updated = await base44.entities.WorkoutSession.update(sessionRef.current.id, snapshot);
        sessionRef.current = updated;
        setSession(updated);
      } else {
        const created = await base44.entities.WorkoutSession.create(snapshot);
        sessionRef.current = created;
        setSession(created);
      }
    });
  }, [enabled, isFetched, snapshot]);

  const closeSession = useCallback(async () => {
    closedRef.current = true;
    await queueRef.current;
    if (sessionRef.current?.id) await base44.entities.WorkoutSession.delete(sessionRef.current.id);
    sessionRef.current = null;
    setSession(null);
    queryClient.setQueryData(["workout-session", trainerEmail], []);
  }, [queryClient, trainerEmail]);

  const reopenSession = useCallback(() => {
    closedRef.current = false;
  }, []);

  return { restoredSession: drafts[0] || session, isLoaded: isFetched, closeSession, reopenSession };
}