export function startupToText(p) {
  return (
    `${p.startup_name} is a ${p.sector} startup at ${p.stage} stage ` +
    `targeting the ${p.market} market, headquartered in ${p.hq_country}. ` +
    `Total raised: ${p.total_raised}. Current raise: ${p.current_raise}. ` +
    `Revenue: ${p.revenue}. Growth rate: ${(p.growth_rate * 100).toFixed(1)}%. ` +
    `Team size: ${p.team_size}. Traction score: ${p.traction_score}. ` +
    `Risk score: ${p.risk_score}.`
  );
}

export function investorToText(p) {
  const sectors = Array.isArray(p.preferred_sectors)
    ? p.preferred_sectors.join(", ")
    : p.preferred_sectors;
  const stages = Array.isArray(p.preferred_stages)
    ? p.preferred_stages.join(", ")
    : p.preferred_stages;

  return (
    `${p.investor_name} invests in ${sectors} at ${stages} stage ` +
    `with geographic focus on ${p.geo_focus}. ` +
    `Check size: $${p.check_min} to $${p.check_max}. ` +
    `Risk appetite: ${p.risk_appetite}. ` +
    `Deals per year: ${p.deals_per_year}. ` +
    `Pre-revenue okay: ${p.pre_revenue_ok}. ` +
    `Thesis: ${p.thesis_text}`
  );
}