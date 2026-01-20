import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { ClaudeResponse } from '@/lib/types';
import { applyPDFEdits } from '@/lib/pdf-editor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CLAUDE_SYSTEM_PROMPT = `You are a PDF editing assistant. Your ONLY job is to output JSON actions based on user requests.

CRITICAL RULES:
1. NEVER output any prose, explanations, or text outside of JSON
2. ALWAYS output valid JSON in this exact format:
{
  "actions": [...]
}

Available action types:

1. replace_text - Replace text in the PDF
{
  "type": "replace_text",
  "find": "text to find",
  "replace": "replacement text",
  "scope": "all" | "page",
  "page": 3  // required if scope is "page"
}

2. delete_pages - Remove pages from PDF
{
  "type": "delete_pages",
  "pages": [2, 3, 5]  // page numbers to delete (1-indexed)
}

3. redact - Redact sensitive information
{
  "type": "redact",
  "pattern": "email" | "phone" | "custom",
  "regex": "\\d{3}-\\d{3}-\\d{4}"  // required if pattern is "custom"
}

4. rotate_pages - Rotate specific pages
{
  "type": "rotate_pages",
  "pages": [1, 2],
  "rotation": 90 | 180 | 270
}

5. noop - When request is impossible or unclear
{
  "type": "noop",
  "message": "explanation of why action cannot be performed"
}

Examples:

User: "replace John Doe with Jane Doe everywhere"
Response:
{
  "actions": [
    {
      "type": "replace_text",
      "find": "John Doe",
      "replace": "Jane Doe",
      "scope": "all"
    }
  ]
}

User: "delete page 2"
Response:
{
  "actions": [
    {
      "type": "delete_pages",
      "pages": [2]
    }
  ]
}

User: "redact all emails"
Response:
{
  "actions": [
    {
      "type": "redact",
      "pattern": "email"
    }
  ]
}

User: "replace $10,000 with $12,000 on page 3"
Response:
{
  "actions": [
    {
      "type": "replace_text",
      "find": "$10,000",
      "replace": "$12,000",
      "scope": "page",
      "page": 3
    }
  ]
}

User: "make the text purple"
Response:
{
  "actions": [
    {
      "type": "noop",
      "message": "Cannot change text colors in PDF - only text replacement, deletion, and redaction are supported"
    }
  ]
}

REMEMBER: Output ONLY valid JSON. No other text.`;

async function callClaude(message: string): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse JSON response
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse Claude response:', content);
    throw new Error('Invalid JSON response from Claude');
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, currentVersion, message } = body;

    if (!documentId || !message) {
      return NextResponse.json(
        { error: 'Missing documentId or message' },
        { status: 400 }
      );
    }

    // Get current PDF URL
    const currentPdfUrl = await storage.getPDFUrl(documentId, currentVersion);
    if (!currentPdfUrl) {
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      );
    }

    // Download current PDF
    const pdfResponse = await fetch(currentPdfUrl);
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Call Claude to get actions
    const claudeResponse = await callClaude(message);

    // Check if it's a noop
    if (
      claudeResponse.actions.length === 1 &&
      claudeResponse.actions[0].type === 'noop'
    ) {
      return NextResponse.json(
        { error: claudeResponse.actions[0].message },
        { status: 400 }
      );
    }

    // Apply edits
    const editedBuffer = await applyPDFEdits(pdfBuffer, claudeResponse.actions);

    // Get document info for filename
    const document = await db.pDFDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Upload new version
    const newVersion = currentVersion + 1;
    const { url } = await storage.uploadPDF(
      editedBuffer,
      document.fileName,
      documentId,
      newVersion
    );

    return NextResponse.json({
      versionNum: newVersion,
      url,
      actions: claudeResponse.actions,
    });
  } catch (error) {
    console.error('Apply error:', error);
    const message = error instanceof Error ? error.message : 'Failed to apply changes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
