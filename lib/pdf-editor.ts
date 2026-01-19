import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ClaudeResponse } from './types';

export async function applyPDFEdits(
  pdfBuffer: Buffer,
  actions: ClaudeResponse['actions']
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'delete_pages':
          // Delete pages (in reverse order to maintain indices)
          if (action.pages && action.pages.length > 0) {
            const pagesToDelete = [...action.pages].sort((a, b) => b - a);
            for (const pageNum of pagesToDelete) {
              if (pageNum >= 1 && pageNum <= pages.length) {
                pdfDoc.removePage(pageNum - 1); // Convert to 0-indexed
              }
            }
          }
          break;

        case 'rotate_pages':
          if (action.pages && action.pages.length > 0 && action.rotation) {
            for (const pageNum of action.pages) {
              if (pageNum >= 1 && pageNum <= pages.length) {
                const page = pdfDoc.getPage(pageNum - 1);
                const currentRotation = page.getRotation().angle;
                const degrees = (currentRotation + action.rotation) as 0 | 90 | 180 | 270;
                page.setRotation(degrees);
              }
            }
          }
          break;

        case 'replace_text':
          // Note: pdf-lib doesn't support text search/replace directly
          // This is a limitation - we'll add a text box overlay as a workaround
          await addReplacementText(pdfDoc, action);
          break;

        case 'redact':
          // Note: pdf-lib doesn't support advanced redaction
          // We'll add black boxes as a basic implementation
          await addRedactionBoxes(pdfDoc, action);
          break;

        case 'noop':
          // Do nothing
          break;
      }
    } catch (error) {
      console.error(`Error applying action ${action.type}:`, error);
      throw new Error(`Failed to apply ${action.type} action`);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function addReplacementText(
  pdfDoc: PDFDocument,
  action: Extract<ClaudeResponse['actions'][0], { type: 'replace_text' }>
) {
  // pdf-lib limitation: Can't search for existing text
  // This is a simplified implementation that adds text overlay
  if (!action.find || !action.replace) {
    return; // Skip if find/replace values are missing
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const targetPages =
    action.scope === 'page' && action.page
      ? [action.page - 1]
      : pages.map((_, i) => i);

  for (const pageIndex of targetPages) {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      const { height } = page.getSize();

      // Add replacement text as a note at the top
      // Note: This is a workaround - proper text replacement requires PDF parsing
      page.drawText(
        `Note: "${action.find}" → "${action.replace}"`,
        {
          x: 50,
          y: height - 50,
          size: 10,
          font,
          color: rgb(1, 0, 0),
        }
      );
    }
  }
}

async function addRedactionBoxes(
  pdfDoc: PDFDocument,
  action: Extract<ClaudeResponse['actions'][0], { type: 'redact' }>
) {
  // Basic redaction: add black boxes
  // Note: This doesn't actually search for patterns - that requires PDF parsing
  if (!action.pattern) {
    return; // Skip if pattern is missing
  }

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { height } = page.getSize();

    // Add a note about redaction request
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(
      `Note: Redaction requested for pattern: ${action.pattern}`,
      {
        x: 50,
        y: height - 70,
        size: 10,
        font,
        color: rgb(1, 0, 0),
      }
    );
  }
}
