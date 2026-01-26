/**
 * Utility to format medical responses professionally
 * Converts plain text into formatted HTML with sections, headings, bullet points, etc.
 */

export function formatMedicalResponse(text) {
  if (!text) return text;

  let html = text;

  // Convert main sections with bold headings
  // Pattern: "Heading:" or "** Heading:" becomes bold heading
  html = html.replace(
    /\*\*([^*]+)\*\*\s*:\s*/g,
    '<div class="font-bold text-lg text-green-700 mt-4 mb-2">$1:</div>'
  );

  // Handle common medical section headers
  const sectionHeaders = [
    'Common OTC options',
    'Prescription medications',
    'Supportive care',
    'When to seek help',
    'Important considerations',
    'Safety disclaimer',
    'Precautions',
    'Dosage',
    'Side effects',
    'Symptoms',
    'Treatment',
    'Prevention',
    'What to do',
    'What not to do',
    'Remember',
    'Note',
    'Warning',
  ];

  sectionHeaders.forEach((header) => {
    const regex = new RegExp(`\\b(${header})\\s*:`, 'gi');
    html = html.replace(
      regex,
      '<div class="font-bold text-lg text-green-700 mt-4 mb-2">$1:</div>'
    );
  });

  // Convert bullet points
  // Pattern: "- text" or "• text" or "* text" becomes proper list items
  html = html.replace(
    /^[\s]*[-•*]\s+(.+)$/gm,
    '<li class="ml-4 text-gray-700">$1</li>'
  );

  // Wrap consecutive list items in <ul>
  html = html.replace(
    /(<li[^>]*>.*?<\/li>)/s,
    '<ul class="list-disc ml-2 mb-3">$1</ul>'
  );

  // Fix multiple consecutive <ul> tags - merge them
  html = html.replace(/<\/ul>\s*<ul class="list-disc ml-2 mb-3">/g, '');

  // Highlight important keywords
  const keywords = [
    'important',
    'must',
    'should',
    'critical',
    'severe',
    'emergency',
    'immediately',
    'seek professional',
    'doctor',
    'healthcare',
  ];

  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    html = html.replace(regex, '<span class="font-semibold text-red-600">$1</span>');
  });

  // Create paragraphs from text blocks
  // Split by double line breaks (which become empty lines)
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .filter((p) => p.trim())
    .map((p) => {
      // Don't wrap headings or lists
      if (
        p.includes('<div class="font-bold') ||
        p.includes('<ul') ||
        p.includes('<li')
      ) {
        return p;
      }
      return `<p class="text-gray-700 leading-relaxed mb-3">${p.trim()}</p>`;
    })
    .join('');

  // Add special styling for medication names (common patterns)
  html = html.replace(
    /(acetaminophen|ibuprofen|aspirin|tylenol|advil|motrin)/gi,
    '<span class="font-semibold text-blue-700 bg-blue-50 px-1 rounded">$1</span>'
  );

  // Create a precautions/warning box if text mentions these
  if (
    html.toLowerCase().includes('disclaimer') ||
    html.toLowerCase().includes('safety')
  ) {
    // Wrap the safety disclaimer in a special box
    const disclaimerPattern =
      /<div class="font-bold text-lg text-green-700 mt-4 mb-2">(Safety disclaimer|Disclaimer):<\/div>/i;
    if (disclaimerPattern.test(html)) {
      html = html.replace(
        /(<div class="font-bold text-lg text-green-700 mt-4 mb-2">Safety disclaimer.*?<\/div>)(.*?)(?=<div class="font-bold|$)/is,
        (match, header, content) => {
          return `<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4 rounded">
            ${header}
            <p class="text-gray-700 text-sm mt-2">${content.trim()}</p>
          </div>`;
        }
      );
    }
  }

  return html;
}

/**
 * Render formatted medical response as React component
 * Safe to use with dangerouslySetInnerHTML
 */
export function getMedicalResponseHTML(text) {
  return {
    __html: formatMedicalResponse(text),
  };
}
