<script>
  import { gameStore, startNewGame, startFeature, startImprovement, allocateCapacity, endWeek } from '../../lib/stores/gameStore.js';
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

  function handleStartFeature(event) {
    const feature = event.detail;
    startFeature(feature);
    recentStory = `You've started work on ${feature.name}. Allocate capacity to make progress.`;
  }

  function handleStartImprovement(event) {
    const improvementId = event.detail;
    startImprovement(improvementId);
    const improvement = $gameStore.workInProgress.find(item => item.id === improvementId);
    recentStory = `You've started work on ${improvement.name}. Allocate capacity to make progress.`;
  }

  function handleAllocateCapacity(event) {
    const allocation = event.detail;
    allocateCapacity(allocation);
  }

  function handleEndWeek() {
    endWeek();

    // Generate stories for completed items
    if ($gameStore.lastWeekCompleted && $gameStore.lastWeekCompleted.length > 0) {
      const stories = $gameStore.lastWeekCompleted.map(item => {
        const decision = $gameStore.history.decisions.find(d =>
          (d.type === 'feature' && d.feature.id === item.id) ||
          (d.type === 'improvement' && d.improvement.id === item.id)
        );

        if (item.type === 'feature') {
          return generateFeatureStory(item, decision.outcome);
        } else {
          return generateImprovementStory(item, decision.outcome);
        }
      });
      recentStory = stories.join('\n\n');
    } else {
      recentStory = `Week ${$gameStore.week - 1} complete. Your team made progress on their work.`;
    }

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

<div class="min-h-screen bg-gradient-to-br from-sky-50 to-violet-50 p-6">
  <div class="max-w-5xl mx-auto">
    <header class="mb-8 text-center">
      <h1 class="text-6xl font-black text-black mb-3 uppercase tracking-tighter leading-none">Business Simulation</h1>
      <p class="text-xl font-black text-black bg-amber-200 border-2 border-black inline-block px-5 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase leading-tight">Learn how technical debt affects business outcomes</p>
    </header>

    {#if gameState === 'intro'}
      <div class="bg-gradient-to-br from-rose-100 to-pink-100 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-10 max-w-3xl mx-auto text-center">
        <div class="text-7xl mb-5">🎮</div>
        <h2 class="text-5xl font-black text-black mb-5 uppercase leading-tight">Welcome to the Business Simulation</h2>
        <p class="text-lg font-black text-black mb-4 leading-tight">
          You're about to take on the role of a technical leader. Your decisions will shape the future of your team and business.
        </p>
        <p class="text-lg font-black text-black mb-6 leading-tight">
          Balance feature delivery with code quality. Every choice has consequences. Can you succeed without letting technical debt sink you?
        </p>
        <button
          class="px-8 py-3 bg-violet-600 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xl uppercase"
          on:click={startGame}
        >
          Begin Your Journey
        </button>
      </div>

    {:else if gameState === 'scenarioSelect'}
      <div class="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 max-w-4xl mx-auto">
        <h2 class="text-4xl font-black text-black mb-6 text-center uppercase leading-tight">Choose Your Scenario</h2>

        <div class="space-y-5">
          {#each Object.values(SCENARIOS) as scenario}
            <div
              class="border-2 border-black p-5 bg-gradient-to-r from-violet-100 to-sky-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              on:click={() => selectScenario(scenario.id)}
              on:keydown={(e) => e.key === 'Enter' && selectScenario(scenario.id)}
              role="button"
              tabindex="0"
            >
              <h3 class="text-3xl font-black text-black mb-2 uppercase leading-tight">{scenario.name}</h3>
              <p class="text-base font-black text-black mb-3 leading-tight">{scenario.description}</p>

              <div class="grid grid-cols-3 gap-2 text-sm mb-3">
                <div class="bg-white border-2 border-black p-2">
                  <span class="font-black text-black uppercase text-xs">Capacity:</span> <span class="font-black">{scenario.initialMetrics.capacity}</span>
                </div>
                <div class="bg-white border-2 border-black p-2">
                  <span class="font-black text-black uppercase text-xs">Health:</span> <span class="font-black">{scenario.initialMetrics.codeHealth}</span>
                </div>
                <div class="bg-white border-2 border-black p-2">
                  <span class="font-black text-black uppercase text-xs">Satisfaction:</span> <span class="font-black">{scenario.initialMetrics.satisfaction}</span>
                </div>
              </div>

              <div class="bg-yellow-300 border-2 border-black p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <p class="text-sm font-black text-black uppercase leading-tight">🎯 {scenario.victoryConditions.description}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>

    {:else if gameState === 'scenarioStory'}
      {@const scenario = getScenario(selectedScenario)}
      <div class="bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-10 max-w-3xl mx-auto">
        <h2 class="text-4xl font-black text-black mb-6 uppercase leading-tight">{scenario.name}</h2>

        <div class="mb-6">
          <h3 class="text-xl font-black text-black mb-3 uppercase">Your Situation</h3>
          <p class="text-base font-black text-black leading-tight mb-4 bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {scenario.story.opening}
          </p>

          <div class="bg-yellow-300 border-4 border-black p-3 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p class="font-black text-black leading-tight uppercase text-sm">⚡ CHALLENGE: {scenario.story.challenge}</p>
          </div>

          <div class="bg-green-300 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p class="font-black text-black leading-tight uppercase text-sm">🎯 VICTORY: {scenario.victoryConditions.description}</p>
          </div>
        </div>

        <div class="flex justify-center gap-3">
          <button
            class="px-5 py-2 bg-gray-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase text-sm"
            on:click={() => gameState = 'scenarioSelect'}
          >
            ← Back
          </button>
          <button
            class="px-6 py-2 bg-black text-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-lg uppercase"
            on:click={beginGame}
          >
            Start Game →
          </button>
        </div>
      </div>

    {:else if gameState === 'gameOver' && game}
      <div class="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-12 max-w-2xl mx-auto text-center">
        {#if game.victory}
          <div class="mb-8">
            <div class="text-8xl mb-6">🎉</div>
            <h2 class="text-6xl font-black text-black mb-6 uppercase bg-green-300 border-4 border-black inline-block px-8 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">Victory!</h2>
            <p class="text-2xl font-black text-black mb-4">You achieved your goals!</p>
            <div class="bg-yellow-300 border-2 border-black p-4 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p class="text-xl font-black text-black">Final Business Value: £{game.metrics.businessValue}K</p>
            </div>
            <div class="bg-blue-300 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p class="text-xl font-black text-black">Code Health: {game.metrics.codeHealth}</p>
            </div>
          </div>
        {:else}
          <div class="mb-8">
            <div class="text-8xl mb-6">⏰</div>
            <h2 class="text-6xl font-black text-black mb-6 uppercase bg-red-300 border-4 border-black inline-block px-8 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">Time's Up!</h2>
            <p class="text-2xl font-black text-black mb-4">You didn't meet the victory conditions in time.</p>
            <div class="bg-yellow-300 border-2 border-black p-4 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p class="text-lg font-black text-black">Final Business Value: £{game.metrics.businessValue}K (needed £{game.victoryConditions.businessValue}K)</p>
            </div>
            <div class="bg-blue-300 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
        <div class="bg-violet-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8 max-w-5xl mx-auto">
          <h3 class="text-2xl font-black text-black mb-5 uppercase">📖 Story</h3>
          <div class="prose max-w-none text-black font-bold whitespace-pre-line bg-white border-2 border-black p-4">
            {recentStory}
          </div>
        </div>
      {/if}

      <DecisionPanel
        opportunities={game.opportunities}
        workInProgress={game.workInProgress}
        capacityAllocation={game.capacityAllocation}
        capacity={game.metrics.capacity}
        flowEfficiency={game.metrics.flowEfficiency}
        week={game.week}
        on:startFeature={handleStartFeature}
        on:startImprovement={handleStartImprovement}
        on:allocateCapacity={handleAllocateCapacity}
        on:endWeek={handleEndWeek}
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
