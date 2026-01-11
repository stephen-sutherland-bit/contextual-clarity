import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeachingCard from "@/components/TeachingCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, BookOpen, HelpCircle, Tag, Loader2, BookMarked } from "lucide-react";
import { themes, type Teaching, type Phase } from "@/data/teachings";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachings = async () => {
      setIsLoading(true);
      setFetchError(null);
      
      try {
        const { data, error } = await supabase
          .from("teachings")
          .select("*")
          .order("reading_order", { ascending: true });

        if (error) {
          console.error("Error fetching teachings:", error);
          setFetchError(error.message);
        } else if (data) {
          console.log(`[Search] Loaded ${data.length} teachings`);
          // Debug: Log a sample of scriptures to verify data shape
          const sampleWithScriptures = data.find(t => t.scriptures && t.scriptures.length > 0);
          if (sampleWithScriptures) {
            console.log(`[Search] Sample scriptures:`, sampleWithScriptures.scriptures);
          }
          
          const mapped: Teaching[] = data.map((t) => ({
            id: t.id,
            title: t.title,
            date: t.date,
            primaryTheme: t.primary_theme,
            secondaryThemes: t.secondary_themes || [],
            scriptures: t.scriptures || [],
            doctrines: t.doctrines || [],
            keywords: t.keywords || [],
            questionsAnswered: t.questions_answered || [],
            quickAnswer: t.quick_answer || "",
            fullContent: t.full_content,
            readingOrder: t.reading_order || undefined,
            phase: (t.phase as Phase) || "foundations",
          }));
          setTeachings(mapped);
        }
      } catch (err) {
        console.error("Unexpected error fetching teachings:", err);
        setFetchError(err instanceof Error ? err.message : "Unknown error");
      }
      setIsLoading(false);
    };

    fetchTeachings();
  }, []);

  const results = useMemo(() => {
    if (searchQuery.length < 2)
      return { teachings: [], questions: [], themes: [], scriptures: [] };

    const query = searchQuery.toLowerCase();

    const matchedTeachings = teachings.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.quickAnswer.toLowerCase().includes(query) ||
        t.keywords.some((k) => k.toLowerCase().includes(query)) ||
        t.scriptures.some((s) => s.toLowerCase().includes(query)) ||
        t.doctrines.some((d) => d.toLowerCase().includes(query)) ||
        t.fullContent.toLowerCase().includes(query)
    );

    // Find questions that match the search query
    const matchedQuestions: Array<{ question: string; teachingId: string }> = [];
    teachings.forEach((t) => {
      t.questionsAnswered.forEach((q) => {
        if (q.toLowerCase().includes(query)) {
          matchedQuestions.push({ question: q, teachingId: t.id });
        }
      });
    });
    
    // Also search for questions within fullContent
    teachings.forEach((t) => {
      if (t.fullContent.toLowerCase().includes(query)) {
        // If the content matches, add any questions from this teaching that aren't already added
        t.questionsAnswered.forEach((q) => {
          if (!matchedQuestions.some(mq => mq.question === q)) {
            // Only add if the question itself relates to the query
            if (q.toLowerCase().includes(query) || 
                t.quickAnswer.toLowerCase().includes(query)) {
              matchedQuestions.push({ question: q, teachingId: t.id });
            }
          }
        });
      }
    });

    // Collect matching scripture references with their teaching IDs
    const scriptureMap = new Map<string, string>();
    teachings.forEach((t) => {
      t.scriptures.forEach((s) => {
        if (s.toLowerCase().includes(query)) {
          scriptureMap.set(s, t.id);
        }
      });
    });

    const matchedThemes = themes.filter((t) => t.toLowerCase().includes(query));

    return {
      teachings: matchedTeachings,
      questions: matchedQuestions,
      themes: matchedThemes,
      scriptures: Array.from(scriptureMap.entries()),
    };
  }, [searchQuery, teachings]);

  const hasResults =
    results.teachings.length > 0 ||
    results.questions.length > 0 ||
    results.themes.length > 0 ||
    results.scriptures.length > 0;

  return (
    <>
      <Helmet>
        <title>Search | The Berean Press</title>
        <meta
          name="description"
          content="Search the teaching library by topic, scripture, keyword, or question. Find contextual Bible studies on any subject."
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Search Header */}
          <section className="bg-gradient-hero py-12 md:py-16 border-b border-border/50">
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl mx-auto text-center"
              >
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                  Search the Library
                </h1>
                <div className="relative">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by topic, scripture, keyword, question..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg"
                    autoFocus
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Try: "covenant", "Matthew 24", "trinity", "AD 70", "elect"
                </p>
                {!isLoading && teachings.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    Searching across {teachings.length} teachings
                  </p>
                )}
                {fetchError && (
                  <p className="mt-2 text-xs text-destructive">
                    Error loading teachings: {fetchError}
                  </p>
                )}
              </motion.div>
            </div>
          </section>

          {/* Results */}
          <section className="py-8 md:py-12">
            <div className="container px-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : searchQuery.length < 2 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start typing to search...</p>
                </div>
              ) : !hasResults ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">
                    No results found for "{searchQuery}"
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try different keywords or browse our{" "}
                    <Link to="/teachings" className="text-primary hover:underline">
                      complete library
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Questions */}
                  {results.questions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <h2 className="font-heading font-semibold text-lg">
                          Questions ({results.questions.length})
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {results.questions.map(({ question, teachingId }) => (
                            <Link
                              key={`${teachingId}-${question}`}
                              to={`/teaching/${teachingId}`}
                              className="p-4 bg-card border border-border/50 rounded-lg hover:border-primary/30 hover:bg-highlight-soft/30 transition-all"
                            >
                              <p className="text-sm font-medium">{question}</p>
                            </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Scripture References */}
                  {results.scriptures.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <BookMarked className="h-5 w-5 text-primary" />
                        <h2 className="font-heading font-semibold text-lg">
                          Scripture References ({results.scriptures.length})
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {results.scriptures.map(([scripture, teachingId]) => (
                          <Link
                            key={scripture}
                            to={`/teaching/${teachingId}`}
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer bg-scripture-bg text-scripture hover:bg-scripture/10 border-scripture/30"
                            >
                              {scripture}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Themes */}
                  {results.themes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Tag className="h-5 w-5 text-primary" />
                        <h2 className="font-heading font-semibold text-lg">
                          Themes ({results.themes.length})
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {results.themes.map((theme) => (
                          <Link
                            key={theme}
                            to={`/teachings?theme=${encodeURIComponent(theme)}`}
                          >
                            <Badge
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary/10"
                            >
                              {theme}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Teachings */}
                  {results.teachings.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h2 className="font-heading font-semibold text-lg">
                          Teachings ({results.teachings.length})
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.teachings.map((teaching, index) => (
                          <TeachingCard
                            key={teaching.id}
                            teaching={teaching}
                            index={index}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Search;