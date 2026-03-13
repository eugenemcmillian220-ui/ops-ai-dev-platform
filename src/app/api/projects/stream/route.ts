import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return new Response('Missing projectId', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode('data: connected\n\n'));

      // Subscribe to Supabase realtime
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const channel = supabase
        .channel(`project-stream:${projectId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'build_logs', filter: `project_id=eq.${projectId}` },
          (payload) => {
            const data = JSON.stringify({
              type: 'log',
              data: payload.new,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
          (payload) => {
            const data = JSON.stringify({
              type: 'project',
              data: payload.new,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        )
        .subscribe();

      // Keep connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode('data: ping\n\n'));
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        supabase.removeChannel(channel);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
