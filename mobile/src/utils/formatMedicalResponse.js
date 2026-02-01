/**
 * Medical Response Formatter for React Native
 * SIMPLIFIED VERSION - bulletproof text rendering
 */

import React from 'react';
import { Text, View } from 'react-native';
import { colors, typography, spacing } from './theme';

/**
 * Render medical response as React Native components
 * Simple and safe - just renders text with basic formatting
 */
export function renderMedicalResponse(text) {
  // Always ensure we have a valid string
  const safeText = String(text || 'No response available');
  
  if (!safeText.trim()) {
    return (
      <Text style={[typography.body, { color: colors.text }]}>
        {'No response available'}
      </Text>
    );
  }

  try {
    // Split by double newlines for paragraphs
    const paragraphs = safeText.split(/\n\n+/).filter(p => p && p.trim());
    
    if (paragraphs.length === 0) {
      return (
        <Text style={[typography.body, { color: colors.text }]}>
          {safeText}
        </Text>
      );
    }

    return (
      <View>
        {paragraphs.map((paragraph, pIndex) => {
          const trimmedPara = String(paragraph || '').trim();
          if (!trimmedPara) return null;
          
          // Check if paragraph contains bullet points
          const lines = trimmedPara.split('\n');
          const hasBullets = lines.some(line => /^[\s]*[-•*]\s+/.test(line));
          
          if (hasBullets) {
            // Render as bullet list
            return (
              <View key={`p-${pIndex}`} style={{ marginVertical: spacing.sm }}>
                {lines.map((line, lIndex) => {
                  const safeLine = String(line || '').trim();
                  if (!safeLine) return null;
                  
                  const bulletMatch = safeLine.match(/^[-•*]\s+(.+)$/);
                  if (bulletMatch) {
                    return (
                      <View
                        key={`l-${pIndex}-${lIndex}`}
                        style={{
                          flexDirection: 'row',
                          marginBottom: spacing.xs,
                          paddingLeft: spacing.md,
                        }}
                      >
                        <Text style={[typography.body, { color: colors.primary, marginRight: spacing.sm, fontWeight: '600' }]}>
                          {'•'}
                        </Text>
                        <Text style={[typography.body, { color: colors.text, flex: 1, lineHeight: 22 }]}>
                          {String(bulletMatch[1] || '')}
                        </Text>
                      </View>
                    );
                  } else {
                    // Regular line within bullet section
                    return (
                      <Text
                        key={`l-${pIndex}-${lIndex}`}
                        style={[typography.body, { color: colors.text, marginBottom: spacing.xs }]}
                      >
                        {safeLine}
                      </Text>
                    );
                  }
                })}
              </View>
            );
          }
          
          // Check if it's a header (bold text followed by colon)
          const headerMatch = trimmedPara.match(/^\*\*([^*]+)\*\*\s*:\s*(.*)$/s);
          if (headerMatch) {
            return (
              <View key={`p-${pIndex}`} style={{ marginVertical: spacing.md }}>
                <Text style={[typography.h5, { color: colors.primary, fontWeight: '600', marginBottom: spacing.sm }]}>
                  {String(headerMatch[1] || '')}:
                </Text>
                {headerMatch[2] && headerMatch[2].trim() && (
                  <Text style={[typography.body, { color: colors.text }]}>
                    {String(headerMatch[2] || '')}
                  </Text>
                )}
              </View>
            );
          }
          
          // Regular paragraph
          return (
            <Text
              key={`p-${pIndex}`}
              style={[typography.body, { color: colors.text, marginVertical: spacing.sm, lineHeight: 22 }]}
            >
              {trimmedPara}
            </Text>
          );
        })}
      </View>
    );
  } catch (error) {
    // Fallback - just render as plain text
    console.warn('[formatMedicalResponse] Error:', error);
    return (
      <Text style={[typography.body, { color: colors.text }]}>
        {safeText}
      </Text>
    );
  }
}

/**
 * Get formatted text for TTS (removes formatting)
 */
export function getMedicalTextForTTS(text) {
  if (!text) return '';
  
  return String(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
