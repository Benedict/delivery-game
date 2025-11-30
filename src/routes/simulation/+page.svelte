<script>
  import { gameStore, startNewGame, deliverFeature, investInImprovement, advanceWeek } from '../../lib/stores/gameStore.js';
  import { getScenario, SCENARIOS } from '../../lib/simulation/ScenarioDefinitions.js';
  import { generateFeatureStory, generateImprovementStory, generateEventStory } from '../../lib/simulation/StoryEngine.js';
  import GameHeader from '../../lib/components/simulation/GameHeader.svelte';
  import DecisionPanel from '../../lib/components/simulation/DecisionPanel.svelte';

  let gameState = 'intro'; // intro, scenarioSelect, scenarioStory, playing, gameOver
  let selectedScenario = null;
  let recentStory = '';
  let recentEvents = [];

  $: game = $gameStore;

  function startGame() {
    gameState = 'scenarioSelect';
  }

  function selectScenario(scenarioId) {
    selectedScenario = scenarioId;
    gameState = 'scenarioStory';
  }

  function beginGame() {
    startNewGame(selectedScenario);
    const scenario = getScenario(selectedScenario);
    recentStory = `Week 1 begins. ${scenario.story.challenge}`;
    recentEvents = [];
    gameState = 'playing';
  }

  function handleDeliverFeature(event) {
    const feature = event.detail;

    deliverFeature(feature);

    // Generate story for the delivery
    const decision = $gameStore.history.decisions[$gameStore.history.decisions.length - 1];
    recentStory = generateFeatureStory(feature, decision.outcome);

    // Check if any events were triggered
    checkForNewEvents();
    checkGameOver();
  }

  function handleInvestInImprovement(event) {
    const improvementId = event.detail;

    investInImprovement(improvementId);

    // Generate story for the improvement
    const decision = $gameStore.history.decisions[$gameStore.history.decisions.length - 1];
    recentStory = generateImprovementStory(decision.improvement, decision.outcome);

    checkForNewEvents();
    checkGameOver();
  }

  function handleAdvanceWeek() {
    advanceWeek();

    recentStory = 'The week passes. Your team continues working...';

    checkForNewEvents();
    checkGameOver();
  }

  function checkForNewEvents() {
    if ($gameStore.history.events.length > recentEvents.length) {
      const newEvents = $gameStore.history.events.slice(recentEvents.length);
      recentEvents = [...$gameStore.history.events];

      if (newEvents.length > 0) {
        const eventStories = newEvents.map(e => generateEventStory(e)).join('\n\n');
        recentStory = eventStories + '\n\n' + recentStory;
      }
    }
  }

  function checkGameOver() {
    if ($gameStore && $gameStore.gameOver) {
      gameState = 'gameOver';
    }
  }

  function restartGame() {
    gameState = 'intro';
    selectedScenario = null;
    recentStory = '';
    recentEvents = [];
  }
</script>

