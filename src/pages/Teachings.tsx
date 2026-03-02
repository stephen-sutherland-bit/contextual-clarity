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

// Component to group and display teachings by module
const ModuleGroupedTeachings = ({ teachings }: { teachings: Teaching[] }) => {
  // Group teachings by module
  const grouped = useMemo(() => {
    const modules: Record<string, Teaching[]> = {};
    const unassigned: Teaching[] = [];
    
    teachings.forEach(teaching => {
      if (teaching.module) {
        if (!modules[teaching.module]) {
          modules[teaching.module] = [];
        }
        modules[teaching.module].push(teaching);
      } else {
        unassigned.push(teaching);
      }
    });
    
    // Sort modules alphabetically
    const sortedModules = Object.keys(modules).sort();
    
    return { modules, sortedModules, unassigned };
  }, [teachings]);

  return (
    <div className="space-y-10">
      {grouped.sortedModules.map((moduleKey) => (
        <div key={moduleKey}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{moduleKey}</span>
            </div>
            <h3 className="text-lg font-heading font-semibold">Module {moduleKey}</h3>
            <span className="text-sm text-muted-foreground">
              ({grouped.modules[moduleKey].length} teaching{grouped.modules[moduleKey].length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grouped.modules[moduleKey].map((teaching, index) => (
              <TeachingCard
                key={teaching.id}
                teaching={teaching}
                index={index}
              />
            ))}
          </div>
        </div>
      ))}
      
      {grouped.unassigned.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-bold text-muted-foreground">–</span>
            </div>
            <h3 className="text-lg font-heading font-semibold text-muted-foreground">Unassigned</h3>
            <span className="text-sm text-muted-foreground">
              ({grouped.unassigned.length} teaching{grouped.unassigned.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grouped.unassigned.map((teaching, index) => (
              <TeachingCard
                key={teaching.id}
                teaching={teaching}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Teachings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(
    searchParams.get("phase") ? (searchParams.get("phase") as Phase) : "foundations"
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
          phase,
          keywords,
          questions_answered,
          module,
          module_order
        `);

      // Apply phase filter if specified
      if (phaseFilter) {
        query = query.eq('phase', phaseFilter);
      }

      // Add ordering - for "All Phases" view, sort by phase first to group them
      // For phase views, sort by module then module_order for grouped display
      if (!phaseFilter) {
        query = query
          .order("phase", { ascending: true })
          .order("module", { ascending: true, nullsFirst: false })
          .order("module_order", { ascending: true, nullsFirst: false })
          .order("reading_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false });
      } else {
        query = query
          .order("module", { ascending: true, nullsFirst: false })
          .order("module_order", { ascending: true, nullsFirst: false })
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
          keywords: t.keywords || [],
          questionsAnswered: t.questions_answered || [],
          quickAnswer: t.quick_answer || "",
          fullContent: "",
          readingOrder: t.reading_order || undefined,
          phase: (t.phase as Phase) || "foundations",
          module: t.module || undefined,
          moduleOrder: t.module_order || undefined,
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
    const phaseParam = searchParams.get("phase") as Phase | null;
    const initialPhase = phaseParam || "foundations";
    setSelectedPhase(initialPhase);
    fetchTeachings(0, false, initialPhase);
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

  const handlePhaseClick = (phase: Phase | null) => {
    setSelectedPhase(phase as Phase);
    setPage(0);
    if (phase) {
      setSearchParams({ phase });
    } else {
      setSearchParams({});
    }
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
      <div className="min-h-screen flex flex-col texture-paper">
        <Header />
        <main className="flex-1">
          {/* Page Header */}
          <section className="relative bg-gradient-hero py-12 md:py-16 border-b border-border/50 texture-leather">
            <div className="container px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl"
              >
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4 hero-text letterpress">
                  All Teachings
                </h1>
                <p className="text-lg hero-text-muted">
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
                {/* All Teachings tab at the end */}
                <Badge
                  variant={selectedPhase === null ? "default" : "outline"}
                  className="cursor-pointer flex-shrink-0 hover:bg-primary/10 px-5 py-2.5 text-base font-medium"
                  onClick={() => handlePhaseClick(null as unknown as Phase)}
                >
                  All Teachings
                </Badge>
              </div>
            </div>
          </section>

          {/* Foundations Banner - show when viewing non-Foundations phases */}
          {selectedPhase && selectedPhase !== "foundations" && (
            <div className="bg-primary/5 border-b border-primary/10">
              <div className="container px-4 py-3">
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-medium text-primary">New to Contextual Bible Study?</span>{" "}
                  We recommend starting with{" "}
                  <button 
                    onClick={() => handlePhaseClick("foundations")}
                    className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
                  >
                    Foundations
                  </button>{" "}
                  to understand the methodology before exploring other phases.
                </p>
              </div>
            </div>
          )}

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
                    Showing {filteredTeachings.length} of {totalCount || teachings.length} teachings
                    {selectedPhase && <> in {phases.find(p => p.slug === selectedPhase)?.name}</>}
                    {!selectedPhase && <> across all phases</>}
                    {(searchQuery || selectedTheme) && filteredTeachings.length !== teachings.length && (
                      <> (filtered)</>
                    )}
                  </div>

                  {filteredTeachings.length > 0 ? (
                    <>
                      {selectedPhase && !searchQuery && !selectedTheme ? (
                        // Grouped by module view for phase tabs (when not searching/filtering)
                        <ModuleGroupedTeachings teachings={filteredTeachings} />
                      ) : (
                        // Flat grid for "All Teachings" or when filtering
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredTeachings.map((teaching, index) => (
                            <TeachingCard
                              key={teaching.id}
                              teaching={teaching}
                              index={index}
                            />
                          ))}
                        </div>
                      )}
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