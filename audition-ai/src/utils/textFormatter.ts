import React from 'react';

// Utility to format dialogue text for better teleprompter readability

export interface FormattedTextChunk {
  text: string;
  isPause: boolean;
  pauseType?: 'short' | 'medium' | 'long';
}

export const formatDialogueForTeleprompter = (text: string): FormattedTextChunk[] => {
  if (!text || typeof text !== 'string') {
    return [{ text: '', isPause: false }];
  }

  // Just return the text as-is, no special formatting
  return [{ text: text.trim(), isPause: false }];
};

export const renderFormattedText = (
  chunks: FormattedTextChunk[],
  fontSize: number,
  lineHeight: number,
  textColor: string
): React.ReactElement => {
  return React.createElement('div', {
    style: {
      fontSize: `${fontSize}px`,
      lineHeight: lineHeight,
      color: textColor,
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap'
    }
  }, chunks.map(chunk => chunk.text).join(' '));
};