<script>
  import { getAllMeasures } from '../game/TDMeasures.js';

  export let currentInvestment = null;
  export let completedMeasures = [];
  export let activeMeasures = [];
  export let availableMeasures = getAllMeasures();
  export let oninvest = undefined;

  $: measures = availableMeasures;

  function handleInvest(measureId) {
    oninvest?.({ detail: measureId });
  }

  function isDisabled(measureId) {
    return currentInvestment !== null || completedMeasures.includes(measureId);
  }

  function getStatusText(measure) {
    if (completedMeasures.includes(measure.id)) {
      return 'Completed';
    }
    if (currentInvestment === measure.id) {
      return 'Investing...';
    }
    return 'Available';
  }

  const colorMap = {
    blue: 'border-blue-500 bg-blue-50',
    gray: 'border-gray-500 bg-gray-50',
    green: 'border-green-500 bg-green-50',
    yellow: 'border-yellow-500 bg-yellow-50'
  };
</script>

<div class="investment-panel p-4 bg-white rounded-lg shadow-md">
  <h2 class="text-xl font-bold mb-4">TD-Reducing Measures</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each measures as measure}
      <div class="measure-card border-2 {colorMap[measure.color]} rounded-lg p-4">
        <h3 class="font-bold text-lg mb-2">{measure.name}</h3>
        <p class="text-sm text-gray-600 mb-3">{measure.description}</p>

        <div class="text-sm mb-2">
          <strong>Cost:</strong> {measure.cost} NV dice for {measure.costDuration} turns
        </div>

        <div class="text-sm mb-3">
          <strong>Commitment:</strong> {measure.commitment}
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold {
            completedMeasures.includes(measure.id) ? 'text-green-600' :
            currentInvestment === measure.id ? 'text-blue-600' :
            'text-gray-600'
          }">
            {getStatusText(measure)}
          </span>

          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isDisabled(measure.id)}
            on:click={() => handleInvest(measure.id)}
          >
            Invest
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>
