// src/routes/journeys.test.js
//
// Human journeys through the real page. The balance bots allocate capacity
// for themselves, so they cannot meet problems that only a person clicking
// the UI meets. These tests play the way real first-time players did.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import Page from './+page.svelte';
import { gameStore } from '../lib/stores/gameStore.js';

async function startGame(scenarioName = 'The Startup') {
  render(Page);
  await fireEvent.click(screen.getByText('Begin Your Journey'));
  await fireEvent.click(screen.getByText(scenarioName));
  await fireEvent.click(screen.getByText('Start Game →'));
}

const endWeek = () => fireEvent.click(screen.getByText(/End Week/));
const storyText = () => document.querySelector('.whitespace-pre-line')?.textContent ?? '';

describe('journey: first-time player who never touches a slider', () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it('still delivers the features they start', async () => {
    await startGame();

    for (let week = 0; week < 4; week++) {
      const startButtons = screen.queryAllByText('Start Feature');
      if (startButtons.length && get(gameStore).workInProgress.length === 0) await fireEvent.click(startButtons[0]);
      await endWeek();
    }

    expect(get(gameStore).history.decisions.filter(d => d.type === 'feature').length).toBeGreaterThan(0);
  });

  it('is told plainly when work made no progress, instead of "made progress"', async () => {
    await startGame();
    await fireEvent.click(screen.getAllByText('Start Feature')[0]);
    const [slider] = screen.getAllByRole('slider');
    await fireEvent.input(slider, { target: { value: '0' } });

    await endWeek();

    expect(storyText()).not.toMatch(/made progress/i);
    expect(storyText()).toMatch(/no capacity/i);
  });

  it('is warned before ending a week with capacity left unallocated', async () => {
    await startGame();
    await fireEvent.click(screen.getAllByText('Start Feature')[0]);
    const [slider] = screen.getAllByRole('slider');
    await fireEvent.input(slider, { target: { value: '0' } });

    expect(screen.getByText(/unallocated/i)).toBeInTheDocument();
  });
});

describe('journey: features only, full capacity, until time runs out', () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it('ends with a debrief showing what falling capacity cost', async () => {
    await startGame('The Greenfield Project');

    for (let week = 0; week < 20 && !get(gameStore).gameOver; week++) {
      const startButtons = screen.queryAllByText('Start Feature');
      if (startButtons.length && get(gameStore).workInProgress.length === 0) await fireEvent.click(startButtons[0]);
      await endWeek();
    }

    expect(get(gameStore).gameOver).toBe(true);
    expect(await screen.findByText(/Weekly capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/week-1 efficiency/i)).toBeInTheDocument();
  });
});
