<script>
  import { createEventDispatcher } from 'svelte';
  import { IMPROVEMENTS } from '../../simulation/BusinessRules.js';

  export let opportunities = [];
  export let week = 1;

  const dispatch = createEventDispatcher();

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
  <div class="flex justify-between items-center mb-6">
    <h3 class="text-2xl font-bold text-gray-800">Make Your Decision</h3>
    <button
      on:click={advanceWeek}
      class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
    >
      End Week →
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Features Column -->
    <div class="border-r border-gray-200 pr-6">
      <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🎯 <span>Features</span>
        <span class="text-sm font-normal text-gray-600">({sortedOpportunities.length})</span>
      </h4>

      <div class="space-y-3 max-h-[600px] overflow-y-auto">
        {#if sortedOpportunities.length === 0}
          <p class="text-gray-500 text-center py-8 text-sm">No feature opportunities available. End the week to generate new ones.</p>
        {:else}
          {#each sortedOpportunities as opportunity}
            <div class="border rounded-lg p-4 hover:shadow-md transition bg-white">
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <h5 class="font-semibold text-gray-800 mb-1">{opportunity.name}</h5>
                  <div class="flex gap-2">
                    <span class="text-xs px-2 py-1 rounded {getComplexityColor(opportunity.complexity)}">
                      {opportunity.complexity}
                    </span>
                    <span class="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      Value: £{opportunity.value}K
                    </span>
                  </div>
                </div>
                <div class="text-right ml-2">
                  <p class="text-xs {getDeadlineUrgency(opportunity)}">
                    {opportunity.deadline - (week - opportunity.createdWeek)} weeks left
                  </p>
                </div>
              </div>
              <button
                on:click={() => deliverFeature(opportunity)}
                class="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
              >
                Deliver this Feature
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Improvements Column -->
    <div class="pl-6">
      <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🔧 <span>Improvements</span>
      </h4>

      <div class="space-y-3 max-h-[600px] overflow-y-auto">
        {#each Object.values(IMPROVEMENTS) as improvement}
          <div class="border rounded-lg p-4 hover:shadow-md transition bg-white">
            <div class="mb-3">
              <h5 class="font-semibold text-gray-800 mb-1">{improvement.name}</h5>
              <p class="text-sm text-gray-600">{improvement.description}</p>
            </div>

            <div class="flex flex-wrap gap-2 mb-3 text-xs">
              <span class="bg-gray-100 px-2 py-1 rounded text-gray-700">
                ⏱️ {improvement.weeks} {improvement.weeks === 1 ? 'week' : 'weeks'}
              </span>
              <span class="bg-green-100 px-2 py-1 rounded text-green-700">
                🏥 +{improvement.codeHealthDelta} health
              </span>
              {#if improvement.capacityDelta > 0}
                <span class="bg-blue-100 px-2 py-1 rounded text-blue-700">
                  💪 +{improvement.capacityDelta} capacity
                </span>
              {/if}
              {#if improvement.businessValueCost}
                <span class="bg-red-100 px-2 py-1 rounded text-red-700">
                  💰 -£{improvement.businessValueCost}K
                </span>
              {/if}
            </div>

            <button
              on:click={() => investInImprovement(improvement.id)}
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
            >
              Invest in {improvement.name}
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
