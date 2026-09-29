export function metrics(project, revenues = [], expenses = [], snapshots = []) {
  const latest =
    [...snapshots].sort((a, b) => b.date.localeCompare(a.date))[0] || {};
  const revenue = revenues.reduce((s, r) => s + r.amount, 0),
    costs = expenses.reduce((s, r) => s + r.amount, 0);
  return {
    ...project,
    revenue,
    costs,
    profit: revenue - costs,
    visitors: latest.visitors || 0,
    users: latest.users || 0,
    active: latest.active || 0,
    customers: latest.customers || 0,
    mrr: latest.mrr || 0,
    conversion: latest.visitors
      ? (100 * (latest.customers || 0)) / latest.visitors
      : 0,
    profitHour: project.hours ? (revenue - costs) / project.hours : 0,
  };
}
