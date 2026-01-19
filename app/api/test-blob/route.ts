import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing Vercel Blob storage...');

    // Try to upload a test file
    const testContent = 'Hello from PDF Editor test!';
    const testKey = `test/test-${Date.now()}.txt`;

    const blob = await put(testKey, testContent, {
      access: 'public',
    });
    console.log('Test file uploaded:', blob.url);

    // Try to delete the test file
    await del(blob.url);
    console.log('Test file deleted');

    return NextResponse.json({
      success: true,
      message: 'Blob storage is working correctly',
      testUrl: blob.url,
    });
  } catch (error) {
    console.error('Blob test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint: 'Check if BLOB_READ_WRITE_TOKEN environment variable is set in Vercel',
      },
      { status: 500 }
    );
  }
}
