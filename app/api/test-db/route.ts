import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing database connection...');

    // Try to count documents
    const count = await db.pDFDocument.count();
    console.log('Document count:', count);

    // Try to create a test document
    const testDoc = await db.pDFDocument.create({
      data: {
        fileName: 'test.pdf',
      },
    });
    console.log('Test document created:', testDoc.id);

    // Delete the test document
    await db.pDFDocument.delete({
      where: { id: testDoc.id },
    });
    console.log('Test document deleted');

    return NextResponse.json({
      success: true,
      message: 'Database is working correctly',
      documentCount: count,
      testDocId: testDoc.id,
    });
  } catch (error) {
    console.error('Database test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: errorStack,
        hint: 'Run "npx prisma db push" to create database tables',
      },
      { status: 500 }
    );
  }
}
