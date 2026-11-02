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

    const final = get(gameStore);
    expect(final.gameOver).toBe(true);
    expect(await screen.findByText(/Weekly capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/lost about \d+ points of capacity/i)).toBeInTheDocument();
    // Shipping features only lets code health collapse: that goal is shown as missed.
    expect(screen.getByText(/Code health: -?\d+ of 70/)).toHaveTextContent('❌');
    // The money what-if only appears when money was the goal that was missed.
    const moneyMissed = final.metrics.businessValue < final.victoryConditions.businessValue;
    expect(Boolean(screen.queryByText(/week-1 efficiency/i))).toBe(moneyMissed);
  });
});

describe('journey: features only in the Startup, until time runs out', () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it('explains where the money went, not only what debt cost', async () => {
    await startGame('The Startup');

    for (let week = 0; week < 20 && !get(gameStore).gameOver; week++) {
      if (screen.queryByText('Decline, Keep Building')) await fireEvent.click(screen.getByText('Decline, Keep Building'));
      const startButtons = screen.queryAllByText('Start Feature');
      if (startButtons.length && get(gameStore).workInProgress.length === 0) await fireEvent.click(startButtons[0]);
      await endWeek();
    }

    const debriefText = (await screen.findByRole('region', { name: 'Debrief' })).textContent;
    expect(debriefText).toMatch(/Earned from \d+ features?/);
    expect(debriefText).toMatch(/Team running costs/);
    expect(debriefText).toMatch(/shipped nothing/);
    expect(debriefText).toMatch(/Customer satisfaction/);
    expect(debriefText).toMatch(/Investor confidence/);
    expect(debriefText).toMatch(/features shipped with bugs/);
  });
});
