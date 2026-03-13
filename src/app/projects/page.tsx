'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, BottomNav, ProjectCard } from '@/components';
import { createClient } from '@/lib/supabase/client';
import { FolderOpen, Loader2 } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  repo_url: string | null;
  vercel_url: string | null;
  netlify_url: string | null;
  created_at: string;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchProjects(data.session.access_token);
      } else {
        router.push('/');
      }
    });
  }, []);

  const fetchProjects = async (token: string) => {
    try {
      const response = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <FolderOpen className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold">My Projects</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-zinc-400 mb-4">Create your first AI-powered app</p>
              <button
                onClick={() => router.push('/create')}
                className="py-2 px-4 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab="projects" />
    </div>
  );
}
