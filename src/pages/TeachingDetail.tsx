import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  Share2 
} from "lucide-react";
import { teachings } from "@/data/teachings";
import { useState } from "react";
import { Helmet } from "react-helmet-async";

const TeachingDetail = () => {
  const { id } = useParams();
  const teaching = teachings.find(t => t.id === id);
  const [showFullContent, setShowFullContent] = useState(false);

  if (!teaching) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold mb-4">Teaching Not Found</h1>
            <Button asChild>
              <Link to="/teachings">Browse All Teachings</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{teaching.title} | The Christian Theologist</title>
        <meta name="description" content={teaching.quickAnswer.substring(0, 155)} />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Back navigation */}
          <div className="border-b border-border/50 bg-secondary/20">
            <div className="container px-4 py-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/teachings" className="flex items-center gap-2 text-muted-foreground">
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
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary">{teaching.primaryTheme}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {teaching.date}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  {teaching.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {teaching.secondaryThemes.map(theme => (
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
                {!showFullContent ? (
                  <div className="text-center py-8 border-y border-border/50">
                    <p className="text-muted-foreground mb-4">
                      Want to understand the full context and reasoning?
                    </p>
                    <Button 
                      variant="hero" 
                      size="lg"
                      onClick={() => setShowFullContent(true)}
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="h-5 w-5" />
                      Read Full Teaching
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="prose-teaching">
                    <Separator className="mb-8" />
                    <h2>Full Teaching</h2>
                    <p>
                      {teaching.fullContent || 
                        "The full teaching content will be available here. This would contain the complete, contextually-rich explanation with all the pedagogical detail, scripture references, and reasoning that supports the quick answer above."}
                    </p>
                    <p>
                      For now, this is placeholder content. When you connect this to your 
                      Google Docs or a database, the full teaching will appear here with all 
                      the depth and context your CBS methodology provides.
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Scripture References */}
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
                  {teaching.scriptures.map(scripture => (
                    <span 
                      key={scripture}
                      className="px-3 py-1.5 bg-scripture-bg text-scripture rounded-md text-sm"
                    >
                      {scripture}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Questions Answered */}
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
                  {teaching.questionsAnswered.map(question => (
                    <li key={question} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary mt-1.5">•</span>
                      {question}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Keywords/Tags */}
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
                  {teaching.keywords.map(keyword => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </motion.div>

              {/* Share & More */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="pt-8 border-t border-border/50 flex flex-wrap gap-4 justify-between items-center"
              >
                <Button variant="warm" size="sm" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Teaching
                </Button>
                <a 
                  href="https://christiantheologist.substack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  More at Substack
                  <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default TeachingDetail;
