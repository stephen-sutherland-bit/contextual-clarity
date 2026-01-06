import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookPreview from "@/components/BookPreview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Tag,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  Share2,
  Loader2,
  ImagePlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Teaching, type Phase, phases } from "@/data/teachings";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const TeachingDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { isAdmin, session } = useAuth();
  const [teaching, setTeaching] = useState<Teaching | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookPreview, setShowBookPreview] = useState(false);
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  useEffect(() => {
    const fetchTeaching = async () => {
      if (!id) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from("teachings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching teaching:", error);
        setTeaching(null);
      } else if (data) {
        setTeaching({
          id: data.id,
          title: data.title,
          date: data.date,
          primaryTheme: data.primary_theme,
          secondaryThemes: data.secondary_themes || [],
          scriptures: data.scriptures || [],
          doctrines: data.doctrines || [],
          keywords: data.keywords || [],
          questionsAnswered: data.questions_answered || [],
          quickAnswer: data.quick_answer || "",
          fullContent: data.full_content,
          readingOrder: data.reading_order || undefined,
          phase: (data.phase as Phase) || "foundations",
        });
        setCoverImage((data as any).cover_image || undefined);
      }
      setIsLoading(false);
    };

    fetchTeaching();
  }, [id]);

  // Strip HTML for BookPreview content, preserving paragraph breaks
  const stripHtml = (html: string) => {
    // First add line breaks before block elements
    let text = html
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li>/gi, "\n• ");
    
    // Now strip remaining HTML tags
    const doc = new DOMParser().parseFromString(text, "text/html");
    text = doc.body.textContent || "";
    
    // Clean up excessive whitespace while preserving paragraph breaks
    return text.replace(/\n{3,}/g, "\n\n").trim();
  };

  // Generate cover image via edge function (admin only)
  const handleGenerateCover = async (): Promise<string> => {
    if (!teaching) throw new Error("No teaching loaded");
    if (!session?.access_token) throw new Error("Not authenticated");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-illustration`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: teaching.title,
          theme: teaching.primaryTheme,
          scriptures: teaching.scriptures.slice(0, 5),
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed with status ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data?.imageUrl;
    if (!imageUrl) throw new Error("No image returned");

    // Save to database
    const { error: updateError } = await supabase
      .from("teachings")
      .update({ cover_image: imageUrl })
      .eq("id", teaching.id);

    if (updateError) {
      console.error("Failed to save cover image:", updateError);
      toast({
        title: "Warning",
        description: "Cover generated but failed to save to database",
        variant: "destructive",
      });
    } else {
      setCoverImage(imageUrl);
    }

    return imageUrl;
  };

  // Regenerate cover from the detail page
  const handleRegenerateCover = async () => {
    setIsGeneratingCover(true);
    toast({
      title: "Generating cover...",
      description: "Creating AI illustration for this teaching",
    });
    
    try {
      await handleGenerateCover();
      toast({
        title: "Cover updated",
        description: "New cover image has been generated and saved",
      });
    } catch (error) {
      console.error("Cover generation failed:", error);
      toast({
        title: "Generation failed",
        description: "Could not generate cover image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!teaching) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold mb-4">
              Teaching Not Found
            </h1>
            <Button asChild>
              <Link to="/teachings">Browse All Teachings</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const phaseInfo = phases.find((p) => p.slug === teaching.phase);

  return (
    <>
      <Helmet>
        <title>{teaching.title} | The Berean Press</title>
        <meta
          name="description"
          content={teaching.quickAnswer.substring(0, 155)}
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Back navigation */}
          <div className="border-b border-border/50 bg-secondary/20">
            <div className="container px-4 py-3">
              <Button variant="ghost" size="sm" asChild>
                <Link
                  to="/teachings"
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Teachings
                </Link>
              </Button>
            </div>
          </div>

          <article className="container px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <Badge variant="secondary">{teaching.primaryTheme}</Badge>
                  {phaseInfo && (
                    <Badge variant="outline">{phaseInfo.name}</Badge>
                  )}
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {teaching.date}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  {teaching.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {teaching.secondaryThemes.map((theme) => (
                    <Badge key={theme} variant="outline" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </motion.header>

              {/* Quick Answer Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card variant="featured" className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                      <HelpCircle className="h-5 w-5" />
                      <h2 className="font-heading font-semibold">Quick Answer</h2>
                    </div>
                    <p className="text-foreground leading-relaxed text-lg">
                      {teaching.quickAnswer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Want to know more? */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8"
              >
                <div className="text-center py-8 border-y border-border/50">
                  <p className="text-muted-foreground mb-4">
                    Want to understand the full context and reasoning?
                  </p>
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={() => setShowBookPreview(true)}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-5 w-5" />
                    Read Full Teaching
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Scripture References */}
              {teaching.scriptures.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-8"
                >
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Scripture References
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {teaching.scriptures.map((scripture) => (
                      <span
                        key={scripture}
                        className="px-3 py-1.5 bg-scripture-bg text-scripture rounded-md text-sm"
                      >
                        {scripture}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Questions Answered */}
              {teaching.questionsAnswered.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mb-8"
                >
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Questions This Teaching Answers
                  </h3>
                  <ul className="space-y-2">
                    {teaching.questionsAnswered.map((question) => (
                      <li
                        key={question}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <span className="text-primary mt-1.5">•</span>
                        {question}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Keywords/Tags */}
              {teaching.keywords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="mb-8"
                >
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {teaching.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Share & More */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="pt-8 border-t border-border/50 flex flex-wrap gap-4 justify-between items-center"
              >
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="warm"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={async () => {
                      const url = window.location.href;
                      const shareData = {
                        title: teaching.title,
                        text: teaching.quickAnswer || `Read "${teaching.title}" on The Berean Press`,
                        url: url,
                      };
                      
                      if (navigator.share && navigator.canShare?.(shareData)) {
                        try {
                          await navigator.share(shareData);
                        } catch (err) {
                          if ((err as Error).name !== 'AbortError') {
                            console.error('Share failed:', err);
                          }
                        }
                      } else {
                        await navigator.clipboard.writeText(url);
                        toast({
                          title: "Link copied",
                          description: "Teaching URL has been copied to your clipboard.",
                        });
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Share Teaching
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={handleRegenerateCover}
                      disabled={isGeneratingCover}
                    >
                      {isGeneratingCover ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      {coverImage ? "Regenerate Cover" : "Generate Cover"}
                    </Button>
                  )}
                </div>
                <a
                  href="https://christiantheologist.substack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  Source: The Christian Theologist
                  <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            </div>
          </article>
        </main>
        <Footer />
      </div>

      {/* Book Preview Modal */}
      {showBookPreview && (
        <BookPreview
          title={teaching.title}
          primaryTheme={teaching.primaryTheme}
          content={stripHtml(teaching.fullContent || "")}
          scriptures={teaching.scriptures}
          questionsAnswered={teaching.questionsAnswered}
          quickAnswer={teaching.quickAnswer}
          coverImage={coverImage}
          onClose={() => setShowBookPreview(false)}
          onGenerateCover={isAdmin ? handleGenerateCover : undefined}
        />
      )}
    </>
  );
};

export default TeachingDetail;