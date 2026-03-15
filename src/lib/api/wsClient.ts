const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://vibeclouding-ingestion-service-production.up.railway.app";

export function getDiscoveryWsUrl(projectId: string): string {
  const wsBase = BASE_URL.replace(/^http/, "ws");
  return `${wsBase}/ws/discovery/${projectId}`;
}

export function createDiscoveryWebSocket(
  projectId: string,
  callbacks: {
    onMessage: (event: MessageEvent) => void;
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
  }
): WebSocket {
  const url = getDiscoveryWsUrl(projectId);
  const ws = new WebSocket(url);

  ws.onmessage = callbacks.onMessage;
  ws.onopen = callbacks.onOpen ?? (() => {});
  ws.onclose = callbacks.onClose ?? (() => {});
  ws.onerror = callbacks.onError ?? (() => {});

  return ws;
}
