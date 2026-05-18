import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, ChevronDown, ChevronUp, User, Search, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import DietHistory from "../components/diet/DietHistory";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const GOAL_LABELS = { bulking: "BULKING", cutting: "CUTTING", manutencao: "MANUTENÇÃO" };
const GOAL_COLORS = {
  bulking:    { border: "rgba(6,182,212,0.35)",  bg: "rgba(6,182,212,0.08)",  text: "#22d3ee" },
  cutting:    { border: "rgba(236,72,153,0.35)", bg: "rgba(236,72,153,0.08)", text: "#f472b6" },
  manutencao: { border: "rgba(168,85,247,0.35)", bg: "rgba(168,85,247,0.08)", text: "#c084fc" },
};

export default function DietLogs() {
  const [search, setSearch] = useState("");
  const [expandedStudent, setExpandedStudent] = useState(null); // studentId
  const [expandedPlan, setExpandedPlan] = useState(null); // planId

  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const { data: allStudentsDL = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list(),
  });
  const { data: allPlansDL = [] } = useQuery({
    queryKey: ["diet_plans"],
    queryFn: () => base44.entities.DietPlan.list(),
  });

  // Personal só vê seus próprios alunos e dietas
  const students = (currentUser?.role === "personal")
    ? allStudentsDL.filter(s => s.personal_id === currentUser.email)
    : allStudentsDL;
  const plans = (currentUser?.role === "personal")
    ? allPlansDL.filter(p => p.personal_id === currentUser.email)
    : allPlansDL;

  // Group plans by student
  const plansByStudent = {};
  plans.forEach(p => {
    if (!plansByStudent[p.student_id]) plansByStudent[p.student_id] = [];
    plansByStudent[p.student_id].push(p);
  });

  // Only students that have at least one diet plan, filtered by search
  const studentsWithPlans = students
    .filter(s => plansByStudent[s.id]?.length > 0)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const toggleStudent = (sid) => {
    if (expandedStudent === sid) {
      setExpandedStudent(null);
      setExpandedPlan(null);
    } else {
      setExpandedStudent(sid);
      // Auto-select first plan
      const firstPlan = plansByStudent[sid]?.[0];
      setExpandedPlan(firstPlan?.id || null);
    }
  };

  const togglePlan = (pid) => {
    setExpandedPlan(expandedPlan === pid ? null : pid);
  };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-4xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8 relative">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.8), transparent)" }} />
        <div className="flex items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8" style={{
                background: "linear-gradient(to bottom, #10b981, #a855f7)",
                borderRadius: "2px",
                boxShadow: "0 0 12px rgba(16,185,129,0.6)"
              }} />
              <h1 className="text-3xl font-black font-cyber tracking-wider"
                style={{ color: "#ffffff", textShadow: "0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(168,85,247,0.3)" }}>
                HISTÓRICO DE DIETAS
              </h1>
            </div>
            <div className="flex items-center gap-2" style={{ paddingLeft: "14px" }}>
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              <p className="text-sm font-mono-cyber tracking-wide"
                style={{ color: "rgba(16,185,129,0.8)" }}>
                Checklist diário de cada aluno
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.6), rgba(168,85,247,0.8), rgba(16,185,129,0.6), transparent)" }} />
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/40 pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar aluno..."
          className="cyber-input pl-9"
        />
      </motion.div>

      {/* Empty state */}
      {studentsWithPlans.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <Utensils className="w-12 h-12 mx-auto mb-4 text-purple-500/20" />
          <p className="font-mono-cyber text-sm text-purple-500/30">
            {search ? "// nenhum aluno encontrado" : "// nenhum aluno com dieta cadastrada"}
          </p>
        </motion.div>
      )}

      {/* Student list */}
      <motion.div variants={stagger} className="space-y-3">
        {studentsWithPlans.map(student => {
          const studentPlans = plansByStudent[student.id] || [];
          const isOpen = expandedStudent === student.id;

          return (
            <motion.div key={student.id} variants={fadeUp}>
              <div className="rounded-2xl overflow-hidden border transition-all"
                style={{
                  borderColor: isOpen ? "rgba(168,85,247,0.4)" : "rgba(168,85,247,0.15)",
                  background: "rgba(7,5,22,0.97)",
                  boxShadow: isOpen ? "0 0 30px rgba(168,85,247,0.12)" : "none"
                }}>

                {/* Student header row */}
                <button
                  onClick={() => toggleStudent(student.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
                      {student.photo_url
                        ? <img src={student.photo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                        : <User className="w-5 h-5 text-purple-400" />
                      }
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">{student.name}</p>
                      <p className="text-[10px] font-mono-cyber text-purple-500/40 mt-0.5">
                        {studentPlans.length} plano{studentPlans.length !== 1 ? "s" : ""} de dieta
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg"
                      style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <ClipboardList className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] font-mono-cyber text-emerald-400">{studentPlans.length} dieta{studentPlans.length !== 1 ? "s" : ""}</span>
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-purple-500/40" />
                      : <ChevronDown className="w-4 h-4 text-purple-500/40" />
                    }
                  </div>
                </button>

                {/* Expanded: plans list + history */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t px-4 pt-4 pb-5 space-y-4"
                        style={{ borderColor: "rgba(168,85,247,0.12)" }}>

                        {/* Plan tabs */}
                        <div className="flex flex-wrap gap-2">
                          {studentPlans.map(plan => {
                            const isActive = expandedPlan === plan.id;
                            const gc = GOAL_COLORS[plan.goal] || GOAL_COLORS.manutencao;
                            return (
                              <button
                                key={plan.id}
                                onClick={() => togglePlan(plan.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium font-mono-cyber tracking-wide transition-all"
                                style={isActive ? {
                                  border: `1px solid ${gc.border}`,
                                  background: gc.bg,
                                  color: gc.text,
                                  boxShadow: `0 0 12px ${gc.border}`,
                                } : {
                                  border: "1px solid rgba(168,85,247,0.18)",
                                  background: "rgba(168,85,247,0.05)",
                                  color: "rgba(168,85,247,0.5)",
                                }}
                              >
                                <span className="flex items-center gap-1.5">
                                  <Utensils className="w-3 h-3" />
                                  {plan.name}
                                  {plan.goal && (
                                    <span className="text-[8px] opacity-70">· {GOAL_LABELS[plan.goal]}</span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* History for selected plan */}
                        {expandedPlan && (() => {
                          const selectedPlan = studentPlans.find(p => p.id === expandedPlan);
                          if (!selectedPlan) return null;
                          return (
                            <div className="mt-2">
                              <DietHistory student={student} plan={selectedPlan} />
                            </div>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}