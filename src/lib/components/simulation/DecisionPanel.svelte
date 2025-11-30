<script>
  import { createEventDispatcher } from 'svelte';
  import { IMPROVEMENTS } from '../../simulation/BusinessRules.js';
  import { calculateWeeklyCapacity } from '../../simulation/GameEngine.js';

  export let opportunities = [];
  export let workInProgress = [];
  export let capacityAllocation = {};
  export let capacity = 100;
  export let flowEfficiency = 0.75;
  export let week = 1;

  const dispatch = createEventDispatcher();

  let allocation = { ...capacityAllocation };
  $: weeklyCapacity = calculateWeeklyCapacity(capacity, flowEfficiency);
  $: allocatedPoints = Object.values(allocation).reduce((sum, points) => sum + points, 0);
  $: availablePoints = weeklyCapacity - allocatedPoints;

  // Filter out improvements that are already in progress
  $: availableImprovements = Object.values(IMPROVEMENTS).filter(improvement =>
    !workInProgress.some(wip => wip.id === improvement.id)
  );

  function startFeature(feature) {
    dispatch('startFeature', feature);
  }

  function startImprovement(improvementId) {
    dispatch('startImprovement', improvementId);
  }

  function updateAllocation(itemId, points) {
    allocation = { ...allocation, [itemId]: Math.max(0, Math.min(availablePoints + (allocation[itemId] || 0), points)) };
  }

  function handleEndWeek() {
    dispatch('allocateCapacity', allocation);
    dispatch('endWeek');
    allocation = {};
  }

  function getComplexityColor(complexity) {
    switch(complexity) {
      case 'low': return 'bg-emerald-200 text-emerald-900';
      case 'medium': return 'bg-amber-200 text-amber-900';
      case 'high': return 'bg-rose-200 text-rose-900';
      default: return 'bg-gray-200 text-gray-900';
    }
  }

  function getProgressPercent(item) {
    return Math.min(100, (item.pointsCompleted / item.pointsNeeded) * 100);
  }
</script>

<!-- WIP Section -->
{#if workInProgress.length > 0}
  <div class="bg-gradient-to-br from-violet-300 to-purple-400 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-6 mb-6 max-w-5xl mx-auto">
    <h3 class="text-2xl font-black text-black mb-5 uppercase">⚙️ Work in Progress</h3>
    <div class="space-y-4">
      {#each workInProgress as item}
        <div class="bg-white border-2 border-black p-4">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-black text-black text-sm uppercase">{item.name}</h4>
            <span class="text-xs font-black bg-violet-300 border-2 border-black px-2 py-1">
              {Math.round(getProgressPercent(item))}% EFFORT
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="bg-gray-200 border-2 border-black h-4 mb-2">
            <div class="bg-gradient-to-r from-violet-500 to-purple-500 h-full transition-all" style="width: {getProgressPercent(item)}%"></div>
          </div>

          <!-- Capacity Slider -->
          <div class="flex items-center gap-2">
            <label class="text-xs font-black uppercase">Allocate:</label>
            <input
              type="range"
              min="0"
              max={availablePoints + (allocation[item.id] || 0)}
              value={allocation[item.id] || 0}
              on:input={(e) => updateAllocation(item.id, parseInt(e.target.value))}
              class="flex-1"
            />
            <span class="text-xs font-black bg-amber-300 border-2 border-black px-2 py-1 w-16 text-center">
              {allocation[item.id] || 0}
            </span>
          </div>
        </div>
      {/each}
    </div>

    <!-- Capacity Summary -->
    <div class="mt-4 bg-amber-300 border-2 border-black p-3 flex justify-between items-center">
      <span class="font-black text-sm uppercase">Weekly Capacity:</span>
      <span class="font-black">{Math.round((allocatedPoints / weeklyCapacity) * 100)}% allocated ({allocatedPoints} / {weeklyCapacity})</span>
    </div>
  </div>
{/if}

<!-- Decision Panel -->
<div class="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 max-w-5xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <h3 class="text-3xl font-black text-black uppercase">Make Your Decision</h3>
    <button
      on:click={handleEndWeek}
      class="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:from-violet-600 hover:to-purple-600 transition-colors font-black uppercase text-sm"
    >
      End Week →
    </button>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <!-- Features Column -->
    <div>
      <h4 class="text-xl font-black text-black mb-4">
        🎯 Features
        <span class="text-xs font-black bg-amber-100 border-2 border-black px-2 py-1">({opportunities.length})</span>
      </h4>

      <div class="space-y-3">
        {#if opportunities.length === 0}
          <p class="text-black text-center py-6 text-xs font-black bg-gray-200 border-2 border-black uppercase">No features available</p>
        {:else}
          {#each opportunities as opportunity}
            <div class="border-2 border-black p-4 bg-gradient-to-br from-sky-300 to-cyan-400 hover:from-sky-400 hover:to-cyan-500 transition-colors">
              <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                  <h5 class="font-black text-black mb-1 text-sm leading-tight">{opportunity.name}</h5>
                  <div class="flex gap-1 flex-wrap">
                    <span class="text-xs px-2 py-1 border-2 border-black font-black uppercase {getComplexityColor(opportunity.complexity)}">
                      {opportunity.complexity}
                    </span>
                    <span class="text-xs font-black text-black bg-yellow-300 border-2 border-black px-2 py-1">
                      £{opportunity.value}K
                    </span>
                  </div>
                </div>
              </div>
              <button
                on:click={() => startFeature(opportunity)}
                class="w-full mt-2 px-3 py-2 bg-sky-400 text-white border-2 border-black hover:bg-sky-500 transition-colors text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Start Feature
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Improvements Column -->
    <div>
      <h4 class="text-xl font-black text-black mb-4">
        🔧 Improvements
      </h4>

      <div class="space-y-3">
        {#each availableImprovements as improvement}
          <div class="border-2 border-black p-4 bg-gradient-to-br from-emerald-300 to-teal-400 hover:from-emerald-400 hover:to-teal-500 transition-colors">
            <div class="mb-3">
              <h5 class="font-black text-black mb-1 text-sm leading-tight">{improvement.name}</h5>
              <p class="text-xs text-black font-black leading-tight">{improvement.description}</p>
            </div>

            <div class="flex flex-wrap gap-2 mb-3 text-xs">
              <span class="bg-gray-300 border-2 border-black px-2 py-1 font-black">
                ⏱️ {improvement.weeks}w
              </span>
              <span class="bg-green-300 border-2 border-black px-2 py-1 font-black">
                🏥 +{improvement.codeHealthDelta}
              </span>
              {#if improvement.capacityDelta > 0}
                <span class="bg-blue-300 border-2 border-black px-2 py-1 font-black">
                  💪 +{improvement.capacityDelta}
                </span>
              {/if}
            </div>

            <button
              on:click={() => startImprovement(improvement.id)}
              class="w-full px-3 py-2 bg-emerald-400 text-white border-2 border-black hover:bg-emerald-500 transition-colors text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Start Improvement
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
