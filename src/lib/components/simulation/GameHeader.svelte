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

<div class="bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
  <div class="flex justify-between items-start mb-6">
    <div>
      <h2 class="text-3xl font-black text-black">Week {week}</h2>
      <p class="text-sm font-bold text-black">{weeksRemaining} weeks remaining</p>
    </div>
    <div class="text-right">
      <p class="text-sm font-bold text-black mb-2">{victoryConditions.description}</p>
      <div class="w-48 bg-white border-2 border-black h-6">
        <div
          class="bg-black h-full transition-all duration-500"
          style="width: {progressPercent}%"
        ></div>
      </div>
      <p class="text-xs font-bold text-black mt-1">£{metrics.businessValue}K / £{victoryConditions.businessValue}K</p>
    </div>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <div class="bg-blue-400 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
      <div class="text-xs font-bold text-black mb-1">💪 CAPACITY</div>
      <div class="text-2xl font-black text-black">{metrics.capacity}</div>
    </div>

    <div class="bg-green-400 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
      <div class="text-xs font-bold text-black mb-1">🏥 CODE HEALTH</div>
      <div class="text-2xl font-black text-black">{metrics.codeHealth}</div>
    </div>

    <div class="bg-pink-400 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
      <div class="text-xs font-bold text-black mb-1">😊 SATISFACTION</div>
      <div class="text-2xl font-black text-black">{metrics.satisfaction}</div>
    </div>

    <div class="bg-purple-400 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
      <div class="text-xs font-bold text-black mb-1">📈 MARKET POSITION</div>
      <div class="text-2xl font-black text-black">{metrics.marketPosition}</div>
    </div>

    <div class="bg-orange-400 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
      <div class="text-xs font-bold text-black mb-1">💰 BUSINESS VALUE</div>
      <div class="text-2xl font-black text-black">£{metrics.businessValue}K</div>
    </div>

    <div class="bg-cyan-400 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
      <div class="text-xs font-bold text-black mb-1">⚡ FLOW EFFICIENCY</div>
      <div class="text-2xl font-black text-black">{Math.round(metrics.flowEfficiency * 100)}%</div>
    </div>
  </div>
</div>
