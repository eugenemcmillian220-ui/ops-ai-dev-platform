'use client';

import { GitBranch, ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  repo_url: string | null;
  vercel_url: string | null;
  netlify_url: string | null;
  created_at: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusConfig: Record<string, { icon: typeof Loader2; color: string; label: string }> = {
    draft: { icon: Loader2, color: 'text-zinc-400', label: 'Draft' },
    in_progress: { icon: Loader2, color: 'text-blue-400', label: 'Building' },
    building: { icon: Loader2, color: 'text-yellow-400', label: 'Building' },
    deployed: { icon: CheckCircle, color: 'text-green-400', label: 'Deployed' },
    failed: { icon: AlertCircle, color: 'text-red-400', label: 'Failed' },
  };

  const status = statusConfig[project.status] || statusConfig.draft;
  const StatusIcon = status.icon;
  const isDeploying = project.status === 'building' || project.status === 'in_progress';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{project.name}</h3>
          <p className="text-sm text-zinc-400 line-clamp-2">{project.description}</p>
        </div>
        <div className={`flex items-center gap-1.5 ${status.color}`}>
          <StatusIcon className={`w-4 h-4 ${isDeploying ? 'animate-spin' : ''}`} />
          <span className="text-xs font-medium">{status.label}</span>
        </div>
      </div>

      {isDeploying && (
        <div className="mb-4">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">{project.progress}% complete</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {project.repo_url && (
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            <span>Code</span>
          </a>
        )}

        {project.vercel_url && (
          <a
            href={project.vercel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors text-green-400"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Vercel</span>
          </a>
        )}

        {project.netlify_url && (
          <a
            href={project.netlify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors text-teal-400"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Netlify</span>
          </a>
        )}
      </div>
    </div>
  );
}
