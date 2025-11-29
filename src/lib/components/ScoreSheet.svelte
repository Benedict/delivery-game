<script>
  export let sprints = [];
  export let currentSprint = 1;

  $: finalScore = sprints[9]?.cumulativeValue || 0;
  $: isComplete = currentSprint === 10 && sprints[9].netNewValue !== null;
</script>

<div class="score-sheet bg-white rounded-lg shadow-md p-4 overflow-x-auto">
  <h2 class="text-xl font-bold mb-4">Scoring Sheet</h2>

  <table class="w-full border-collapse text-sm">
    <thead>
      <tr class="bg-gray-200">
        <th class="border border-gray-400 px-2 py-1">Sprint</th>
        {#each sprints as sprint}
          <th
            class="border border-gray-400 px-2 py-1 {sprint.number === currentSprint ? 'bg-blue-200' : ''}"
            data-sprint={sprint.number}
          >
            {sprint.number}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="border border-gray-400 px-2 py-1 font-semibold bg-gray-100">NV Dice</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center" data-sprint={sprint.number}>
            {sprint.nvDiceCount}
          </td>
        {/each}
      </tr>
      <tr>
        <td class="border border-gray-400 px-2 py-1 font-semibold bg-gray-100">TD Dice</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center" data-sprint={sprint.number}>
            {sprint.tdDiceCount}
          </td>
        {/each}
      </tr>
      <tr class="bg-blue-50">
        <td class="border border-gray-400 px-2 py-1 font-semibold">NV Created</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center" data-sprint={sprint.number}>
            {sprint.nvTotal ?? '—'}
          </td>
        {/each}
      </tr>
      <tr class="bg-red-50">
        <td class="border border-gray-400 px-2 py-1 font-semibold">TD Created</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center" data-sprint={sprint.number}>
            {sprint.tdTotal ?? '—'}
          </td>
        {/each}
      </tr>
      <tr class="bg-green-50">
        <td class="border border-gray-400 px-2 py-1 font-semibold">Net New Value</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center font-bold" data-sprint={sprint.number}>
            {sprint.netNewValue ?? '—'}
          </td>
        {/each}
      </tr>
      <tr class="bg-yellow-50">
        <td class="border border-gray-400 px-2 py-1 font-semibold">Cumulative</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center font-bold" data-sprint={sprint.number}>
            {sprint.cumulativeValue}
          </td>
        {/each}
      </tr>
    </tbody>
  </table>

  {#if isComplete}
    <div class="mt-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
      <h3 class="text-2xl font-bold text-green-800">Game Complete!</h3>
      <p class="text-xl mt-2">Final Score: <span class="font-bold">{finalScore}</span></p>
    </div>
  {/if}
</div>
