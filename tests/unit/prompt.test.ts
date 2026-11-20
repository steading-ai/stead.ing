import { describe, expect, it } from "vitest";
import { promptFor, setupPromptFor } from "../../src/lib/prompt.ts";

const project = { origin: "https://skift.stead.ing", name: "skift", isHub: false };
const hub = { origin: "https://stead.ing", name: "Steading", isHub: true };

describe("the prompts a visitor pastes", () => {
  it("asks, in the hero, whether the project fits", () => {
    expect(promptFor(project)).toBe("Read https://skift.stead.ing/llms.txt and help me figure out if skift is a good fit for my work.");
    expect(promptFor(hub)).toBe("Read https://stead.ing/llms.txt and help me figure out if it's a good fit for my work.");
  });

  it("asks, in the quick start, for the agent to set the project up itself, after asking, and check it", () => {
    const setup = setupPromptFor(project);
    expect(setup).toMatch(/^Read https:\/\/skift\.stead\.ing\/llms\.txt and set skift up on this machine for me\./);
    expect(setup).toContain("Ask before you change anything");
    expect(setup).toContain("run each step yourself rather than handing me commands");
    expect(setup).toContain("checking that it works");
  });

  it("points at nothing but the site's llms.txt", () => {
    for (const prompt of [promptFor(project), setupPromptFor(project), promptFor(hub), setupPromptFor(hub)]) {
      expect(prompt.match(/https?:\/\/\S+/g)).toHaveLength(1);
    }
  });
});
