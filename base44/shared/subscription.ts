export function downgradeToStudentFields(cancelledAt = new Date().toISOString()) {
  return {
    role: 'user',
    account_type: 'aluno',
    assinatura_status: 'cancelada',
    assinatura_origem: 'nenhuma',
    assinatura_bloqueio_manual: false,
    assinatura_cancelar_no_fim: false,
    assinatura_cancelada_em: cancelledAt,
    stripe_subscription_id: ''
  };
}

export function scheduledCancellationFields(periodEnd) {
  return {
    assinatura_status: 'cancelamento_agendado',
    assinatura_cancelar_no_fim: true,
    assinatura_vencimento: periodEnd
  };
}