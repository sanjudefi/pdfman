import { put, del } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface StorageAdapter {
  uploadPDF(file: Buffer, fileName: string, documentId: string, versionNum: number): Promise<{ url: string; key: string }>;
  getPDFUrl(documentId: string, versionNum: number): Promise<string | null>;
  deletePDF(key: string): Promise<void>;
}

export class VercelBlobAdapter implements StorageAdapter {
  async uploadPDF(
    file: Buffer,
    fileName: string,
    documentId: string,
    versionNum: number
  ): Promise<{ url: string; key: string }> {
    const key = `pdfs/${documentId}/v${versionNum}-${fileName}`;

    const blob = await put(key, file, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // Save to database
    await prisma.pDFVersion.create({
      data: {
        documentId,
        versionNum,
        blobUrl: blob.url,
        blobKey: key,
        sizeBytes: file.length,
      },
    });

    return { url: blob.url, key };
  }

  async getPDFUrl(documentId: string, versionNum: number): Promise<string | null> {
    const version = await prisma.pDFVersion.findUnique({
      where: {
        documentId_versionNum: {
          documentId,
          versionNum,
        },
      },
    });

    return version?.blobUrl || null;
  }

  async deletePDF(key: string): Promise<void> {
    await del(key);
  }
}

export const storage = new VercelBlobAdapter();
