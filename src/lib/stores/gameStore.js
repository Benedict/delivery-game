import { writable } from "svelte/store";
import {
  createGame,
  investInMeasure,
  rollNVDice,
  rollTDDice,
  rerollTDDice,
  completeSprint,
} from "../game/GameController.js";

function createGameStore() {
  const { subscribe, set, update } = writable(createGame());

  return {
    subscribe,

    startNew: () => set(createGame()),

    investInMeasure: (measureId) =>
      update((game) => investInMeasure(game, measureId)),

    rollNVDice: () => update((game) => rollNVDice(game)),

    rollTDDice: () => update((game) => rollTDDice(game)),

    rerollTDDice: (indices) => update((game) => rerollTDDice(game, indices)),

    completeSprint: () => update((game) => completeSprint(game)),

    reset: () => set(createGame()),
  };
}

export const gameStore = createGameStore();

// Action helpers for easier imports
export const startNewGame = () => gameStore.startNew();
export const investInMeasureAction = (measureId) =>
  gameStore.investInMeasure(measureId);
export const rollNVDiceAction = () => gameStore.rollNVDice();
export const rollTDDiceAction = () => gameStore.rollTDDice();
export const rerollTDDiceAction = (indices) => gameStore.rerollTDDice(indices);
export const completeSprintAction = () => gameStore.completeSprint();
