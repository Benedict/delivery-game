<script>
  import { createEventDispatcher } from 'svelte';

  export let uncertainMode = false;

  const dispatch = createEventDispatcher();

  function startGame() {
    dispatch('start', { uncertainMode });
  }
</script>

<div class="game-setup bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
  <h2 class="text-2xl font-bold mb-4">Game Setup</h2>

  <div class="mb-6">
    <h3 class="font-semibold mb-2">Game Mode</h3>
    <label class="flex items-center space-x-3 cursor-pointer">
      <input type="radio" bind:group={uncertainMode} value={false} class="w-4 h-4" />
      <div>
        <div class="font-semibold">Standard Mode</div>
        <div class="text-sm text-gray-600">Fixed costs and benefits for all TD-reducing measures</div>
      </div>
    </label>

    <label class="flex items-center space-x-3 cursor-pointer mt-3">
      <input type="radio" bind:group={uncertainMode} value={true} class="w-4 h-4" />
      <div>
        <div class="font-semibold">Uncertain Outcomes Variant</div>
        <div class="text-sm text-gray-600">Randomized costs and benefits - discover them as you invest</div>
      </div>
    </label>
  </div>

  <button
    class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
    on:click={startGame}
  >
    Start Game
  </button>
</div>
