// src/routes/page.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from './+page.svelte';
import { gameStore } from '../lib/stores/gameStore.js';

async function startStartupGame() {
  render(Page);
  await fireEvent.click(screen.getByText('Begin Your Journey'));
  await fireEvent.click(screen.getByText('The Startup'));
  await fireEvent.click(screen.getByText('Start Game →'));
}

async function offerAcquisition() {
  gameStore.update(state => ({ ...state, pendingDecision: { type: 'acquisition', week: state.week } }));
  await tick();
}

describe('game page: endings', () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it('shows the acquisition ending after the player accepts an offer', async () => {
    await startStartupGame();
    await offerAcquisition();

    await fireEvent.click(screen.getByText('Accept Offer'));

    expect(await screen.findByText('Acquired!')).toBeInTheDocument();
    expect(screen.getByText('Play Again')).toBeInTheDocument();
  });

  it('keeps playing after the player declines an offer', async () => {
    await startStartupGame();
    await offerAcquisition();

    await fireEvent.click(screen.getByText('Decline, Keep Building'));

    expect(screen.queryByText('Accept Offer')).not.toBeInTheDocument();
    expect(screen.getByText('Restart Game')).toBeInTheDocument();
  });

  it('explains when investors pull funding', async () => {
    await startStartupGame();
    gameStore.update(state => ({ ...state, gameOver: true, victory: false, endReason: 'fundingPulled' }));
    await tick();

    expect(await screen.findByText('Funding Pulled!')).toBeInTheDocument();
  });
});

describe('game page: story', () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it('shows story titles in bold rather than as raw ** markers', async () => {
    await startStartupGame();
    await fireEvent.click(screen.getAllByText('Start Improvement')[0]); // Fix Critical Bugs, one week
    gameStore.update(state => ({ ...state, capacityAllocation: { fixBugs: 1000 } }));
    await fireEvent.click(screen.getByText(/End Week/i));

    const title = await screen.findByText('Fix Critical Bugs:');
    expect(title.tagName).toBe('STRONG');
    expect(document.body.textContent).not.toContain('**');
  });
});

describe('game page: end screen explains which goal was missed', () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  async function finishGreenfield({ businessValue, codeHealth }) {
    render(Page);
    await fireEvent.click(screen.getByText('Begin Your Journey'));
    await fireEvent.click(screen.getByText('The Greenfield Project'));
    await fireEvent.click(screen.getByText('Start Game →'));
    gameStore.update(state => ({
      ...state,
      metrics: { ...state.metrics, businessValue, codeHealth },
      gameOver: true, victory: false, endReason: 'timeUp'
    }));
    await tick();
  }

  it('shows each goal as met or missed', async () => {
    await finishGreenfield({ businessValue: 929, codeHealth: 18 });

    expect(await screen.findByText(/Business value: £929K of £750K/)).toHaveTextContent('✅');
    expect(screen.getByText(/Code health: 18 of 70/)).toHaveTextContent('❌');
  });

  it('does not suggest more money would have helped when money was not the problem', async () => {
    await finishGreenfield({ businessValue: 929, codeHealth: 18 });

    expect(screen.queryByText(/needed £/)).not.toBeInTheDocument();
    expect(screen.queryByText(/week-1 efficiency/)).not.toBeInTheDocument();
  });
});
