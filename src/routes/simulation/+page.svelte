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

<div class="min-h-screen bg-cyan-200 p-4">
  <div class="max-w-6xl mx-auto">
    <header class="mb-8 text-center">
      <h1 class="text-6xl font-black text-black mb-4 uppercase tracking-tight">Business Simulation</h1>
      <p class="text-2xl font-black text-black bg-yellow-300 border-3 border-black inline-block px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Learn how technical debt affects business outcomes</p>
    </header>

    {#if gameState === 'intro'}
      <div class="bg-pink-300 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 max-w-3xl mx-auto text-center">
        <div class="text-8xl mb-6">🎮</div>
        <h2 class="text-5xl font-black text-black mb-6 uppercase">Welcome to the Business Simulation</h2>
        <p class="text-xl font-bold text-black mb-6 leading-relaxed">
          You're about to take on the role of a technical leader. Your decisions will shape the future of your team and business.
        </p>
        <p class="text-xl font-bold text-black mb-8 leading-relaxed">
          Balance feature delivery with code quality. Every choice has consequences. Can you succeed without letting technical debt sink you?
        </p>
        <button
          class="px-8 py-4 bg-black text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-2xl uppercase"
          on:click={startGame}
        >
          Begin Your Journey
        </button>
      </div>

    {:else if gameState === 'scenarioSelect'}
      <div class="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 max-w-4xl mx-auto">
        <h2 class="text-4xl font-black text-black mb-8 text-center uppercase">Choose Your Scenario</h2>

        <div class="space-y-6">
          {#each Object.values(SCENARIOS) as scenario}
            <div
              class="border-4 border-black p-6 bg-gradient-to-r from-purple-300 to-blue-300 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              on:click={() => selectScenario(scenario.id)}
              on:keydown={(e) => e.key === 'Enter' && selectScenario(scenario.id)}
              role="button"
              tabindex="0"
            >
              <h3 class="text-3xl font-black text-black mb-3 uppercase">{scenario.name}</h3>
              <p class="text-lg font-bold text-black mb-4">{scenario.description}</p>

              <div class="grid grid-cols-3 gap-3 text-sm mb-4">
                <div class="bg-white border-2 border-black p-2">
                  <span class="font-black text-black">Capacity:</span> <span class="font-bold">{scenario.initialMetrics.capacity}</span>
                </div>
                <div class="bg-white border-2 border-black p-2">
                  <span class="font-black text-black">Code Health:</span> <span class="font-bold">{scenario.initialMetrics.codeHealth}</span>
                </div>
                <div class="bg-white border-2 border-black p-2">
                  <span class="font-black text-black">Satisfaction:</span> <span class="font-bold">{scenario.initialMetrics.satisfaction}</span>
                </div>
              </div>

              <div class="bg-yellow-300 border-3 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <p class="text-sm font-black text-black">🎯 {scenario.victoryConditions.description}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>

    {:else if gameState === 'scenarioStory'}
      {@const scenario = getScenario(selectedScenario)}
      <div class="bg-orange-300 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 max-w-3xl mx-auto">
        <h2 class="text-4xl font-black text-black mb-8 uppercase">{scenario.name}</h2>

        <div class="mb-8">
          <h3 class="text-2xl font-black text-black mb-4 uppercase">Your Situation</h3>
          <p class="text-xl font-bold text-black leading-relaxed mb-6 bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {scenario.story.opening}
          </p>

          <div class="bg-yellow-300 border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p class="font-black text-black">⚡ CHALLENGE: {scenario.story.challenge}</p>
          </div>

          <div class="bg-green-300 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p class="font-black text-black">🎯 VICTORY: {scenario.victoryConditions.description}</p>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button
            class="px-6 py-3 bg-gray-400 text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase"
            on:click={() => gameState = 'scenarioSelect'}
          >
            ← Back to Scenarios
          </button>
          <button
            class="px-8 py-4 bg-black text-white border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xl uppercase"
            on:click={beginGame}
          >
            Start Game →
          </button>
        </div>
      </div>

    {:else if gameState === 'gameOver' && game}
      <div class="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 max-w-2xl mx-auto text-center">
        {#if game.victory}
          <div class="mb-8">
            <div class="text-8xl mb-6">🎉</div>
            <h2 class="text-6xl font-black text-black mb-6 uppercase bg-green-300 border-4 border-black inline-block px-8 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">Victory!</h2>
            <p class="text-2xl font-black text-black mb-4">You achieved your goals!</p>
            <div class="bg-yellow-300 border-3 border-black p-4 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p class="text-xl font-black text-black">Final Business Value: £{game.metrics.businessValue}K</p>
            </div>
            <div class="bg-blue-300 border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p class="text-xl font-black text-black">Code Health: {game.metrics.codeHealth}</p>
            </div>
          </div>
        {:else}
          <div class="mb-8">
            <div class="text-8xl mb-6">⏰</div>
            <h2 class="text-6xl font-black text-black mb-6 uppercase bg-red-300 border-4 border-black inline-block px-8 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">Time's Up!</h2>
            <p class="text-2xl font-black text-black mb-4">You didn't meet the victory conditions in time.</p>
            <div class="bg-yellow-300 border-3 border-black p-4 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p class="text-lg font-black text-black">Final Business Value: £{game.metrics.businessValue}K (needed £{game.victoryConditions.businessValue}K)</p>
            </div>
            <div class="bg-blue-300 border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p class="text-lg font-black text-black">Code Health: {game.metrics.codeHealth}</p>
            </div>
          </div>
        {/if}

        <button
          class="px-8 py-4 bg-black text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-2xl uppercase"
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
        <div class="bg-purple-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
          <h3 class="text-2xl font-black text-black mb-4 uppercase">📖 Story</h3>
          <div class="prose max-w-none text-black font-bold whitespace-pre-line bg-white border-2 border-black p-4">
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
          class="text-sm font-black text-black bg-red-300 border-2 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
          on:click={restartGame}
        >
          Restart Game
        </button>
      </div>
    {/if}
  </div>
</div>
