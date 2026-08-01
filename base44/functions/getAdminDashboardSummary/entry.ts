import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const entities = base44.asServiceRole.entities;
    const [users, students, workoutPlans, dietPlans, messages, payments, checkIns, exercises, hormonalEvents, sportsNews] = await Promise.all([
      entities.User.list('-created_date', 500), entities.Student.list('-created_date', 500),
      entities.WorkoutPlan.list('-created_date', 500), entities.DietPlan.list('-created_date', 500),
      entities.ChatMessage.list('-created_date', 500), entities.Payment.list('-created_date', 500),
      entities.CheckIn.list('-created_date', 500), entities.Exercise.list('-created_date', 500),
      entities.CalendarioHormonal.list('-created_date', 500), entities.SportsNews.list('-created_date', 500),
    ]);

    const activeStudents = students.filter(item => item.active !== false);
    const pendingStudents = students.filter(item => item.active === false);
    const personals = users.filter(item => item.role === 'personal');
    const subscribers = users.filter(item => item.role === 'assinante' || item.account_type === 'assinante' || item.assinatura_status);
    const unreadMessages = messages.filter(item => !item.read);
    const pendingPayments = payments.filter(item => item.status === 'pendente' || item.status === 'atrasado');
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const todayCheckIns = checkIns.filter(item => item.date === today);
    const activeHormonal = hormonalEvents.filter(item => item.status === 'ativo');
    const monthlyRevenue = payments.filter(item => item.status === 'pago' && item.payment_date?.startsWith(month)).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const recentActivity = [
      ...students.slice(0, 5).map(item => ({ id: `student-${item.id}`, date: item.created_date, text: `Novo aluno: ${item.name || item.email || 'Sem nome'}`, path: '/Students', type: 'student' })),
      ...payments.slice(0, 5).map(item => ({ id: `payment-${item.id}`, date: item.created_date, text: `Pagamento ${item.status || 'registrado'}: ${item.user_name || item.description || 'Sem identificação'}`, path: '/Finance', type: 'payment' })),
      ...workoutPlans.slice(0, 5).map(item => ({ id: `workout-${item.id}`, date: item.updated_date || item.created_date, text: `Treino atualizado: ${item.name || 'Sem nome'}`, path: '/WorkoutPlans', type: 'workout' })),
      ...dietPlans.slice(0, 5).map(item => ({ id: `diet-${item.id}`, date: item.updated_date || item.created_date, text: `Dieta atualizada: ${item.name || 'Sem nome'}`, path: '/Diet', type: 'diet' })),
    ].filter(item => item.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    return Response.json({
      metrics: {
        activeStudents: activeStudents.length, personals: personals.length, subscribers: subscribers.length,
        pendingStudents: pendingStudents.length, unreadMessages: unreadMessages.length, pendingPayments: pendingPayments.length,
        workoutPlans: workoutPlans.length, dietPlans: dietPlans.length, todayCheckIns: todayCheckIns.length,
        exercises: exercises.length, activeHormonal: activeHormonal.length, sportsNews: sportsNews.length,
        aiReports: workoutPlans.length + dietPlans.length, progress: checkIns.length,
      },
      monthlyRevenue,
      recentActivity,
    });
  } catch (error) {
    console.error('getAdminDashboardSummary failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}