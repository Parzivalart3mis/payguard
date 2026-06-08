/** Browser-side fetch helpers that understand PayGuard's { error: { code, message } } shape. */

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } } | null)?.error?.message ??
      "Something went wrong.";
    throw new Error(message);
  }
  return data as T;
}

export interface StreamHandlers {
  onEvent: (event: string, data: unknown) => void;
}

/**
 * POST a JSON body and consume a text/event-stream response, dispatching parsed
 * SSE events. Used by the interactive draft-regeneration flow.
 */
export async function postEventStream(
  url: string,
  body: unknown,
  handlers: StreamHandlers,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    let message = "Generation failed.";
    try {
      message = JSON.parse(text).error.message ?? message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      let event = "message";
      let dataStr = "";
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
      }
      if (!dataStr) continue;
      let data: unknown = dataStr;
      try {
        data = JSON.parse(dataStr);
      } catch {
        // leave as string
      }
      handlers.onEvent(event, data);
    }
  }
}
