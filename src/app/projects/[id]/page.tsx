'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header, BottomNav, ProjectCard } from '@/components';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Terminal, RefreshCw } from 'lucide-react';

type BuildLog = {
  id: string;
  agent: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  created_at: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  current_step: string;
  progress: number;
  repo_url: string | null;
  vercel_url: string | null;
  netlify_url: string | null;
  prompt: string;
  created_at: string;
};

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session && projectId) {
        fetchProject(projectId);
        subscribeToUpdates(projectId);
      }
    });
  }, [projectId]);

  async function fetchProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return;
    }

    setProject(data);

    // Fetch build logs
    const { data: logsData } = await supabase
      .from('build_logs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (logsData) {
      setLogs(logsData);
    }

    setLoading(false);
  }

  function subscribeToUpdates(id: string) {
    const channel = supabase
      .channel(`project:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${id}` },
        (payload) => {
          setProject(payload.new as Project);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'build_logs', filter: `project_id=eq.${id}` },
        (payload) => {
          setLogs((prev) => [...prev, payload.new as BuildLog]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function retryBuild() {
    if (!session) return;
    
    const response = await fetch('/api/projects/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ projectId }),
    });

    if (response.ok) {
      setLoading(true);
      fetchProject(projectId);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header />
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header />
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <p className="text-zinc-500">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </button>

        <ProjectCard project={project} />

        {project.status === 'failed' && (
          <button
            onClick={retryBuild}
            className="mt-4 w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center gap-2 text-white font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Retry Build
          </button>
        )}

        {/* Build Logs */}
        <div className="mt-8 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Build Logs</h3>
          </div>

          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-zinc-500 text-sm">No logs yet...</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg text-sm ${
                    log.level === 'error'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : log.level === 'warn'
                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase">
                      {log.agent}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p>{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav activeTab="projects" />
    </div>
  );
}
