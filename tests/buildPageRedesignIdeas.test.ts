import assert from "node:assert/strict";
import test from "node:test";
import { buildPageRedesignIdeas } from "../src/models/buildPageRedesignIdeas";

test("build page redesign ideas stay reviewable and ordered", () => {
  assert.equal(buildPageRedesignIdeas.length, 3);
  assert.deepEqual(
    buildPageRedesignIdeas.map((idea) => idea.id),
    ["executive-briefing", "workflow-board", "analyst-workbench"]
  );

  const recommendedIdeas = buildPageRedesignIdeas.filter(
    (idea) => idea.recommended
  );
  assert.equal(recommendedIdeas.length, 1);
  assert.equal(recommendedIdeas[0]?.title, "Executive briefing");

  for (const idea of buildPageRedesignIdeas) {
    assert.ok(idea.summary.length > 20);
    assert.ok(idea.layout.includes("→"));
    assert.ok(idea.highlights.length >= 3);
  }
});
