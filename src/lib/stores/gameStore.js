// src/lib/stores/gameStore.js
//
// Svelte adapter over the pure game functions in simulation/Game.js.
// Game rules belong there, not here.
import { writable } from 'svelte/store';
import * as Game from '../simulation/Game.js';

function createGameStore() {
  const { subscribe, set, update } = writable(null);

  return {
    subscribe,
    update, // Exposed for test fixtures; not part of the public store API
    startNew: (scenarioId = 'startup') => set(Game.createGame(scenarioId)),
    startFeature: (feature) => update(state => Game.startFeature(state, feature)),
    startImprovement: (improvementId) => update(state => Game.startImprovement(state, improvementId)),
    allocateCapacity: (allocation) => update(state => Game.allocateCapacity(state, allocation)),
    acceptAcquisition: () => update(Game.acceptAcquisition),
    declineAcquisition: () => update(Game.declineAcquisition),
    endWeek: () => update(state => Game.advanceWeek(state).state)
  };
}

export const gameStore = createGameStore();

// Action helpers
export const startNewGame = (scenarioId) => gameStore.startNew(scenarioId);
export const startFeature = (feature) => gameStore.startFeature(feature);
export const startImprovement = (improvementId) => gameStore.startImprovement(improvementId);
export const allocateCapacity = (allocation) => gameStore.allocateCapacity(allocation);
export const endWeek = () => gameStore.endWeek();
export const acceptAcquisition = () => gameStore.acceptAcquisition();
export const declineAcquisition = () => gameStore.declineAcquisition();
