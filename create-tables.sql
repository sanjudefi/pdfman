-- Create PDFDocument table
CREATE TABLE IF NOT EXISTS "PDFDocument" (
  "id" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PDFDocument_pkey" PRIMARY KEY ("id")
);

-- Create PDFVersion table
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

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS "PDFVersion_documentId_versionNum_key"
ON "PDFVersion"("documentId", "versionNum");

-- Create regular index
CREATE INDEX IF NOT EXISTS "PDFVersion_documentId_idx"
ON "PDFVersion"("documentId");

-- Add foreign key constraint
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
