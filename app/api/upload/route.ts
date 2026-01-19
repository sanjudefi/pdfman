import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create document record
    const document = await db.pDFDocument.create({
      data: {
        fileName: file.name,
      },
    });

    // Upload to storage
    const { url } = await storage.uploadPDF(
      buffer,
      file.name,
      document.id,
      1
    );

    return NextResponse.json({
      documentId: document.id,
      versionNum: 1,
      url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
