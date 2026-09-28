import React from "react";

// Simple markdown processor for common patterns
export function processMarkdown(text: string): (string | React.ReactNode)[] {
  // Split by common markdown patterns: **bold** and *italic*
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add matched bold or italic
    const content = match[1] || match[2];
    if (match[1]) {
      // Bold text
      parts.push(React.createElement("strong", { key: `bold-${match.index}` }, content));
    } else {
      // Italic text
      parts.push(React.createElement("em", { key: `italic-${match.index}` }, content));
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
