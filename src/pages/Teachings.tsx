import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeachingCard from "@/components/TeachingCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { phases, themes, type Teaching, type Phase } from "@/data/teachings";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";

const PAGE_SIZE = 24;

const Teachings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase>(
    (searchParams.get("phase") as Phase) || "foundations"
  );
  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchTeachings = useCallback(async (pageNum: number, append = false, phaseFilter?: Phase | null) => {
    if (pageNum === 0) {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Build base query
      let query = supabase
        .from("teachings")
        .select(`
          id,
          title,
          date,
          primary_theme,
          scriptures,
          quick_answer,
          reading_order,
          phase
        `);

      // Apply phase filter if specified
      if (phaseFilter) {
        query = query.eq('phase', phaseFilter);
      }

      // Add ordering - for "All Phases" view, sort by phase first to group them
      if (!phaseFilter) {
        query = query
          .order("phase", { ascending: true })
          .order("reading_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false });
      } else {
        query = query
          .order("reading_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false });
      }

      // Only paginate when viewing "All Phases" (no phase filter)
      if (!phaseFilter) {
        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        // Get total count only for "All Phases" view on first page
        if (pageNum === 0) {
          const { count, error: countError } = await supabase
            .from("teachings")
            .select("*", { count: "exact", head: true });
          
          if (!countError && count !== null) {
            setTotalCount(count);
          }
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Error fetching teachings:", fetchError);
        setError(fetchError.message || "Failed to load teachings. Please try again.");
      } else if (data) {
        const mapped: Teaching[] = data.map((t) => ({
          id: t.id,
          title: t.title,
          date: t.date,
          primaryTheme: t.primary_theme,
          secondaryThemes: [],
          scriptures: t.scriptures || [],
          doctrines: [],
          keywords: [],
          questionsAnswered: [],
          quickAnswer: t.quick_answer || "",
          fullContent: "",
          readingOrder: t.reading_order || undefined,
          phase: (t.phase as Phase) || "foundations",
        }));

        if (append) {
          setTeachings(prev => [...prev, ...mapped]);
        } else {
          setTeachings(mapped);
        }
        // Only show "Load More" for All Phases view
        setHasMore(!phaseFilter && data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error("Error fetching teachings:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const phaseParam = (searchParams.get("phase") as Phase) || "foundations";
    setSelectedPhase(phaseParam);
    fetchTeachings(0, false, phaseParam);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTeachings(nextPage, true, null);
  };

  const handleRetry = () => {
    setPage(0);
    fetchTeachings(0, false, selectedPhase);
  };

  const filteredTeachings = useMemo(() => {
    return teachings.filter((teaching) => {
      const matchesSearch =
        searchQuery === "" ||
        teaching.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teaching.keywords.some((k) =>
          k.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        teaching.scriptures.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        teaching.questionsAnswered.some((q) =>
          q.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTheme =
        !selectedTheme ||
        teaching.primaryTheme === selectedTheme ||
        teaching.secondaryThemes.includes(selectedTheme);

      const matchesPhase = !selectedPhase || teaching.phase === selectedPhase;

      return matchesSearch && matchesTheme && matchesPhase;
    });
  }, [searchQuery, selectedTheme, selectedPhase, teachings]);

  const handlePhaseClick = (phase: Phase) => {
    setSelectedPhase(phase);
    setPage(0);
    setSearchParams({ phase });
    fetchTeachings(0, false, phase);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTheme(null);
  };

  return (
    <>
      <Helmet>
        <title>All Teachings | The Berean Press</title>
        <meta
          name="description"
          content="Browse all contextual Bible study teachings. Search by topic, scripture, or keyword. Sound exegesis with context as king."
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Page Header */}
          <section className="bg-gradient-hero py-12 md:py-16 border-b border-border/50">
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl"
              >
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  All Teachings
                </h1>
                <p className="text-lg text-muted-foreground">
                  Browse our library of contextual Bible studies. Filter by phase,
                  theme, or search for specific topics.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Phase Filter */}
          <section className="border-b border-border/50 bg-secondary/20">
            <div className="container px-4 py-5">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {phases.map((phase) => (
                  <Badge
                    key={phase.slug}
                    variant={selectedPhase === phase.slug ? "default" : "outline"}
                    className="cursor-pointer flex-shrink-0 hover:bg-primary/10 px-5 py-2.5 text-base font-medium"
                    onClick={() => handlePhaseClick(phase.slug)}
                  >
                    {phase.name}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          {/* Search & Theme Filters */}
          <section className="border-b border-border/50 bg-background sticky top-16 z-40">
            <div className="container px-4 py-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by topic, scripture, keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                  <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {(selectedTheme || searchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                  {themes.slice(0, 5).map((theme) => (
                    <Badge
                      key={theme}
                      variant={selectedTheme === theme ? "default" : "outline"}
                      className="cursor-pointer flex-shrink-0 hover:bg-primary/10"
                      onClick={() =>
                        setSelectedTheme(selectedTheme === theme ? null : theme)
                      }
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Results */}
          <section className="py-8 md:py-12">
            <div className="container px-4">
              {error ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-destructive mb-4">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                  {totalCount !== null && totalCount > 0 && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {totalCount} teachings exist in the database but couldn't be loaded.
                    </p>
                  )}
                  <Button variant="warm" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="mb-6 text-sm text-muted-foreground">
                    Showing {teachings.length} teachings in {phases.find(p => p.slug === selectedPhase)?.name}
                    {(searchQuery || selectedTheme) && filteredTeachings.length !== teachings.length && (
                      <> ({filteredTeachings.length} match current filters)</>
                    )}
                  </div>

                  {filteredTeachings.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTeachings.map((teaching, index) => (
                          <TeachingCard
                            key={teaching.id}
                            teaching={teaching}
                            index={index}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No teachings found matching your filters.
                      </p>
                      <Button variant="warm" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Teachings;