<svelte:head>
  <title>Business Simulation - Technical Debt Game</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
  <div class="max-w-6xl mx-auto">
    <header class="mb-8 text-center">
      <h1 class="text-5xl font-bold text-gray-900 mb-2">Business Simulation</h1>
      <p class="text-xl text-gray-700">Learn how technical debt affects business outcomes</p>
    </header>

    {#if gameState === 'intro'}
      <div class="bg-white rounded-lg shadow-xl p-12 max-w-3xl mx-auto text-center">
        <div class="text-6xl mb-6">🎮</div>
        <h2 class="text-4xl font-bold text-gray-800 mb-6">Welcome to the Business Simulation</h2>
        <p class="text-lg text-gray-700 mb-6 leading-relaxed">
          You're about to take on the role of a technical leader. Your decisions will shape the future of your team and business.
        </p>
        <p class="text-lg text-gray-700 mb-8 leading-relaxed">
          Balance feature delivery with code quality. Every choice has consequences. Can you succeed without letting technical debt sink you?
        </p>
        <button
          class="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xl shadow-lg"
          on:click={startGame}
        >
          Begin Your Journey
        </button>
      </div>

    {:else if gameState === 'scenarioSelect'}
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Choose Your Scenario</h2>

        <div class="space-y-4">
          {#each Object.values(SCENARIOS) as scenario}
            <div
              class="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition cursor-pointer"
              on:click={() => selectScenario(scenario.id)}
              on:keydown={(e) => e.key === 'Enter' && selectScenario(scenario.id)}
              role="button"
              tabindex="0"
            >
              <h3 class="text-2xl font-bold text-gray-800 mb-2">{scenario.name}</h3>
              <p class="text-gray-700 mb-3">{scenario.description}</p>

              <div class="grid grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                <div>
                  <span class="font-semibold">Capacity:</span> {scenario.initialMetrics.capacity}
                </div>
                <div>
                  <span class="font-semibold">Code Health:</span> {scenario.initialMetrics.codeHealth}
                </div>
                <div>
                  <span class="font-semibold">Satisfaction:</span> {scenario.initialMetrics.satisfaction}
                </div>
              </div>

              <div class="bg-blue-50 rounded p-3">
                <p class="text-sm font-semibold text-blue-900">🎯 {scenario.victoryConditions.description}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>

    {:else if gameState === 'scenarioStory'}
      {@const scenario = getScenario(selectedScenario)}
      <div class="bg-white rounded-lg shadow-xl p-12 max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-800 mb-6">{scenario.name}</h2>

        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-700 mb-3">Your Situation</h3>
          <p class="text-lg text-gray-700 leading-relaxed mb-6">
            {scenario.story.opening}
          </p>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <p class="font-semibold text-yellow-900">⚡ Challenge: {scenario.story.challenge}</p>
          </div>

          <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p class="font-semibold text-blue-900">🎯 Victory: {scenario.victoryConditions.description}</p>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button
            class="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold"
            on:click={() => gameState = 'scenarioSelect'}
          >
            ← Back to Scenarios
          </button>
          <button
            class="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg"
            on:click={beginGame}
          >
            Start Game →
          </button>
        </div>
      </div>

    {:else if gameState === 'gameOver' && game}
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto text-center">
        {#if game.victory}
          <div class="mb-6">
            <div class="text-6xl mb-4">🎉</div>
            <h2 class="text-4xl font-bold text-green-700 mb-4">Victory!</h2>
            <p class="text-xl text-gray-700 mb-2">You achieved your goals!</p>
            <p class="text-lg text-gray-600">Final Business Value: £{game.metrics.businessValue}K</p>
            <p class="text-lg text-gray-600">Code Health: {game.metrics.codeHealth}</p>
          </div>
        {:else}
          <div class="mb-6">
            <div class="text-6xl mb-4">⏰</div>
            <h2 class="text-4xl font-bold text-red-700 mb-4">Time's Up!</h2>
            <p class="text-xl text-gray-700 mb-2">You didn't meet the victory conditions in time.</p>
            <p class="text-lg text-gray-600">Final Business Value: £{game.metrics.businessValue}K (needed £{game.victoryConditions.businessValue}K)</p>
            <p class="text-lg text-gray-600">Code Health: {game.metrics.codeHealth}</p>
          </div>
        {/if}

        <button
          class="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg"
          on:click={restartGame}
        >
          Play Again
        </button>
      </div>

    {:else if gameState === 'playing' && game}
      <GameHeader
        week={game.week}
        metrics={game.metrics}
        victoryConditions={game.victoryConditions}
      />

      {#if recentStory}
        <div class="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h3 class="text-xl font-bold text-gray-800 mb-3">📖 Story</h3>
          <div class="prose max-w-none text-gray-700 whitespace-pre-line">
            {recentStory}
          </div>
        </div>
      {/if}

      <DecisionPanel
        opportunities={game.opportunities}
        week={game.week}
        on:deliverFeature={handleDeliverFeature}
        on:investInImprovement={handleInvestInImprovement}
        on:advanceWeek={handleAdvanceWeek}
      />

      <div class="mt-6 text-center">
        <button
          class="text-sm text-gray-600 hover:text-gray-800 underline"
          on:click={restartGame}
        >
          Restart Game
        </button>
      </div>
    {/if}
  </div>
</div>
