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
      case 'low': return 'bg-green-300 text-black';
      case 'medium': return 'bg-yellow-300 text-black';
      case 'high': return 'bg-red-300 text-black';
      default: return 'bg-gray-300 text-black';
    }
  }

  function getDeadlineUrgency(opportunity) {
    const age = week - opportunity.createdWeek;
    const percentElapsed = age / opportunity.deadline;
    if (percentElapsed > 0.8) return 'text-red-600 font-black';
    if (percentElapsed > 0.5) return 'text-orange-600 font-black';
    return 'text-black font-bold';
  }
</script>

<div class="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
  <div class="flex justify-between items-center mb-6">
    <h3 class="text-3xl font-black text-black">MAKE YOUR DECISION</h3>
    <button
      on:click={advanceWeek}
      class="px-6 py-3 bg-black text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase"
    >
      End Week →
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Features Column -->
    <div class="border-r-4 border-black pr-6">
      <h4 class="text-2xl font-black text-black mb-4 flex items-center gap-2 uppercase">
        🎯 <span>Features</span>
        <span class="text-sm font-black bg-yellow-300 border-2 border-black px-2 py-1">({sortedOpportunities.length})</span>
      </h4>

      <div class="space-y-3 max-h-[600px] overflow-y-auto">
        {#if sortedOpportunities.length === 0}
          <p class="text-black text-center py-8 text-sm font-bold bg-gray-200 border-3 border-black">No feature opportunities available. End the week to generate new ones.</p>
        {:else}
          {#each sortedOpportunities as opportunity}
            <div class="border-3 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <h5 class="font-black text-black mb-2">{opportunity.name}</h5>
                  <div class="flex gap-2">
                    <span class="text-xs px-2 py-1 border-2 border-black font-bold uppercase {getComplexityColor(opportunity.complexity)}">
                      {opportunity.complexity}
                    </span>
                    <span class="text-xs font-bold text-black bg-yellow-300 border-2 border-black px-2 py-1">
                      Value: £{opportunity.value}K
                    </span>
                  </div>
                </div>
                <div class="text-right ml-2">
                  <p class="text-xs font-bold {getDeadlineUrgency(opportunity)}">
                    {opportunity.deadline - (week - opportunity.createdWeek)} weeks left
                  </p>
                </div>
              </div>
              <button
                on:click={() => deliverFeature(opportunity)}
                class="w-full mt-3 px-4 py-2 bg-blue-500 text-white border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all text-sm font-black uppercase"
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
      <h4 class="text-2xl font-black text-black mb-4 flex items-center gap-2 uppercase">
        🔧 <span>Improvements</span>
      </h4>

      <div class="space-y-3 max-h-[600px] overflow-y-auto">
        {#each Object.values(IMPROVEMENTS) as improvement}
          <div class="border-3 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div class="mb-3">
              <h5 class="font-black text-black mb-2">{improvement.name}</h5>
              <p class="text-sm text-black font-bold">{improvement.description}</p>
            </div>

            <div class="flex flex-wrap gap-2 mb-3 text-xs">
              <span class="bg-gray-300 border-2 border-black px-2 py-1 font-bold text-black">
                ⏱️ {improvement.weeks} {improvement.weeks === 1 ? 'week' : 'weeks'}
              </span>
              <span class="bg-green-300 border-2 border-black px-2 py-1 font-bold text-black">
                🏥 +{improvement.codeHealthDelta} health
              </span>
              {#if improvement.capacityDelta > 0}
                <span class="bg-blue-300 border-2 border-black px-2 py-1 font-bold text-black">
                  💪 +{improvement.capacityDelta} capacity
                </span>
              {/if}
              {#if improvement.businessValueCost}
                <span class="bg-red-300 border-2 border-black px-2 py-1 font-bold text-black">
                  💰 -£{improvement.businessValueCost}K
                </span>
              {/if}
            </div>

            <button
              on:click={() => investInImprovement(improvement.id)}
              class="w-full px-4 py-2 bg-green-500 text-white border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all text-sm font-black uppercase"
            >
              Invest in {improvement.name}
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
