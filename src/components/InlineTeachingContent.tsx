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

// Parse content to detect and render headings properly
const parseContentWithHeadings = (content: string) => {
  const paragraphs = content.split("\n\n").filter(p => p.trim());
  
  return paragraphs.map((para, index) => {
    const trimmed = para.trim();
    
    // Check for markdown-style headings (## Heading)
    if (trimmed.startsWith("## ")) {
      return {
        type: "heading" as const,
        content: trimmed.slice(3),
        key: index,
      };
    }
    
    // Check for all-caps headings (likely section titles)
    // Must be short (under 100 chars) and all uppercase letters/spaces/punctuation
    if (
      trimmed.length < 100 &&
      trimmed.length > 3 &&
      trimmed === trimmed.toUpperCase() &&
      /^[A-Z\s\-:,]+$/.test(trimmed)
    ) {
      return {
        type: "heading" as const,
        content: trimmed,
        key: index,
      };
    }
    
    return {
      type: "paragraph" as const,
      content: trimmed,
      key: index,
    };
  });
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
    window.print();
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
                    className="font-heading text-xl font-semibold text-foreground mt-8 mb-4 first:mt-0"
                  >
                    {item.content}
                  </h4>
                );
              }
              return (
                <p
                  key={item.key}
                  className="text-base md:text-lg leading-relaxed text-foreground/90 mb-4"
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
