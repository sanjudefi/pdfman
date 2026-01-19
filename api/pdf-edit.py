from http.server import BaseHTTPRequestHandler
import json
import base64
import io
import re
import fitz  # PyMuPDF

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body)

            # Decode PDF
            pdf_bytes = base64.b64decode(data['pdf'])
            actions = data['actions']

            # Open PDF with PyMuPDF
            pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

            # Apply each action
            for action in actions:
                action_type = action['type']

                if action_type == 'replace_text':
                    apply_replace_text(pdf_document, action)
                elif action_type == 'delete_pages':
                    apply_delete_pages(pdf_document, action)
                elif action_type == 'redact':
                    apply_redact(pdf_document, action)
                elif action_type == 'rotate_pages':
                    apply_rotate_pages(pdf_document, action)

            # Save to bytes
            output_buffer = io.BytesIO()
            pdf_document.save(output_buffer)
            pdf_document.close()

            output_bytes = output_buffer.getvalue()
            output_base64 = base64.b64encode(output_bytes).decode('utf-8')

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            response = json.dumps({'pdf': output_base64})
            self.wfile.write(response.encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            error_response = json.dumps({'error': str(e)})
            self.wfile.write(error_response.encode())

def apply_replace_text(pdf_document, action):
    """Replace text in PDF"""
    find_text = action['find']
    replace_text = action['replace']
    scope = action.get('scope', 'all')
    target_page = action.get('page')

    if scope == 'page' and target_page:
        pages = [target_page - 1]  # Convert to 0-indexed
    else:
        pages = range(len(pdf_document))

    for page_num in pages:
        if page_num >= len(pdf_document):
            continue

        page = pdf_document[page_num]

        # Search for text instances
        text_instances = page.search_for(find_text)

        for inst in text_instances:
            # Add redaction annotation
            page.add_redact_annot(inst, fill=(1, 1, 1))

        # Apply redactions (removes text)
        page.apply_redactions()

        # Insert replacement text
        for inst in text_instances:
            # Calculate font size based on rectangle height
            font_size = inst.height * 0.8
            if font_size < 6:
                font_size = 10

            # Insert text at same position
            page.insert_textbox(
                inst,
                replace_text,
                fontsize=font_size,
                fontname="helv",
                color=(0, 0, 0),
                align=0
            )

def apply_delete_pages(pdf_document, action):
    """Delete specified pages"""
    pages_to_delete = sorted(action['pages'], reverse=True)

    for page_num in pages_to_delete:
        # Convert to 0-indexed
        page_idx = page_num - 1
        if 0 <= page_idx < len(pdf_document):
            pdf_document.delete_page(page_idx)

def apply_redact(pdf_document, action):
    """Redact sensitive information"""
    pattern = action.get('pattern')
    custom_regex = action.get('regex')

    # Define regex patterns
    patterns = {
        'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        'phone': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
    }

    if pattern == 'custom' and custom_regex:
        regex = custom_regex
    elif pattern in patterns:
        regex = patterns[pattern]
    else:
        return

    # Apply to all pages
    for page in pdf_document:
        # Get page text with positions
        text_dict = page.get_text("dict")

        for block in text_dict["blocks"]:
            if "lines" not in block:
                continue

            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"]

                    # Find matches
                    matches = re.finditer(regex, text)

                    for match in matches:
                        # Calculate approximate position
                        # This is simplified - in production you'd want more precise positioning
                        bbox = span["bbox"]
                        char_width = (bbox[2] - bbox[0]) / len(text) if len(text) > 0 else 10

                        start_x = bbox[0] + match.start() * char_width
                        end_x = bbox[0] + match.end() * char_width

                        redact_rect = fitz.Rect(start_x, bbox[1], end_x, bbox[3])
                        page.add_redact_annot(redact_rect, fill=(0, 0, 0))

        page.apply_redactions()

def apply_rotate_pages(pdf_document, action):
    """Rotate specified pages"""
    pages = action.get('pages', [])
    rotation = action.get('rotation', 90)

    for page_num in pages:
        page_idx = page_num - 1
        if 0 <= page_idx < len(pdf_document):
            page = pdf_document[page_idx]
            page.set_rotation(rotation)
