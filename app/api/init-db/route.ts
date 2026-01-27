import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Execute raw SQL to create tables
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PDFDocument" (
        "id" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "PDFDocument_pkey" PRIMARY KEY ("id")
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PDFVersion" (
        "id" TEXT NOT NULL,
        "documentId" TEXT NOT NULL,
        "versionNum" INTEGER NOT NULL,
        "blobUrl" TEXT NOT NULL,
        "blobKey" TEXT NOT NULL,
        "sizeBytes" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PDFVersion_pkey" PRIMARY KEY ("id")
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "PDFVersion_documentId_versionNum_key"
      ON "PDFVersion"("documentId", "versionNum");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PDFVersion_documentId_idx"
      ON "PDFVersion"("documentId");
    `);

    await db.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'PDFVersion_documentId_fkey'
        ) THEN
          ALTER TABLE "PDFVersion" ADD CONSTRAINT "PDFVersion_documentId_fkey"
          FOREIGN KEY ("documentId") REFERENCES "PDFDocument"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully! You can now upload PDFs.',
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint: 'Try running "npx prisma db push" locally instead',
      },
      { status: 500 }
    );
  }
}
