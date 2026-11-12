/**
 * Turns a demo's cards. One shows at a time: it moves to the next every few
 * seconds, unless the visitor has asked for less motion, and stops for good
 * once they pick one themselves.
 *
 * A demo is a `[data-plan]` holding `[data-node]` links and `[data-card]`
 * cards, in the same order.
 */
const EVERY_MS = 4200;

export function start(root: ParentNode) {
  for (const plan of root.querySelectorAll<HTMLElement>("[data-plan]")) {
    const nodes = [...plan.querySelectorAll<HTMLElement | SVGElement>("[data-node]")];
    const cards = [...plan.querySelectorAll<HTMLElement>("[data-card]")];
    let current = 0;
    const show = (index: number) => {
      current = index;
      cards.forEach((card, at) => {
        card.classList.toggle("shown", at === index);
      });
      nodes.forEach((node, at) => {
        node.classList.toggle("picked", at === index);
      });
    };
    plan.classList.add("live");
    show(0);
    let turning = matchMedia("(prefers-reduced-motion: reduce)").matches ? undefined : setInterval(() => show((current + 1) % cards.length), EVERY_MS);
    const pick = (index: number) => {
      clearInterval(turning);
      turning = undefined;
      show(index);
    };
    nodes.forEach((node, index) => {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        pick(index);
      });
      node.addEventListener("focus", () => pick(index));
    });
  }
}
