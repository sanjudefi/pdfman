import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload started');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File received:', file.name, file.size, 'bytes');

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('File converted to buffer:', buffer.length, 'bytes');

    // Create document record
    console.log('Creating document record in database...');
    let document;
    try {
      document = await db.pDFDocument.create({
        data: {
          fileName: file.name,
        },
      });
      console.log('Document created:', document.id);
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // Upload to storage
    console.log('Uploading to Vercel Blob...');
    let url;
    try {
      const result = await storage.uploadPDF(
        buffer,
        file.name,
        document.id,
        1
      );
      url = result.url;
      console.log('Upload successful:', url);
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload error: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }

    return NextResponse.json({
      documentId: document.id,
      versionNum: 1,
      url,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
