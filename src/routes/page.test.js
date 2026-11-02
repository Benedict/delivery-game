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
