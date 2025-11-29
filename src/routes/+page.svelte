<script>
  import { gameStore } from '../lib/stores/gameStore.js';
  import DiceDisplay from '../lib/components/DiceDisplay.svelte';
  import InvestmentPanel from '../lib/components/InvestmentPanel.svelte';
  import ScoreSheet from '../lib/components/ScoreSheet.svelte';
  import GameSetup from '../lib/components/GameSetup.svelte';
  import { getCurrentSprint } from '../lib/game/GameState.js';

  let showSetup = true;
  let uncertainMode = false;

  $: game = $gameStore;
  $: state = game.state;
  $: currentSprint = getCurrentSprint(state);
  $: hasRolledNV = currentSprint.nvRoll !== null;
  $: hasRolledTD = currentSprint.tdRoll !== null;
  $: canComplete = hasRolledNV && hasRolledTD;
  $: isGameOver = state.currentSprint === 10 && state.sprints[9].netNewValue !== null;

  function handleGameStart(event) {
    uncertainMode = event.detail.uncertainMode;
    gameStore.startNew(uncertainMode);
    showSetup = false;
  }

  function handleInvest(event) {
    gameStore.investInMeasure(event.detail);
  }

  function rollNV() {
    gameStore.rollNVDice();
  }

  function rollTD() {
    gameStore.rollTDDice();
  }

  function completeSprint() {
    if (canComplete) {
      gameStore.completeSprint();
    }
  }

  function restartGame() {
    showSetup = true;
  }
</script>

<svelte:head>
  <title>Dice of Debt - Technical Debt Game</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 p-4">
  <div class="max-w-7xl mx-auto">
    <header class="mb-6 text-center">
      <h1 class="text-4xl font-bold text-gray-800 mb-2">Dice of Debt</h1>
      <p class="text-gray-600">An Educational Game About Technical Debt</p>
      <p class="text-sm text-gray-500 mt-1">
        By Tom Grant | GameChange LLC | Agile Alliance
      </p>
    </header>

    {#if showSetup}
      <GameSetup on:start={handleGameStart} />
    {:else if isGameOver}
      <div class="mb-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg text-center">
        <h2 class="text-3xl font-bold text-green-800 mb-2">Game Complete!</h2>
        <p class="text-2xl mb-4">Final Score: <span class="font-bold">{state.sprints[9].cumulativeValue}</span></p>
        <button
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          on:click={restartGame}
        >
          Play Again
        </button>
      </div>
    {:else}
      <div class="mb-6 bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">Sprint {state.currentSprint} of 10</h2>
            {#if state.currentInvestment}
              <p class="text-sm text-blue-600 mt-1">
                Investing in {state.currentInvestment} (Progress: {state.investmentProgress + 1}/{state.sprints[state.currentSprint - 1].investedDice || 0})
              </p>
            {/if}
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">NV Dice: <span class="font-bold text-blue-600">{state.nvDice}</span></p>
            <p class="text-sm text-gray-600">TD Dice: <span class="font-bold text-red-600">{state.tdDice}</span></p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-md p-4">
          <h3 class="text-xl font-bold mb-4">New Value Dice</h3>

          {#if hasRolledNV}
            <DiceDisplay dice={currentSprint.nvRoll} color="blue" showTotal={true} />
          {:else}
            <button
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              on:click={rollNV}
            >
              Roll NV Dice ({state.nvDice} dice)
            </button>
          {/if}
        </div>

        <div class="bg-white rounded-lg shadow-md p-4">
          <h3 class="text-xl font-bold mb-4">Technical Debt Dice</h3>

          {#if hasRolledTD}
            <DiceDisplay dice={currentSprint.tdRoll} color="red" showTotal={true} />
            {#if state.activeMeasures.includes('continuousIntegration')}
              <p class="text-sm text-green-600 mt-2">✓ Can reroll TD dice (Continuous Integration)</p>
            {/if}
          {:else}
            <button
              class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              on:click={rollTD}
              disabled={!hasRolledNV}
            >
              Roll TD Dice ({state.tdDice} dice)
            </button>
          {/if}
        </div>
      </div>

      {#if canComplete}
        <div class="mb-6 text-center">
          <button
            class="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg"
            on:click={completeSprint}
          >
            Complete Sprint {state.currentSprint}
          </button>
        </div>
      {/if}

      <div class="mb-6">
        <InvestmentPanel
          currentInvestment={state.currentInvestment}
          completedMeasures={state.completedMeasures}
          activeMeasures={state.activeMeasures}
          on:invest={handleInvest}
        />
      </div>

      <div class="mb-6">
        <ScoreSheet sprints={state.sprints} currentSprint={state.currentSprint} />
      </div>
    {/if}
  </div>
</div>
