<script>
  import { IMPROVEMENTS, getBonusStrength } from '$lib/simulation/BusinessRules.js';

  export let week = 1;
  export let metrics = {
    capacity: 100,
    codeHealth: 50,
    satisfaction: 50,
    marketPosition: 50,
    businessValue: 0,
    flowEfficiency: 0.75
  };
  export let victoryConditions = {
    businessValue: 500,
    weeks: 15,
    description: 'Reach $500K in 15 weeks'
  };
  export let activeBonuses = [];

  $: progressPercent = Math.min(100, (metrics.businessValue / victoryConditions.businessValue) * 100);
  $: weeksRemaining = victoryConditions.weeks - week;

  $: healthColor = metrics.codeHealth > 60 ? 'text-green-600' :
                    metrics.codeHealth > 30 ? 'text-yellow-600' :
                    metrics.codeHealth > 0 ? 'text-orange-600' : 'text-red-600';

  $: satisfactionColor = metrics.satisfaction > 60 ? 'text-green-600' :
                          metrics.satisfaction > 30 ? 'text-yellow-600' : 'text-red-600';

  function statusFor(maturity) {
    if (maturity >= 1.0) return 'mature';
    if (maturity > 0) return 'building';
    return 'dormant';
  }

  function effectLabelFor(bonus) {
    const improvement = IMPROVEMENTS[bonus.sourceImprovement];
    return improvement ? improvement.name : bonus.sourceImprovement;
  }

  function effectSummaryFor(bonus) {
    if (bonus.maturity === 0) return 'No effect — discipline has eroded';

    const strengthPct = Math.round(bonus.maturity * 100);

    if (bonus.type === 'reduceBugProbability') {
      const reduction = getBonusStrength([bonus], 'reduceBugProbability', { codeHealth: metrics.codeHealth });
      return `Reducing bug rate by ~${Math.round(reduction * 100)}% right now (${strengthPct}% strength)`;
    }

    if (bonus.type === 'reduceFeatureImpact') {
      const low = Math.round(getBonusStrength([bonus], 'reduceFeatureImpact', { complexity: 'low' }) * 100);
      const med = Math.round(getBonusStrength([bonus], 'reduceFeatureImpact', { complexity: 'medium' }) * 100);
      const high = Math.round(getBonusStrength([bonus], 'reduceFeatureImpact', { complexity: 'high' }) * 100);
      return `Reducing feature impact: ${low}% / ${med}% / ${high}% on simple / medium / complex features (${strengthPct}% strength)`;
    }

    return '';
  }
</script>

<div class="bg-amber-300 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-6 max-w-5xl mx-auto">
  <div class="flex justify-between items-start mb-6">
    <div>
      <h2 class="text-3xl font-black text-black uppercase leading-none">Week {week}</h2>
      <p class="text-xs font-black text-black uppercase">{weeksRemaining} weeks left</p>
    </div>
    <div class="text-right">
      <p class="text-xs font-black text-black mb-2 uppercase leading-tight">{victoryConditions.description}</p>
      <div class="w-48 bg-white border-2 border-black h-5">
        <div
          class="bg-black h-full transition-all duration-500"
          style="width: {progressPercent}%"
        ></div>
      </div>
      <p class="text-xs font-black text-black mt-1">£{metrics.businessValue}K / £{victoryConditions.businessValue}K</p>
    </div>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <div class="bg-gradient-to-br from-sky-300 to-blue-400 border-2 border-black p-4">
      <div class="text-xs font-bold text-sky-950 mb-1">💪 CAPACITY</div>
      <div class="text-2xl font-black text-black">{metrics.capacity}</div>
    </div>

    <div class="bg-gradient-to-br from-emerald-300 to-green-400 border-2 border-black p-4">
      <div class="text-xs font-bold text-emerald-950 mb-1">🏥 CODE HEALTH</div>
      <div class="text-2xl font-black text-black">{metrics.codeHealth}</div>
    </div>

    <div class="bg-gradient-to-br from-rose-300 to-pink-400 border-2 border-black p-4">
      <div class="text-xs font-bold text-rose-950 mb-1">😊 SATISFACTION</div>
      <div class="text-2xl font-black text-black">{metrics.satisfaction}</div>
    </div>

    <div class="bg-gradient-to-br from-violet-300 to-purple-400 border-2 border-black p-4">
      <div class="text-xs font-bold text-violet-950 mb-1">📈 MARKET POSITION</div>
      <div class="text-2xl font-black text-black">{metrics.marketPosition}</div>
    </div>

    <div class="bg-gradient-to-br from-amber-300 to-yellow-400 border-2 border-black p-4">
      <div class="text-xs font-bold text-amber-950 mb-1">💰 BUSINESS VALUE</div>
      <div class="text-2xl font-black text-black">£{metrics.businessValue}K</div>
    </div>

    <div class="bg-gradient-to-br from-teal-300 to-cyan-400 border-2 border-black p-4">
      <div class="text-xs font-bold text-teal-950 mb-1">⚡ FLOW EFFICIENCY</div>
      <div class="text-2xl font-black text-black">{Math.round(metrics.flowEfficiency * 100)}%</div>
    </div>
  </div>

  {#if activeBonuses.length > 0}
    <div class="mt-4 border-t-2 border-black pt-4">
      <h3 class="text-xs font-black text-black uppercase mb-2">Active Practices</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each activeBonuses as bonus}
          <div class="bg-white border-2 border-black p-3">
            <div class="flex justify-between items-baseline mb-2">
              <span class="text-sm font-black uppercase">{effectLabelFor(bonus)}</span>
              <span class="text-xs font-bold text-gray-700">{Math.round(bonus.maturity * 100)}% — {statusFor(bonus.maturity)}</span>
            </div>
            <div class="w-full bg-gray-200 border border-black h-3">
              <div
                class="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-500"
                style="width: {bonus.maturity * 100}%"
              ></div>
            </div>
            <p class="text-xs font-bold text-gray-700 mt-2">{effectSummaryFor(bonus)}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
