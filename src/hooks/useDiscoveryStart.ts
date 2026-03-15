import { useState, useCallback } from "react";
import { toast } from "sonner";
import { createProject, ApiError } from "@/lib/api/discoveryClient";

export function useDiscoveryStart() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const createProjectOnly = useCallback(
    async (
      projectName: string,
      summary?: string
    ): Promise<string | null> => {
      if (!projectName.trim()) return null;

      setIsSending(true);
      setError(null);

      try {
        const res = await createProject(projectName.trim(), summary?.trim());
        return res.project_id;
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.message
            : "Não foi possível criar o projeto. Tente novamente.";
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setIsSending(false);
      }
    },
    []
  );

  return { createProjectOnly, isSending, error, clearError };
}
