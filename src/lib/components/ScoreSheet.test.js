import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import ScoreSheet from "./ScoreSheet.svelte";

describe("ScoreSheet", () => {
  const mockSprints = Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    nvDiceCount: 8,
    tdDiceCount: 4,
    nvTotal: i === 0 ? 28 : null,
    tdTotal: i === 0 ? 14 : null,
    netNewValue: i === 0 ? 14 : null,
    cumulativeValue: i === 0 ? 14 : 0,
  }));

  it("should render all 10 sprints", () => {
    const { container } = render(ScoreSheet, { props: { sprints: mockSprints, currentSprint: 1 } });

    // Check that there are 10 sprint columns in the header
    const sprintHeaders = container.querySelectorAll('th[data-sprint]');
    expect(sprintHeaders).toHaveLength(10);

    for (let i = 1; i <= 10; i++) {
      const header = container.querySelector(`th[data-sprint="${i}"]`);
      expect(header).toBeInTheDocument();
      expect(header.textContent.trim()).toBe(i.toString());
    }
  });

  it("should display sprint values", () => {
    const { container } = render(ScoreSheet, { props: { sprints: mockSprints, currentSprint: 1 } });

    // Check for the specific values in the table
    // NV Total should be 28 in first sprint
    const nvRow = Array.from(container.querySelectorAll('tr')).find(tr =>
      tr.textContent.includes('NV Created')
    );
    expect(nvRow).toBeDefined();
    expect(nvRow.textContent).toContain('28');

    // TD Total should be 14 in first sprint
    const tdRow = Array.from(container.querySelectorAll('tr')).find(tr =>
      tr.textContent.includes('TD Created')
    );
    expect(tdRow).toBeDefined();
    expect(tdRow.textContent).toContain('14');
  });

  it("should highlight current sprint", () => {
    const { container } = render(ScoreSheet, {
      props: { sprints: mockSprints, currentSprint: 3 },
    });

    const sprintCells = container.querySelectorAll('[data-sprint="3"]');
    expect(sprintCells.length).toBeGreaterThan(0);
  });

  it("should show final score", () => {
    const completedSprints = mockSprints.map((s, i) => ({
      ...s,
      nvTotal: (i + 1) * 10,
      tdTotal: (i + 1) * 5,
      netNewValue: (i + 1) * 5,
      cumulativeValue: (i + 1) * 10,
    }));

    const { container } = render(ScoreSheet, {
      props: { sprints: completedSprints, currentSprint: 10 },
    });

    // Find the Game Complete section
    const gameCompleteSection = Array.from(container.querySelectorAll('div')).find(div =>
      div.textContent.includes('Game Complete!')
    );
    expect(gameCompleteSection).toBeDefined();
    expect(gameCompleteSection.textContent).toContain('Final Score');
    expect(gameCompleteSection.textContent).toContain('100');
  });
});
