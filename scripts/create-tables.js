const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating database tables...');

    // Create PDFDocument table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PDFDocument" (
        "id" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PDFDocument_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ PDFDocument table created');

    // Create PDFVersion table
    await prisma.$executeRawUnsafe(`
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
    console.log('✓ PDFVersion table created');

    // Create unique index
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "PDFVersion_documentId_versionNum_key"
      ON "PDFVersion"("documentId", "versionNum");
    `);
    console.log('✓ Unique index created');

    // Create regular index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PDFVersion_documentId_idx"
      ON "PDFVersion"("documentId");
    `);
    console.log('✓ Regular index created');

    // Add foreign key constraint
    await prisma.$executeRawUnsafe(`
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
    console.log('✓ Foreign key constraint created');

    console.log('\n✅ Database tables created successfully!');
    console.log('You can now upload PDFs to your application.');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
