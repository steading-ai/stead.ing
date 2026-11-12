/**
 * Lays out a small plan as a graph: each node one column further right than
 * the last thing it waits on, so work reads left to right the way it gets done.
 */

export interface GraphNode {
  ref: string;
  waits: readonly string[];
}

export interface Placed<T> {
  node: T;
  /** Column, from 0. */
  layer: number;
  /** Row within its column, from 0. */
  row: number;
  /** The refs of the nodes that wait on this one. */
  unblocks: string[];
}

export function layout<T extends GraphNode>(nodes: readonly T[]): Placed<T>[] {
  const byRef = new Map(nodes.map((node) => [node.ref, node]));
  for (const node of nodes) {
    for (const ref of node.waits) {
      if (!byRef.has(ref)) throw new Error(`${node.ref} waits on ${ref}, which is not in the plan.`);
    }
  }
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  function layerOf(node: T): number {
    const known = depth.get(node.ref);
    if (known !== undefined) return known;
    if (visiting.has(node.ref)) throw new Error(`${node.ref} waits on itself, by way of other nodes.`);
    visiting.add(node.ref);
    const layer = node.waits.length === 0 ? 0 : 1 + Math.max(...node.waits.map((ref) => layerOf(byRef.get(ref) as T)));
    visiting.delete(node.ref);
    depth.set(node.ref, layer);
    return layer;
  }
  const rows = new Map<number, number>();
  return nodes.map((node) => {
    const layer = layerOf(node);
    const row = rows.get(layer) ?? 0;
    rows.set(layer, row + 1);
    return { node, layer, row, unblocks: nodes.filter((other) => other.waits.includes(node.ref)).map((other) => other.ref) };
  });
}
