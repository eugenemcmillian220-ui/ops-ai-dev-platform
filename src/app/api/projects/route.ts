import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { inngest } from '@/inngest/client';
import { enforceCredits } from '@/lib/credits';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ projects: projects || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch projects';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check credits before creating
    const creditCheck = await enforceCredits(user.id, 'new-project', 1);
    
    if (!creditCheck.allowed) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        credits: creditCheck.credits,
        required: 1 
      }, { status: 402 });
    }

    const body = await req.json();
    const { prompt, name } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Create project immediately to get an ID
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: user.id,
        name: name || 'Untitled Project',
        prompt,
        status: 'building',
        current_step: 'requirements',
        progress: 5,
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error(`Failed to create project: ${projectError?.message}`);
    }

    // Start async pipeline via Inngest
    await inngest.send({
      name: 'pipeline/start',
      data: {
        userId: user.id,
        projectId: project.id,
        prompt,
        name: name || 'Untitled Project',
      },
    });

    // Return immediately with project ID for redirect
    return NextResponse.json({
      success: true,
      projectId: project.id,
      message: 'Build started - check project page for progress',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
