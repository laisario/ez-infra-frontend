/**
 * Architecture result types and adapter.
 * Endpoint: GET /projects/:projectId/architecture-result
 * Raw response is an array; useful data is in response[0].output
 */

export interface ArchitectureResource {
  servico: string;
  config?: Record<string, unknown>;
}

export interface VibeOption {
  descricao: string;
  custo_estimado: string;
  recursos: ArchitectureResource[];
}

export interface ArchitectureResult {
  analiseEntrada: string;
  vibeEconomica: VibeOption;
  vibePerformance: VibeOption;
}

type RawOutput = {
  analise_entrada?: string;
  vibe_economica?: {
    descricao?: string;
    custo_estimado?: string;
    recursos?: Array<{ servico?: string; config?: Record<string, unknown> }>;
  };
  vibe_performance?: {
    descricao?: string;
    custo_estimado?: string;
    recursos?: Array<{ servico?: string; config?: Record<string, unknown> }>;
  };
};

type RawResponseItem = { output?: RawOutput };

/**
 * Adapts raw API response to ArchitectureResult.
 * Handles response[0].output shape.
 */
export function adaptArchitectureResult(raw: unknown): ArchitectureResult | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;

  const item = raw[0] as RawResponseItem | undefined;
  const output = item?.output;
  if (!output) return null;

  const econ = output.vibe_economica;
  const perf = output.vibe_performance;
  if (!econ || !perf) return null;

  const mapResource = (
    r: { servico?: string; config?: Record<string, unknown> }
  ): ArchitectureResource => ({
    servico: String(r.servico ?? ""),
    config: r.config,
  });

  return {
    analiseEntrada: String(output.analise_entrada ?? ""),
    vibeEconomica: {
      descricao: String(econ.descricao ?? ""),
      custo_estimado: String(econ.custo_estimado ?? ""),
      recursos: (econ.recursos ?? []).map(mapResource),
    },
    vibePerformance: {
      descricao: String(perf.descricao ?? ""),
      custo_estimado: String(perf.custo_estimado ?? ""),
      recursos: (perf.recursos ?? []).map(mapResource),
    },
  };
}

export type RevisionOption = "vibe_economica" | "vibe_performance";
