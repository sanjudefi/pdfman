export interface PDFAction {
  type: 'replace_text' | 'delete_pages' | 'redact' | 'rotate_pages' | 'noop';
  // For replace_text
  find?: string;
  replace?: string;
  scope?: 'all' | 'page';
  page?: number;
  // For delete_pages
  pages?: number[];
  // For redact
  pattern?: 'email' | 'phone' | 'custom';
  regex?: string;
  // For rotate_pages
  rotation?: 90 | 180 | 270;
  // For noop
  message?: string;
}

export interface ClaudeResponse {
  actions: PDFAction[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
