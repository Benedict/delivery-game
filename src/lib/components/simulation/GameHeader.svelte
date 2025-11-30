<script>
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

  $: progressPercent = Math.min(100, (metrics.businessValue / victoryConditions.businessValue) * 100);
  $: weeksRemaining = victoryConditions.weeks - week;

  $: healthColor = metrics.codeHealth > 60 ? 'text-green-600' :
                    metrics.codeHealth > 30 ? 'text-yellow-600' :
                    metrics.codeHealth > 0 ? 'text-orange-600' : 'text-red-600';

  $: satisfactionColor = metrics.satisfaction > 60 ? 'text-green-600' :
                          metrics.satisfaction > 30 ? 'text-yellow-600' : 'text-red-600';
</script>

<div class="bg-amber-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-6 max-w-5xl mx-auto">
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
    <div class="bg-gradient-to-br from-sky-200 to-blue-200 border-2 border-black p-4">
      <div class="text-xs font-bold text-sky-900 mb-1">💪 CAPACITY</div>
      <div class="text-2xl font-black text-black">{metrics.capacity}</div>
    </div>

    <div class="bg-gradient-to-br from-emerald-200 to-green-200 border-2 border-black p-4">
      <div class="text-xs font-bold text-emerald-900 mb-1">🏥 CODE HEALTH</div>
      <div class="text-2xl font-black text-black">{metrics.codeHealth}</div>
    </div>

    <div class="bg-gradient-to-br from-rose-200 to-pink-200 border-2 border-black p-4">
      <div class="text-xs font-bold text-rose-900 mb-1">😊 SATISFACTION</div>
      <div class="text-2xl font-black text-black">{metrics.satisfaction}</div>
    </div>

    <div class="bg-gradient-to-br from-violet-200 to-purple-200 border-2 border-black p-4">
      <div class="text-xs font-bold text-violet-900 mb-1">📈 MARKET POSITION</div>
      <div class="text-2xl font-black text-black">{metrics.marketPosition}</div>
    </div>

    <div class="bg-gradient-to-br from-amber-200 to-yellow-200 border-2 border-black p-4">
      <div class="text-xs font-bold text-amber-900 mb-1">💰 BUSINESS VALUE</div>
      <div class="text-2xl font-black text-black">£{metrics.businessValue}K</div>
    </div>

    <div class="bg-gradient-to-br from-teal-200 to-cyan-200 border-2 border-black p-4">
      <div class="text-xs font-bold text-teal-900 mb-1">⚡ FLOW EFFICIENCY</div>
      <div class="text-2xl font-black text-black">{Math.round(metrics.flowEfficiency * 100)}%</div>
    </div>
  </div>
</div>
