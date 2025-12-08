import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeachingCard from "@/components/TeachingCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { teachings, themes } from "@/data/teachings";
import { Helmet } from "react-helmet-async";

const Teachings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const filteredTeachings = useMemo(() => {
    return teachings.filter(teaching => {
      const matchesSearch = searchQuery === "" || 
        teaching.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teaching.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        teaching.scriptures.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        teaching.questionsAnswered.some(q => q.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTheme = !selectedTheme || 
        teaching.primaryTheme === selectedTheme ||
        teaching.secondaryThemes.includes(selectedTheme);

      return matchesSearch && matchesTheme;
    });
  }, [searchQuery, selectedTheme]);

  return (
    <>
      <Helmet>
        <title>All Teachings | The Christian Theologist</title>
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
                  Browse our complete library of contextual Bible studies. Use the search 
                  or filter by theme to find what you're looking for.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Search & Filters */}
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
                  {selectedTheme && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTheme(null)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                  {themes.slice(0, 5).map(theme => (
                    <Badge
                      key={theme}
                      variant={selectedTheme === theme ? "default" : "outline"}
                      className="cursor-pointer flex-shrink-0 hover:bg-primary/10"
                      onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
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
              <div className="mb-6 text-sm text-muted-foreground">
                Showing {filteredTeachings.length} of {teachings.length} teachings
              </div>
              
              {filteredTeachings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeachings.map((teaching, index) => (
                    <TeachingCard key={teaching.id} teaching={teaching} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No teachings found matching your search.
                  </p>
                  <Button 
                    variant="warm" 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTheme(null);
                    }}
                  >
                    Clear Filters
                  </Button>
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

export default Teachings;
