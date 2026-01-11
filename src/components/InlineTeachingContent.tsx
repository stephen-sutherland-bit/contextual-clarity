import { useMemo } from "react";
import { motion } from "framer-motion";
import { X, BookOpen, HelpCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InlineTeachingContentProps {
  title: string;
  primaryTheme: string;
  content: string;
  scriptures: string[];
  questionsAnswered: string[];
  quickAnswer: string;
  coverImage?: string;
  onClose: () => void;
}

// Parse content to detect and render headings properly, preserving original doc structure
const parseContentWithHeadings = (content: string) => {
  // Split by double newlines first, but also handle single newlines for tighter spacing
  const blocks = content.split(/\n\n+/).filter(p => p.trim());
  
  const results: Array<{type: 'heading' | 'subheading' | 'paragraph', content: string, key: number}> = [];
  
  blocks.forEach((block, index) => {
    const trimmed = block.trim();
    
    // Check for markdown-style headings (## Heading)
    if (trimmed.startsWith("## ")) {
      results.push({
        type: "heading",
        content: trimmed.slice(3),
        key: index * 100,
      });
      return;
    }
    
    // Check for markdown bold headings (**Heading**)
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch && boldMatch[1].length < 100) {
      results.push({
        type: "heading",
        content: boldMatch[1],
        key: index * 100,
      });
      return;
    }
    
    // Check for numbered headings like "1. Title" or "I. Title" at start of line
    const numberedMatch = trimmed.match(/^([0-9]+\.|[IVXLC]+\.)\s+(.+)$/);
    if (numberedMatch && trimmed.length < 120 && !trimmed.includes('\n')) {
      results.push({
        type: "heading",
        content: trimmed,
        key: index * 100,
      });
      return;
    }
    
    // Check for all-caps headings (likely section titles)
    // Must be short (under 100 chars) and all uppercase letters/spaces/punctuation
    if (
      trimmed.length < 100 &&
      trimmed.length > 3 &&
      trimmed === trimmed.toUpperCase() &&
      /^[A-Z\s\-:,.'0-9]+$/.test(trimmed)
    ) {
      results.push({
        type: "heading",
        content: trimmed,
        key: index * 100,
      });
      return;
    }
    
    // Check for short lines that look like subheadings (capitalized, no period at end, short)
    if (
      trimmed.length < 80 &&
      trimmed.length > 5 &&
      !trimmed.endsWith('.') &&
      !trimmed.endsWith(',') &&
      !trimmed.includes('\n') &&
      /^[A-Z]/.test(trimmed) &&
      !/^(The|A|An|This|That|In|On|At|For|To|And|But|Or|If|When|What|How|Why|Where)\s/i.test(trimmed)
    ) {
      // Could be a subheading - check if it's followed by longer content
      results.push({
        type: "subheading",
        content: trimmed,
        key: index * 100,
      });
      return;
    }
    
    // Handle blocks that contain internal line breaks (preserve them as separate paragraphs)
    if (trimmed.includes('\n')) {
      const lines = trimmed.split('\n').filter(l => l.trim());
      lines.forEach((line, lineIndex) => {
        results.push({
          type: "paragraph",
          content: line.trim(),
          key: index * 100 + lineIndex,
        });
      });
      return;
    }
    
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
  onClose,
}: InlineTeachingContentProps) => {
  const parsedContent = useMemo(() => parseContentWithHeadings(content), [content]);

  const handlePrint = () => {
    // Create a new window with just the teaching content for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
            
            h1 {
              font-family: 'Playfair Display', serif;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              color: #1a1a1a;
            }
            
            .theme {
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #666;
              margin-bottom: 24px;
            }
            
            .summary {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 32px;
              font-style: italic;
              font-size: 18px;
            }
            
            .section-title {
              font-family: 'Playfair Display', serif;
              font-size: 20px;
              font-weight: 600;
              margin-top: 32px;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 1px solid #ddd;
            }
            
            .heading {
              font-family: 'Playfair Display', serif;
              font-size: 18px;
              font-weight: 700;
              margin-top: 28px;
              margin-bottom: 12px;
            }
            
            .subheading {
              font-family: 'Playfair Display', serif;
              font-size: 16px;
              font-weight: 600;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            
            p {
              margin-bottom: 18px;
              font-size: 16px;
              text-align: justify;
              line-height: 1.75;
            }
            
            .scriptures {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 16px;
            }
            
            .scripture {
              background: #e8f4e8;
              color: #2d5a2d;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 14px;
            }
            
            .questions {
              list-style: none;
              margin-top: 16px;
            }
            
            .questions li {
              padding-left: 16px;
              border-left: 2px solid #ddd;
              margin-bottom: 12px;
              font-size: 15px;
            }
            
            .footer {
              margin-top: 48px;
              text-align: center;
              font-size: 12px;
              color: #888;
              border-top: 1px solid #ddd;
              padding-top: 24px;
            }
            
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <p class="theme">${primaryTheme}</p>
          <h1>${title}</h1>
          
          <div class="summary">"${quickAnswer}"</div>
          
          <h2 class="section-title">Full Teaching</h2>
          ${parsedContent.map(item => {
            if (item.type === 'heading') return `<h3 class="heading">${item.content}</h3>`;
            if (item.type === 'subheading') return `<h4 class="subheading">${item.content}</h4>`;
            return `<p>${item.content}</p>`;
          }).join('')}
          
          ${scriptures.length > 0 ? `
            <h2 class="section-title">Scripture References</h2>
            <div class="scriptures">
              ${scriptures.map(s => `<span class="scripture">${s}</span>`).join('')}
            </div>
          ` : ''}
          
          ${questionsAnswered.length > 0 ? `
            <h2 class="section-title">Questions This Teaching Answers</h2>
            <ul class="questions">
              ${questionsAnswered.map(q => `<li>${q}</li>`).join('')}
            </ul>
          ` : ''}
          
          <div class="footer">
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
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="container max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-heading font-semibold text-lg truncate pr-4">{title}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint} className="hidden md:flex items-center gap-2">
              <Download className="h-4 w-4" />
              Print / Save PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
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
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                {title}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container max-w-4xl mx-auto px-6 py-8 md:py-12">
        {/* Summary box */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-primary/5 rounded-xl p-6 md:p-8 border border-primary/10 mb-10"
        >
          <div className="flex items-center gap-2 mb-4 text-primary">
            <HelpCircle className="h-5 w-5" />
            <h3 className="font-heading font-semibold text-lg">Summary</h3>
          </div>
          <p className="text-lg md:text-xl leading-relaxed italic text-foreground/90">
            "{quickAnswer}"
          </p>
        </motion.section>

        {/* Full teaching content */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-border">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-semibold text-xl text-primary">Full Teaching</h3>
          </div>
          
          <div className="prose-teaching">
            {parsedContent.map((item) => {
              if (item.type === "heading") {
                return (
                  <h4
                    key={item.key}
                    className="font-heading text-xl font-bold text-foreground mt-8 mb-4 first:mt-0"
                  >
                    {item.content}
                  </h4>
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
              return (
                <p
                  key={item.key}
                  className="text-base md:text-[17px] leading-[1.75] text-foreground/90 mb-5 text-justify"
                >
                  {item.content}
                </p>
              );
            })}
          </div>
        </motion.section>

        {/* Scripture References */}
        {scriptures.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-semibold text-lg text-primary">Scripture References</h3>
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

        {/* Questions Answered */}
        {questionsAnswered.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <HelpCircle className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-semibold text-lg text-primary">Questions This Teaching Answers</h3>
            </div>
            <ul className="space-y-3">
              {questionsAnswered.map((question, i) => (
                <li
                  key={i}
                  className="text-foreground/80 text-base leading-relaxed pl-4 border-l-2 border-primary/30"
                >
                  {question}
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-border bg-muted/30">
        <p className="text-sm text-muted-foreground">The Berean Press</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Teachings derived from The Christian Theologist
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
          Close Reader
        </Button>
      </div>
    </div>
  );
};

export default InlineTeachingContent;
