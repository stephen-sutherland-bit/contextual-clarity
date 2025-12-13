import { useState, useRef, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { X, ChevronLeft, ChevronRight, Image, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BookPreviewProps {
  title: string;
  primaryTheme: string;
  content: string;
  scriptures: string[];
  questionsAnswered: string[];
  quickAnswer: string;
  onClose: () => void;
  coverImage?: string;
  onGenerateCover?: () => Promise<string>;
}

// Split content into pages of roughly equal size
const splitContentIntoPages = (content: string, charsPerPage: number = 1200): string[] => {
  const pages: string[] = [];
  const paragraphs = content.split(/\n\n+/);
  let currentPage = "";

  for (const paragraph of paragraphs) {
    if (currentPage.length + paragraph.length > charsPerPage && currentPage.length > 0) {
      pages.push(currentPage.trim());
      currentPage = paragraph;
    } else {
      currentPage += (currentPage ? "\n\n" : "") + paragraph;
    }
  }

  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }

  return pages;
};

const Page = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card h-full w-full p-8 flex flex-col shadow-lg ${className}`}>
    {children}
  </div>
);

const BookPreview = ({
  title,
  primaryTheme,
  content,
  scriptures,
  questionsAnswered,
  quickAnswer,
  onClose,
  coverImage,
  onGenerateCover,
}: BookPreviewProps) => {
  const { toast } = useToast();
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [localCoverImage, setLocalCoverImage] = useState(coverImage);
  const [dimensions, setDimensions] = useState({ width: 400, height: 550 });

  const contentPages = splitContentIntoPages(content);
  const totalPages = contentPages.length + 4; // Cover + content + scriptures + back cover

  useEffect(() => {
    const updateDimensions = () => {
      const maxWidth = Math.min(window.innerWidth * 0.4, 450);
      const maxHeight = window.innerHeight * 0.75;
      const aspectRatio = 0.72;
      
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      setDimensions({ width: Math.floor(width), height: Math.floor(height) });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleGenerateCover = async () => {
    if (!onGenerateCover) return;
    
    setIsGeneratingCover(true);
    try {
      const imageUrl = await onGenerateCover();
      setLocalCoverImage(imageUrl);
      toast({
        title: "Cover Generated",
        description: "Your book cover illustration has been created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate cover illustration",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const goToPrev = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  const goToNext = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Generate cover button */}
      {onGenerateCover && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateCover}
            disabled={isGeneratingCover}
          >
            {isGeneratingCover ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : localCoverImage ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Cover
              </>
            ) : (
              <>
                <Image className="h-4 w-4 mr-2" />
                Generate Cover Art
              </>
            )}
          </Button>
        </div>
      )}

      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12"
        onClick={goToPrev}
        disabled={currentPage === 0}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12"
        onClick={goToNext}
        disabled={currentPage >= totalPages - 1}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Book */}
      <div className="relative">
        <HTMLFlipBook
          ref={bookRef}
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={300}
          maxWidth={500}
          minHeight={400}
          maxHeight={700}
          showCover={true}
          onFlip={onFlip}
          className="shadow-elevated"
          style={{}}
          startPage={0}
          drawShadow={true}
          flippingTime={600}
          usePortrait={true}
          startZIndex={0}
          autoSize={false}
          maxShadowOpacity={0.5}
          mobileScrollSupport={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {/* Cover Page */}
          <div className="bg-gradient-accent rounded-r-lg">
            <Page className="bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-r-lg justify-center items-center text-center">
              {localCoverImage ? (
                <div className="absolute inset-0 overflow-hidden rounded-r-lg">
                  <img
                    src={localCoverImage}
                    alt="Cover illustration"
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
                </div>
              ) : null}
              <div className="relative z-10 space-y-6">
                <div className="text-xs uppercase tracking-[0.3em] opacity-80">
                  The Berean Press
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold leading-tight px-4">
                  {title}
                </h1>
                <div className="w-16 h-0.5 bg-primary-foreground/50 mx-auto" />
                <p className="text-sm opacity-80 italic">{primaryTheme}</p>
              </div>
            </Page>
          </div>

          {/* Quick Answer Page */}
          <div>
            <Page>
              <h2 className="font-heading text-xl text-primary mb-4 border-b border-border pb-2">
                In Brief
              </h2>
              <p className="text-foreground/90 leading-relaxed italic text-lg">
                "{quickAnswer}"
              </p>
              <div className="mt-auto pt-8">
                <p className="text-xs text-muted-foreground text-center">
                  Continue reading for the full teaching...
                </p>
              </div>
            </Page>
          </div>

          {/* Content Pages */}
          {contentPages.map((pageContent, index) => (
            <div key={`content-${index}`}>
              <Page>
                <div className="prose-teaching text-sm leading-relaxed flex-1 overflow-hidden">
                  {pageContent.split("\n\n").map((para, pIndex) => (
                    <p key={pIndex} className="mb-3 text-foreground/90">
                      {para}
                    </p>
                  ))}
                </div>
                <div className="mt-auto pt-4 text-center">
                  <span className="text-xs text-muted-foreground">
                    {index + 3} / {totalPages}
                  </span>
                </div>
              </Page>
            </div>
          ))}

          {/* Scriptures Page */}
          <div>
            <Page>
              <h2 className="font-heading text-xl text-primary mb-4 border-b border-border pb-2">
                Scripture References
              </h2>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {scriptures.map((scripture, index) => (
                    <span
                      key={index}
                      className="bg-scripture-bg text-scripture px-3 py-1.5 rounded text-sm"
                    >
                      {scripture}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-auto pt-8">
                <h3 className="font-heading text-lg text-primary mb-3">
                  Questions Answered
                </h3>
                <ul className="space-y-1">
                  {questionsAnswered.slice(0, 5).map((q, index) => (
                    <li key={index} className="text-sm text-foreground/80">
                      • {q}
                    </li>
                  ))}
                </ul>
              </div>
            </Page>
          </div>

          {/* Back Cover */}
          <div className="bg-gradient-accent rounded-l-lg">
            <Page className="bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-l-lg justify-center items-center text-center">
              <div className="space-y-6">
                <div className="text-xs uppercase tracking-[0.3em] opacity-80">
                  The Berean Press
                </div>
                <div className="w-16 h-0.5 bg-primary-foreground/50 mx-auto" />
                <p className="text-sm opacity-80 italic max-w-xs">
                  "Correcting misinterpretations through Contextual Bible Study"
                </p>
                <div className="text-xs opacity-60 mt-8">
                  Teachings derived from The Christian Theologist
                </div>
              </div>
            </Page>
          </div>
        </HTMLFlipBook>
      </div>

      {/* Page indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
      </div>
    </div>
  );
};

export default BookPreview;
