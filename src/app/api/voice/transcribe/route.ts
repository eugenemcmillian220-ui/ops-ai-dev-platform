import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const text = await transcribeAudio(buffer);

    return NextResponse.json({ text, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transcription failed';
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
