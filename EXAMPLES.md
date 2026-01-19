# Usage Examples

This document provides real-world examples of how to use the PDF Editor.

## Basic Text Replacement

### Example 1: Replace Name Throughout Document

**User Input**:
```
Replace "John Smith" with "Jane Doe"
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "replace_text",
      "find": "John Smith",
      "replace": "Jane Doe",
      "scope": "all"
    }
  ]
}
```

**Result**: All instances of "John Smith" in the entire document are replaced with "Jane Doe".

---

### Example 2: Replace on Specific Page

**User Input**:
```
Replace "$10,000" with "$12,000" on page 3
```

**Claude JSON Output**:
```json
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
```

**Result**: Only instances on page 3 are replaced.

---

## Page Management

### Example 3: Delete Single Page

**User Input**:
```
Delete page 2
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "delete_pages",
      "pages": [2]
    }
  ]
}
```

**Result**: Page 2 is removed from the document.

---

### Example 4: Delete Multiple Pages

**User Input**:
```
Remove pages 2, 5, and 7
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "delete_pages",
      "pages": [2, 5, 7]
    }
  ]
}
```

**Result**: Pages 2, 5, and 7 are removed.

---

## Redaction

### Example 5: Redact Email Addresses

**User Input**:
```
Redact all email addresses
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "redact",
      "pattern": "email"
    }
  ]
}
```

**Result**: All email addresses are blacked out (e.g., `john@example.com` → `███████████████`).

---

### Example 6: Redact Phone Numbers

**User Input**:
```
Remove all phone numbers
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "redact",
      "pattern": "phone"
    }
  ]
}
```

**Result**: Phone numbers are redacted (e.g., `555-123-4567` → `████████████`).

---

### Example 7: Custom Redaction Pattern

**User Input**:
```
Redact all social security numbers (format: XXX-XX-XXXX)
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "redact",
      "pattern": "custom",
      "regex": "\\d{3}-\\d{2}-\\d{4}"
    }
  ]
}
```

**Result**: SSN patterns are redacted.

---

## Page Rotation

### Example 8: Rotate Pages

**User Input**:
```
Rotate page 1 by 90 degrees
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "rotate_pages",
      "pages": [1],
      "rotation": 90
    }
  ]
}
```

**Result**: Page 1 is rotated 90° clockwise.

---

### Example 9: Rotate Multiple Pages

**User Input**:
```
Rotate pages 2 and 3 by 180 degrees
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "rotate_pages",
      "pages": [2, 3],
      "rotation": 180
    }
  ]
}
```

**Result**: Pages 2 and 3 are rotated 180°.

---

## Multiple Actions

### Example 10: Combined Operations

**User Input**:
```
Replace "Company A" with "Company B", delete page 5, and redact all emails
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "replace_text",
      "find": "Company A",
      "replace": "Company B",
      "scope": "all"
    },
    {
      "type": "delete_pages",
      "pages": [5]
    },
    {
      "type": "redact",
      "pattern": "email"
    }
  ]
}
```

**Result**: All three operations are applied sequentially.

---

## Edge Cases and No-ops

### Example 11: Impossible Request

**User Input**:
```
Change all text to purple
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "noop",
      "message": "Cannot change text colors in PDF - only text replacement, deletion, and redaction are supported"
    }
  ]
}
```

**Result**: Error message is shown to user, no changes made.

---

### Example 12: Ambiguous Request

**User Input**:
```
Make it look better
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "noop",
      "message": "Request is too vague. Please specify what changes you want (e.g., replace text, delete pages, redact information)"
    }
  ]
}
```

**Result**: User is prompted to be more specific.

---

## Complex Scenarios

### Example 13: Contract Editing

**User Input**:
```
Replace "ACME Corp" with "TechStart Inc" everywhere, change the date from "January 1, 2024" to "March 15, 2024" on page 1, and redact the signature on page 5
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "replace_text",
      "find": "ACME Corp",
      "replace": "TechStart Inc",
      "scope": "all"
    },
    {
      "type": "replace_text",
      "find": "January 1, 2024",
      "replace": "March 15, 2024",
      "scope": "page",
      "page": 1
    },
    {
      "type": "noop",
      "message": "Cannot redact specific signatures without more details. Please specify the exact text or area to redact."
    }
  ]
}
```

**Result**: First two operations succeed, third requires clarification.

---

### Example 14: Invoice Editing

**User Input**:
```
Update invoice: replace "Customer: ABC Ltd" with "Customer: XYZ Corp", change "$1,500" to "$2,000" on page 1, and remove page 3
```

**Claude JSON Output**:
```json
{
  "actions": [
    {
      "type": "replace_text",
      "find": "Customer: ABC Ltd",
      "replace": "Customer: XYZ Corp",
      "scope": "all"
    },
    {
      "type": "replace_text",
      "find": "$1,500",
      "replace": "$2,000",
      "scope": "page",
      "page": 1
    },
    {
      "type": "delete_pages",
      "pages": [3]
    }
  ]
}
```

**Result**: All three operations complete successfully.

---

## Tips for Best Results

### Be Specific
❌ **Bad**: "Change the name"
✅ **Good**: "Replace 'John Doe' with 'Jane Smith'"

### Use Exact Text
❌ **Bad**: "Fix the price"
✅ **Good**: "Replace '$100' with '$150'"

### Specify Page Numbers When Needed
❌ **Bad**: "Change the date on the first page"
✅ **Good**: "Replace 'Jan 1' with 'Feb 1' on page 1"

### One Request at a Time for Complex Edits
For complicated PDFs, break down requests:
1. First: "Replace all company names"
2. Then: "Redact personal information"
3. Finally: "Delete unnecessary pages"

### Supported Operations

✅ **Supported**:
- Text replacement
- Page deletion
- Content redaction (email, phone, custom patterns)
- Page rotation

❌ **Not Supported**:
- Adding new pages
- Changing fonts or colors
- Adding images
- Modifying page layout
- Form field editing

## Testing Your Commands

Before uploading important documents:
1. Test with a sample PDF
2. Verify the changes are correct
3. Use "Download" to save edited version
4. Previous versions are kept for rollback

## Common Patterns

| Use Case | Command Example |
|----------|----------------|
| Name change | "Replace 'Old Name' with 'New Name'" |
| Price update | "Change '$100' to '$200' on page 3" |
| Privacy | "Redact all email addresses and phone numbers" |
| Remove page | "Delete page 5" |
| Rotate scan | "Rotate page 1 by 90 degrees" |
| Multi-edit | "Replace X with Y and delete page 2" |
