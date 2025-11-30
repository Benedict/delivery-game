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

<div class="bg-white shadow-lg rounded-lg p-6 mb-6">
  <div class="flex justify-between items-start mb-4">
    <div>
      <h2 class="text-2xl font-bold text-gray-800">Week {week}</h2>
      <p class="text-sm text-gray-600">{weeksRemaining} weeks remaining</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-600">Victory: {victoryConditions.description}</p>
      <div class="w-48 bg-gray-200 rounded-full h-2 mt-1">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style="width: {progressPercent}%"
        ></div>
      </div>
      <p class="text-xs text-gray-500 mt-1">£{metrics.businessValue}K / £{victoryConditions.businessValue}K</p>
    </div>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <div class="bg-gray-50 rounded p-3">
      <div class="text-xs text-gray-600 mb-1">💪 Capacity</div>
      <div class="text-2xl font-bold text-gray-800">{metrics.capacity}</div>
    </div>

    <div class="bg-gray-50 rounded p-3">
      <div class="text-xs text-gray-600 mb-1">🏥 Code Health</div>
      <div class="text-2xl font-bold {healthColor}">{metrics.codeHealth}</div>
    </div>

    <div class="bg-gray-50 rounded p-3">
      <div class="text-xs text-gray-600 mb-1">😊 Satisfaction</div>
      <div class="text-2xl font-bold {satisfactionColor}">{metrics.satisfaction}</div>
    </div>

    <div class="bg-gray-50 rounded p-3">
      <div class="text-xs text-gray-600 mb-1">📈 Market Position</div>
      <div class="text-2xl font-bold text-gray-800">{metrics.marketPosition}</div>
    </div>

    <div class="bg-gray-50 rounded p-3">
      <div class="text-xs text-gray-600 mb-1">💰 Business Value</div>
      <div class="text-2xl font-bold text-blue-600">£{metrics.businessValue}K</div>
    </div>

    <div class="bg-gray-50 rounded p-3">
      <div class="text-xs text-gray-600 mb-1">⚡ Flow Efficiency</div>
      <div class="text-2xl font-bold text-gray-800">{Math.round(metrics.flowEfficiency * 100)}%</div>
    </div>
  </div>
</div>
