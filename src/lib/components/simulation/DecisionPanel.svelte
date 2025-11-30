<script>
  import { createEventDispatcher } from 'svelte';
  import { IMPROVEMENTS } from '../../simulation/BusinessRules.js';

  export let opportunities = [];
  export let week = 1;

  const dispatch = createEventDispatcher();

  let selectedTab = 'features';

  function deliverFeature(feature) {
    dispatch('deliverFeature', feature);
  }

  function investInImprovement(improvementId) {
    dispatch('investInImprovement', improvementId);
  }

  function advanceWeek() {
    dispatch('advanceWeek');
  }

  $: sortedOpportunities = [...opportunities].sort((a, b) => {
    const urgencyA = (week - a.createdWeek) / a.deadline;
    const urgencyB = (week - b.createdWeek) / b.deadline;
    return urgencyB - urgencyA;
  });

  function getComplexityColor(complexity) {
    switch(complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getDeadlineUrgency(opportunity) {
    const age = week - opportunity.createdWeek;
    const percentElapsed = age / opportunity.deadline;
    if (percentElapsed > 0.8) return 'text-red-600 font-bold';
    if (percentElapsed > 0.5) return 'text-yellow-600';
    return 'text-gray-600';
  }
</script>

<div class="bg-white shadow-lg rounded-lg p-6">
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-xl font-bold text-gray-800">Your Decision</h3>
    <button
      on:click={advanceWeek}
      class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
    >
      Skip Week →
    </button>
  </div>

  <div class="flex border-b mb-4">
    <button
      class="px-4 py-2 {selectedTab === 'features' ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600'}"
      on:click={() => selectedTab = 'features'}
    >
      🎯 Features ({opportunities.length})
    </button>
    <button
      class="px-4 py-2 {selectedTab === 'improvements' ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600'}"
      on:click={() => selectedTab = 'improvements'}
    >
      🔧 Improvements
    </button>
  </div>

  {#if selectedTab === 'features'}
    <div class="space-y-3">
      {#if sortedOpportunities.length === 0}
        <p class="text-gray-500 text-center py-8">No feature opportunities available. Advance the week to generate new ones.</p>
      {:else}
        {#each sortedOpportunities as opportunity}
          <div class="border rounded-lg p-4 hover:shadow-md transition">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h4 class="font-semibold text-gray-800">{opportunity.name}</h4>
                <div class="flex gap-2 mt-1">
                  <span class="text-xs px-2 py-1 rounded {getComplexityColor(opportunity.complexity)}">
                    {opportunity.complexity}
                  </span>
                  <span class="text-xs text-gray-600">
                    Value: £{opportunity.value}K
                  </span>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs {getDeadlineUrgency(opportunity)}">
                  {opportunity.deadline - (week - opportunity.createdWeek)} weeks left
                </p>
              </div>
            </div>
            <button
              on:click={() => deliverFeature(opportunity)}
              class="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Deliver this Feature
            </button>
          </div>
        {/each}
      {/if}
    </div>
  {:else}
    <div class="space-y-3">
      {#each Object.values(IMPROVEMENTS) as improvement}
        <div class="border rounded-lg p-4 hover:shadow-md transition">
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-800">{improvement.name}</h4>
              <p class="text-sm text-gray-600 mt-1">{improvement.description}</p>
              <div class="flex gap-3 mt-2 text-xs text-gray-700">
                <span>⏱️ {improvement.weeks} weeks</span>
                <span>🏥 +{improvement.codeHealthDelta} health</span>
                {#if improvement.capacityDelta > 0}
                  <span>💪 +{improvement.capacityDelta} capacity</span>
                {/if}
                {#if improvement.businessValueCost}
                  <span class="text-red-600">💰 -£{improvement.businessValueCost}K</span>
                {/if}
              </div>
            </div>
          </div>
          <button
            on:click={() => investInImprovement(improvement.id)}
            class="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Invest in {improvement.name}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
