/**
 * Terraform types and adapter.
 * Endpoint: GET /projects/:projectId/terraform
 * Adapter normalizes backend response to TerraformFile[].
 */

export interface TerraformFile {
  name: string;
  content: string;
  path?: string;
  type?: string;
}

/**
 * Normalizes API response to TerraformFile[].
 * Replace this adapter when backend contract is known.
 */
export function adaptTerraformResponse(raw: unknown): TerraformFile[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is Record<string, unknown> => item && typeof item === "object")
      .map((item) => ({
        name: String(item.name ?? ""),
        content: String(item.content ?? ""),
        path: item.path != null ? String(item.path) : undefined,
        type: item.type != null ? String(item.type) : undefined,
      }))
      .filter((f) => f.name || f.content);
  }

  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.files)) {
    return adaptTerraformResponse(obj.files);
  }

  return [];
}
