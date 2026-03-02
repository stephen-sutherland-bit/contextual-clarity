import { useMemo, useRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { X, BookOpen, HelpCircle, Download, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PonderedQuestion {
  topic: string;
  question: string;
  commonAnswer: string;
  cbsAnswer: string;  // Kept as cbsAnswer for backwards compatibility with existing data
}

interface InlineTeachingContentProps {
  title: string;
  primaryTheme: string;
  content: string;
  scriptures: string[];
  questionsAnswered: string[];
  quickAnswer: string;
  coverImage?: string;
  ponderedQuestions?: PonderedQuestion[];
  onClose: () => void;
}

// Detect if content is properly structured TipTap HTML (not just a single <p> wrapper)
// Requires multiple </p> closings OR heading tags — a single <p> wrapping everything is NOT real HTML
const isHtmlContent = (content: string): boolean => {
  const closingPCount = (content.match(/<\/p>/gi) || []).length;
  if (closingPCount >= 2) return true;
  if (/<h[2-6]\b/i.test(content)) return true;
  if (/<(ul|ol|blockquote)\b/i.test(content)) return true;
  return false;
};

// Unwrap content that's wrapped in a single outer <p>...</p> tag
// so the legacy parser receives clean plain text
const unwrapSingleParagraph = (content: string): string => {
  const trimmed = content.trim();
  const match = trimmed.match(/^<p>([\s\S]*)<\/p>$/i);
  if (match) return match[1];
  return trimmed;
};

// Insert paragraph breaks into continuous text that has no newlines.
// Splits before **Bold Heading** markers and at sentence boundaries for long runs.
const insertParagraphBreaks = (text: string): string => {
  // If the text already has enough paragraph breaks, leave it alone
  const newlineCount = (text.match(/\n/g) || []).length;
  if (newlineCount > 3) return text;

  // Step 1: Insert \n\n before **Bold Heading** patterns that appear mid-text
  // Pattern: end of sentence (. ? ! ") followed by whitespace then **Heading**
  let result = text.replace(/([.?!""'])\s+(\*\*[A-Z])/g, '$1\n\n$2');
  
  // Also break before --- (horizontal rules) and treat them as separators
  result = result.replace(/\s*---\s*/g, '\n\n---\n\n');
  
  // Break before bullet items: * **Bold** patterns (markdown list items)
  result = result.replace(/([.?!""'])\s+(\* \*\*)/g, '$1\n\n$2');
  // Also break between consecutive bullet items
  result = result.replace(/(\*)\s+(\* \*\*)/g, '$1\n\n$2');

  // Step 2: Split remaining long paragraphs at sentence boundaries
  // Process each block that's still very long (>800 chars with no breaks)
  // Never break inside parentheses or brackets
  const blocks = result.split(/\n\n+/);
  const processed = blocks.map(block => {
    if (block.length < 800) return block;
    
    const sentences: string[] = [];
    let current = '';
    const parts = block.split(/(?<=[.!?][""]?\s)(?=[A-Z])/);
    
    for (const part of parts) {
      current += part;
      
      // Don't split if we're inside unclosed parentheses/brackets
      const openParens = (current.match(/\(/g) || []).length;
      const closeParens = (current.match(/\)/g) || []).length;
      const insideParens = openParens > closeParens;
      
      if (!insideParens && current.length > 500) {
        sentences.push(current.trim());
        current = '';
      }
    }
    if (current.trim()) sentences.push(current.trim());
    
    return sentences.join('\n\n');
  });

  return processed.join('\n\n');
};

// Pre-process legacy/markdown content that was misdetected as HTML
// Converts newlines to paragraphs and **bold** to <strong>
const preprocessMarkdownToHtml = (content: string): string => {
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p)
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
};

// Helper function to strip inline markdown symbols from text (used for headings)
const stripInlineMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')       // *italic* → italic
    .replace(/__(.+?)__/g, '$1')       // __bold__ → bold
    .replace(/_(.+?)_/g, '$1')         // _italic_ → italic
    .replace(/^#{1,6}\s+/gm, '')       // Remove markdown heading prefixes
    .replace(/^>\s*/gm, '');           // Remove blockquote markers
};

// Convert **bold** and *italic* markdown to React elements for body text

const renderInlineMarkdown = (text: string): ReactNode[] => {
  const elements: ReactNode[] = [];
  // Match **bold** or *italic* patterns
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      // **bold**
      elements.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      elements.push(<em key={key++}>{match[4]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  return elements;
};

// Check if a line is a horizontal rule (---, ***, ___)
const isHorizontalRule = (text: string): boolean => {
  const trimmed = text.trim();
  return /^[-*_]{3,}$/.test(trimmed);
};

// Relaxed heading detection for legacy content without **markers**
// With explicit **Heading** markers from the AI, this is now just a fallback
const isTrueHeading = (text: string): boolean => {
  const trimmed = text.trim();
  
  // Length constraints: not too short, not too long
  if (trimmed.length > 60 || trimmed.length < 5) return false;
  
  // Must not end with sentence punctuation
  if (trimmed.endsWith('.') || trimmed.endsWith(',') || trimmed.endsWith('?') || trimmed.endsWith('!')) return false;
  
  // Must start with capital letter
  if (!/^[A-Z]/.test(trimmed)) return false;
  
  // Must NOT contain conversational phrases (clear sentence indicators)
  const conversationalPhrases = /(let's|we will|we can|we must|we should|here is|here are|there is|there are|you will|you can|I will|I can|we see|we find|we note)/i;
  if (conversationalPhrases.test(trimmed)) return false;
  
  return true;
};

// Join paragraphs that are broken mid-sentence
const joinBrokenParagraphs = (blocks: string[]): string[] => {
  const joined: string[] = [];
  let accumulator = '';
  
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    
    if (accumulator) {
      // Continue accumulating
      accumulator += ' ' + trimmed;
      // Check if this block completes the sentence
      if (/[.!?"]$/.test(trimmed)) {
        joined.push(accumulator);
        accumulator = '';
      }
    } else {
      // Check if this block is incomplete (ends with comma or no terminal punctuation)
      if (/[,]$/.test(trimmed) || !/[.!?":)]$/.test(trimmed)) {
        // Also check it's not a heading-like line (short, title-case)
        if (trimmed.length > 60 || /[a-z]/.test(trimmed.charAt(0))) {
          accumulator = trimmed;
        } else {
          joined.push(trimmed);
        }
      } else {
        joined.push(trimmed);
      }
    }
  }
  // Don't lose any remaining accumulator
  if (accumulator) joined.push(accumulator);
  return joined;
};

// Check if we're entering a section that should be stripped (Reflective Questions, etc.)
const isStrippableSection = (text: string): boolean => {
  const trimmed = text.trim().toLowerCase();
  // Match "Reflective Questions", "Have you pondered", "Questions to Consider", etc.
  return /^(reflective questions|have you.*pondered|questions to consider)/i.test(trimmed) ||
         /^\*\*(reflective questions|have you.*pondered|questions to consider)/i.test(trimmed);
};

// Check if a line is the credit line (to detect duplicates)
const isCreditLine = (text: string): boolean => {
  return /this teaching is adapted from the christian theologist/i.test(text);
};

// Parse content to detect and render headings properly, preserving original doc structure
const parseContentWithHeadings = (content: string) => {
  // Split by double newlines first
  const rawBlocks = content.split(/\n\n+/).filter(p => p.trim());
  
  // Expand blocks that contain single newlines into separate items
  const expandedBlocks: string[] = [];
  rawBlocks.forEach(block => {
    const trimmed = block.trim();
    if (trimmed.includes('\n')) {
      // Split by single newlines and add each as separate block
      trimmed.split('\n').forEach(line => {
        if (line.trim()) expandedBlocks.push(line.trim());
      });
    } else {
      expandedBlocks.push(trimmed);
    }
  });
  
  // Join broken paragraphs
  const blocks = joinBrokenParagraphs(expandedBlocks);
  
  const results: Array<{type: 'heading' | 'subheading' | 'paragraph' | 'bullet' | 'italic-paragraph', content: string, key: number}> = [];
  
  // Track if we're in Key Takeaways or Appendix section (for special formatting)
  let inKeyTakeawaysSection = false;
  
  // Track if we're in a section to strip (e.g., Reflective Questions)
  let inStrippableSection = false;
  // Track credit lines to only keep the last one
  let creditLineIndex = -1;
  
  blocks.forEach((block, index) => {
    const trimmed = block.trim();
    
    // Skip horizontal rules
    if (isHorizontalRule(trimmed)) {
      return;
    }
    
    // Check if this is the start of a strippable section
    if (isStrippableSection(trimmed)) {
      inStrippableSection = true;
      return; // Skip this heading
    }
    
    // If we hit a new major section (bold heading), we exit the strippable section
    if (inStrippableSection) {
      const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
      if (boldMatch || trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
        // This is a new major section, exit strippable mode
        inStrippableSection = false;
      } else {
        // Still in strippable section, skip this block
        return;
      }
    }
    
    // Track credit lines (keep only last one)
    if (isCreditLine(trimmed)) {
      // If we already have a credit line, remove it from results
      if (creditLineIndex >= 0) {
        const idx = results.findIndex(r => r.key === creditLineIndex);
        if (idx >= 0) results.splice(idx, 1);
      }
      creditLineIndex = index * 100;
      // Continue to add this credit line
    }
    
    // Check for markdown-style headings (## or ### Heading)
    if (trimmed.startsWith("### ")) {
      const headingContent = stripInlineMarkdown(trimmed.slice(4));
      // Check if entering Key Takeaways or Appendix section
      if (/^(key takeaways|appendix)/i.test(headingContent)) {
        inKeyTakeawaysSection = true;
      } else if (inKeyTakeawaysSection) {
        // Exiting the section when we hit another heading
        inKeyTakeawaysSection = false;
      }
      results.push({
        type: "heading",
        content: headingContent,
        key: index * 100,
      });
      return;
    }
    
    if (trimmed.startsWith("## ")) {
      const headingContent = stripInlineMarkdown(trimmed.slice(3));
      // Check if entering Key Takeaways or Appendix section
      if (/^(key takeaways|appendix)/i.test(headingContent)) {
        inKeyTakeawaysSection = true;
      } else if (inKeyTakeawaysSection) {
        inKeyTakeawaysSection = false;
      }
      results.push({
        type: "heading",
        content: headingContent,
        key: index * 100,
      });
      return;
    }
    
    // Check for markdown bold headings (**Heading**)
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch && boldMatch[1].length < 80) {
      const headingContent = stripInlineMarkdown(boldMatch[1]);
      // Check if entering Key Takeaways or Appendix section
      if (/^(key takeaways|appendix)/i.test(headingContent)) {
        inKeyTakeawaysSection = true;
      } else if (inKeyTakeawaysSection) {
        inKeyTakeawaysSection = false;
      }
      results.push({
        type: "heading",
        content: headingContent,
        key: index * 100,
      });
      return;
    }
    
    // Check for numbered headings like "1. Title" or "I. Title" at start of line
    const numberedMatch = trimmed.match(/^([0-9]+\.|[IVXLC]+\.)\s+(.+)$/);
    if (numberedMatch && trimmed.length < 80 && !trimmed.includes('\n')) {
      results.push({
        type: "heading",
        content: stripInlineMarkdown(trimmed),
        key: index * 100,
      });
      return;
    }
    
    // Check for all-caps headings (likely section titles)
    if (
      trimmed.length < 80 &&
      trimmed.length > 3 &&
      trimmed === trimmed.toUpperCase() &&
      /^[A-Z\s\-:,.'0-9]+$/.test(trimmed)
    ) {
      results.push({
        type: "heading",
        content: stripInlineMarkdown(trimmed),
        key: index * 100,
      });
      return;
    }
    
    // Use strict heading detection for plain text lines
    if (isTrueHeading(trimmed)) {
      results.push({
        type: "heading",
        content: stripInlineMarkdown(trimmed),
        key: index * 100,
      });
      return;
    }
    
    // Check for bullet point lines (- Something or * Something)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const bulletContent = trimmed.startsWith("- ") ? trimmed.slice(2) : trimmed.slice(2);
      results.push({
        type: "bullet",
        content: bulletContent,
        key: index * 100,
      });
      return;
    }
    
    // In Key Takeaways section, non-bullet paragraphs are answers (italic)
    if (inKeyTakeawaysSection) {
      results.push({
        type: "italic-paragraph",
        content: trimmed,
        key: index * 100,
      });
      return;
    }
    
    // Everything else is a paragraph
    results.push({
      type: "paragraph",
      content: trimmed,
      key: index * 100,
    });
  });
  
  return results;
};

const InlineTeachingContent = ({
  title,
  primaryTheme,
  content,
  scriptures,
  questionsAnswered,
  quickAnswer,
  coverImage,
  ponderedQuestions = [],
  onClose,
}: InlineTeachingContentProps) => {
  const isHtml = useMemo(() => isHtmlContent(content), [content]);
  // If not real HTML, unwrap any single <p> wrapper before legacy parsing
  const cleanContent = useMemo(() => isHtml ? content : insertParagraphBreaks(unwrapSingleParagraph(content)), [content, isHtml]);
  const parsedContent = useMemo(() => isHtml ? [] : parseContentWithHeadings(cleanContent), [cleanContent, isHtml]);
  const hasPonderedQuestions = ponderedQuestions && ponderedQuestions.length > 0;
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!contentRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Clone the rendered DOM content
    const contentHtml = contentRef.current.innerHTML;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@400;500;600&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Source Sans 3', sans-serif;
              line-height: 1.7;
              color: #1a1a1a;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            
            /* Hide motion wrappers but keep content */
            [style*="opacity"], [style*="transform"] {
              opacity: 1 !important;
              transform: none !important;
            }
            
            /* Section styling */
            section, .mb-10 {
              margin-bottom: 32px;
            }
            
            /* Summary box */
            .bg-primary\\/5, [class*="bg-primary"] {
              background: #f5f5f5 !important;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 32px;
              border: 1px solid #e0e0e0;
            }
            
            /* Section headers */
            .font-heading {
              font-family: 'Playfair Display', serif;
            }
            
            h1, h2, h3 {
              font-family: 'Playfair Display', serif;
              margin-bottom: 16px;
            }
            
            h3 {
              font-size: 20px;
              font-weight: 600;
              padding-bottom: 8px;
              border-bottom: 1px solid #ddd;
              margin-bottom: 16px;
            }
            
            h4 {
              font-family: 'Playfair Display', serif;
              font-size: 18px;
              font-weight: 700;
              margin-top: 28px;
              margin-bottom: 12px;
            }
            
            h5 {
              font-family: 'Playfair Display', serif;
              font-size: 16px;
              font-weight: 600;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            
            p {
              margin-bottom: 18px;
              font-size: 16px;
              text-align: left;
              line-height: 1.75;
            }
            
            /* Italic summary text */
            .italic {
              font-style: italic;
            }
            
            /* Scripture references */
            .flex-wrap {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            
            .bg-scripture-bg, [class*="scripture"] {
              background: #e8f4e8 !important;
              color: #2d5a2d !important;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 14px;
              display: inline-block;
              margin: 4px;
            }
            
            /* Questions list */
            ul {
              list-style: none;
              padding: 0;
            }
            
            ul.space-y-3 li, .border-l-2 {
              padding-left: 16px;
              border-left: 2px solid #ddd;
              margin-bottom: 12px;
              font-size: 15px;
            }
            
            /* Pondered questions */
            .space-y-8 > div {
              margin-bottom: 28px;
            }
            
            /* Summary box in pondered section */
            .bg-muted\\/50, [class*="bg-muted"] {
              background: #f9f9f9 !important;
              padding: 20px;
              border-radius: 8px;
              margin-top: 24px;
              border: 1px solid #e0e0e0;
            }
            
            .list-disc {
              list-style: disc;
              padding-left: 20px;
            }
            
            .list-disc li {
              border-left: none;
              padding-left: 0;
              margin-bottom: 8px;
            }
            
            /* Hide icons and buttons */
            svg, button, .lucide {
              display: none !important;
            }
            
            /* Border styling */
            .border-b, .border-border {
              border-bottom: 1px solid #ddd;
            }
            
            /* Hide flex icon containers */
            .flex.items-center.gap-2 {
              display: block;
            }
            
            /* Text colors for print */
            .text-foreground, .text-foreground\\/90, .text-foreground\\/80 {
              color: #1a1a1a !important;
            }
            
            .text-muted-foreground {
              color: #666 !important;
            }
            
            .text-primary {
              color: #2d5a2d !important;
            }
            
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 24px;">
            <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 8px;">${primaryTheme}</p>
            <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 0;">${title}</h1>
          </div>
          
          ${contentHtml}
          
          <div style="margin-top: 48px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 24px;">
            <p>The Berean Press</p>
            <p>Teachings derived from The Christian Theologist</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for fonts to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background texture-paper overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 bg-primary/95 backdrop-blur-sm border-b border-accent/20 z-10 shadow-md">
        <div className="absolute inset-0 texture-leather pointer-events-none" />
        <div className="container max-w-4xl mx-auto px-6 py-4 flex items-center justify-between relative">
          <h1 className="font-heading font-semibold text-lg truncate pr-4 text-primary-foreground letterpress">{title}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint} className="hidden md:flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <Download className="h-4 w-4" />
              Print / Save PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cover image hero - full width, consistent across all devices */}
      {coverImage && (
        <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 bg-gradient-accent overflow-hidden">
          <img
            src={coverImage}
            alt="Teaching cover illustration"
            className="w-full h-full object-cover object-center opacity-60"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-6 left-0 right-0">
            <div className="container max-w-4xl mx-auto px-6">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
                {primaryTheme}
              </p>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground letterpress">
                {title}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* Main content - this ref is used for print/PDF */}
      <div ref={contentRef} className="container max-w-4xl mx-auto px-6 md:px-12 py-8 md:py-12 relative z-[2]">
        {/* Full teaching content */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10 page-edge bg-card texture-page-burnt rounded-xl p-6 md:p-10 border border-border"
        >
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-accent/20">
            <BookOpen className="h-5 w-5 text-accent" />
            <h3 className="font-heading font-semibold text-xl text-primary letterpress">Full Teaching</h3>
          </div>
          
          <div className={isHtml ? "prose-teaching-html" : "prose-teaching"}>
            {isHtml ? (
              <div dangerouslySetInnerHTML={{ __html: (/<p\b/i.test(content) ? content : preprocessMarkdownToHtml(content)).replace(/<p/, '<p class="drop-cap"') }} />
            ) : (
              (() => {
                let firstParagraphFound = false;
                return parsedContent.map((item, idx) => {
                  if (item.type === "heading") {
                    return (
                      <>
                        {idx > 0 && (
                          <div key={`div-${item.key}`} className="flourish-divider my-6">
                            <span className="text-accent/40 text-xs">✦</span>
                          </div>
                        )}
                        <h4
                          key={item.key}
                          className="font-heading text-xl font-bold text-primary mt-8 mb-4 first:mt-0 letterpress"
                        >
                          {item.content}
                        </h4>
                      </>
                    );
                  }
                  if (item.type === "subheading") {
                    return (
                      <h5
                        key={item.key}
                        className="font-heading text-lg font-semibold text-foreground/90 mt-6 mb-3"
                      >
                        {item.content}
                      </h5>
                    );
                  }
                  if (item.type === "bullet") {
                    return (
                      <p
                        key={item.key}
                        className="text-base md:text-[17px] leading-[1.75] text-foreground/90 mb-3 text-left flex"
                      >
                        <span className="mr-3 text-accent">•</span>
                        <span>{renderInlineMarkdown(item.content)}</span>
                      </p>
                    );
                  }
                  if (item.type === "italic-paragraph") {
                    return (
                      <p
                        key={item.key}
                        className="text-base md:text-[17px] leading-[1.75] text-foreground/90 mb-5 text-left italic"
                      >
                        {renderInlineMarkdown(item.content)}
                      </p>
                    );
                  }
                  const useDropCap = !firstParagraphFound;
                  if (!firstParagraphFound) firstParagraphFound = true;
                  return (
                    <p
                      key={item.key}
                      className={`text-base md:text-[17px] leading-[1.75] text-foreground/90 mb-5 text-left ${useDropCap ? 'drop-cap' : ''}`}
                    >
                      {renderInlineMarkdown(item.content)}
                    </p>
                  );
                });
              })()
            )}
          </div>
        </motion.section>

        {/* Clarifying Common Questions Section - After Full Teaching */}
        {hasPonderedQuestions && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-10 page-edge bg-card texture-page-burnt rounded-xl p-6 md:p-10 border border-border"
          >
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-accent/20">
              <Lightbulb className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-bold text-xl text-primary letterpress">Clarifying Common Questions</h3>
            </div>
            
            <p className="text-base italic text-muted-foreground mb-6">
              Here are some questions that the teaching on "{title}" directly addresses:
            </p>
            
            <div className="space-y-8">
              {ponderedQuestions.map((q, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="font-heading font-bold text-lg text-foreground">
                    The Question of {q.topic}: <span className="font-normal">{q.question}</span>
                  </h4>
                  <p className="text-foreground/80">
                    <span className="font-bold">Common Misconception:</span> "{q.commonAnswer}"
                  </p>
                  <p className="text-foreground/90">
                    <span className="font-bold">The Covenantal-Contextual Answer:</span> {q.cbsAnswer}
                  </p>
                </div>
              ))}
            </div>
            
          </motion.section>
        )}

        {/* Scripture References */}
        {scriptures.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-10 page-edge bg-card texture-page-burnt rounded-xl p-6 md:p-8 border border-border"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-accent/20">
              <BookOpen className="h-4 w-4 text-accent" />
              <h3 className="font-heading font-semibold text-lg text-primary letterpress">Scripture References</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {scriptures.map((scripture, i) => (
                <span
                  key={i}
                  className="bg-scripture-bg text-scripture px-3 py-1.5 rounded-md text-sm"
                >
                  {scripture}
                </span>
              ))}
            </div>
          </motion.section>
        )}

      </div>

      {/* Footer - endpaper style */}
      <div className="relative text-center py-8 border-t-2 border-accent/20 bg-primary/90 z-[2]">
        <div className="absolute inset-0 texture-leather pointer-events-none" />
        <div className="relative">
          <p className="text-sm text-primary-foreground/70">The Berean Press</p>
          <p className="text-xs text-primary-foreground/40 mt-1">
            Teachings derived from The Christian Theologist
          </p>
          <Button variant="outline" size="sm" className="mt-4 border-primary-foreground/40 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={onClose}>
            Close Reader
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineTeachingContent;
