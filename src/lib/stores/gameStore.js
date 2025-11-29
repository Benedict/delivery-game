import { writable } from "svelte/store";
import {
  createGame,
  investInMeasure,
  rollNVDice,
  rollTDDice,
  rerollTDDice,
  completeSprint,
} from "../game/GameController.js";
import { createUncertainGame } from "../game/UncertainOutcomes.js";

function createGameStore() {
  const { subscribe, set, update } = writable(createGame());

  return {
    subscribe,

    startNew: (useUncertainMode = false) => {
      const game = createGame();
      if (useUncertainMode) {
        const uncertainData = createUncertainGame();
        game.uncertainMode = true;
        game.selectedCards = uncertainData.selectedCards;
        game.revealedCards = [];
      }
      set(game);
    },

    investInMeasure: (measureId) =>
      update((game) => investInMeasure(game, measureId)),

    rollNVDice: () => update((game) => rollNVDice(game)),

    rollTDDice: () => update((game) => rollTDDice(game)),

    rerollTDDice: (indices) => update((game) => rerollTDDice(game, indices)),

    completeSprint: () => update((game) => completeSprint(game)),

    reset: (useUncertainMode = false) => {
      const game = createGame();
      if (useUncertainMode) {
        const uncertainData = createUncertainGame();
        game.uncertainMode = true;
        game.selectedCards = uncertainData.selectedCards;
        game.revealedCards = [];
      }
      set(game);
    },
  };
}

export const gameStore = createGameStore();

// Action helpers
export const startNewGame = (useUncertainMode = false) =>
  gameStore.startNew(useUncertainMode);
export const investInMeasureAction = (measureId) =>
  gameStore.investInMeasure(measureId);
export const rollNVDiceAction = () => gameStore.rollNVDice();
export const rollTDDiceAction = () => gameStore.rollTDDice();
export const rerollTDDiceAction = (indices) => gameStore.rerollTDDice(indices);
export const completeSprintAction = () => gameStore.completeSprint();
