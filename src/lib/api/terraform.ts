/**
 * Terraform types and adapter.
 * Endpoint: GET /projects/:projectId/terraform-files
 * Response: { project_id: string; files: Record<string, string> }
 * Adapter converts files object to TerraformFile[].
 */

export interface TerraformFile {
  name: string;
  content: string;
  path?: string;
  type?: string;
}

export interface TerraformFilesResponse {
  project_id?: string;
  files?: Record<string, string>;
}

/**
 * Converts { files: { [name]: content } } to TerraformFile[].
 * Keys = filenames, values = file contents.
 */
export function adaptTerraformFilesResponse(
  raw: TerraformFilesResponse | unknown
): TerraformFile[] {
  if (!raw || typeof raw !== "object") return [];

  const obj = raw as Record<string, unknown>;
  const files = obj.files;

  if (!files || typeof files !== "object") return [];

  return Object.entries(files)
    .filter(([, content]) => typeof content === "string")
    .map(([name, content]) => ({
      name,
      content: content as string,
    }));
}
