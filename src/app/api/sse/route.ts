import { afegirListener } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let tancat = false;
  let interval: ReturnType<typeof setInterval>;
  let remove: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const enviarSegur = (text: string) => {
        if (tancat) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          netejar();
        }
      };

      function netejar() {
        if (tancat) return;
        tancat = true;
        clearInterval(interval);
        remove();
      }

      remove = afegirListener((data) => enviarSegur(`data: ${data}\n\n`));
      interval = setInterval(() => enviarSegur(`: keepalive\n\n`), 30000);
    },
    cancel() {
      tancat = true;
      clearInterval(interval);
      remove();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
