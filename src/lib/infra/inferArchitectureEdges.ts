import type { ArchitectureResource } from "@/lib/api/architectureResult";

export interface ArchitectureEdge {
  source: string;
  target: string;
}

/**
 * Infer edges between architecture resources from service names.
 * API does not provide explicit connections; this is isolated for easy replacement.
 *
 * Rules (by servico substring):
 * - Frontend -> API
 * - API -> Database
 * - API -> Cache
 * - Worker -> API
 * - Worker -> Database
 * - Worker -> Cache
 */
export function inferArchitectureEdges(
  recursos: ArchitectureResource[]
): ArchitectureEdge[] {
  const edges: ArchitectureEdge[] = [];
  const seen = new Set<string>();

  const add = (source: string, target: string) => {
    const key = `${source}->${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source, target });
  };

  const all = (pattern: RegExp): ArchitectureResource[] =>
    recursos.filter((r) => pattern.test(r.servico));

  const frontends = all(/frontend|Frontend/i);
  const apis = all(/API|api/i);
  const databases = all(/Database|database|PostgreSQL|MySQL/i);
  const caches = all(/Cache|cache|Redis/i);
  const workers = all(/Worker|worker|RQ/i);

  for (const f of frontends) {
    for (const a of apis) add(f.servico, a.servico);
  }
  for (const a of apis) {
    for (const d of databases) add(a.servico, d.servico);
    for (const c of caches) add(a.servico, c.servico);
  }
  for (const w of workers) {
    for (const a of apis) add(w.servico, a.servico);
    for (const d of databases) add(w.servico, d.servico);
    for (const c of caches) add(w.servico, c.servico);
  }

  return edges;
}
