import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookMarked, 
  History, 
  Scale, 
  Eye, 
  Target, 
  ScrollText,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const principles = [
  {
    icon: BookMarked,
    title: "Context is King",
    description: "Every passage must be interpreted within its original historical, cultural, and covenantal setting. This includes both internal context (surrounding verses, chapter, book, Testament) and external context (historical events like the Babylonian exile or AD 70).",
    example: "When Jesus says 'this generation will not pass away' in Matthew 24:34, the context demands we understand 'generation' as his contemporaries—the people standing before him—not a future generation thousands of years later."
  },
  {
    icon: ScrollText,
    title: "Covenant Framework",
    description: "Identifying which covenant governs a passage is essential. The Mosaic Covenant (Old Covenant) and the New Covenant have different terms, audiences, and applications. Conflating them leads to confusion.",
    example: "Commands given to Israel under Moses (like Sabbath observance or dietary laws) were part of the Mosaic Covenant, which ended at AD 70. Christians today live under the New Covenant of grace."
  },
  {
    icon: Target,
    title: "Authorial Intent",
    description: "The meaning of a text is what the original author intended to communicate to his original audience. We seek to understand what they would have understood, not what we want it to mean today.",
    example: "When Paul wrote to the Corinthians about 'the present distress' (1 Corinthians 7:26), he was addressing an imminent crisis his readers faced—not giving timeless marriage advice divorced from its historical context."
  },
  {
    icon: Eye,
    title: "Literal vs Symbolic",
    description: "Ancient literature uses symbolic and metaphorical language that would have been immediately understood by its original audience. 'Clouds' symbolise divine judgement, 'stars falling' represent authorities being overthrown, 'world' often means the known world or covenant community.",
    example: "Isaiah 19:1 describes God 'riding on a swift cloud' to judge Egypt—fulfilled through the Assyrian invasion, not a literal cloud chariot. Jesus uses the same imagery in Matthew 24:30."
  },
  {
    icon: History,
    title: "Fulfilment Horizon",
    description: "Jesus' prophecies in Matthew 24 and the book of Revelation were fulfilled in AD 70 when Rome destroyed Jerusalem and the Temple. This was the 'end of the age'—the end of the Old Covenant age, not the end of planet Earth.",
    example: "The 'great tribulation' Jesus described (Matthew 24:21) matches Josephus's account of Jerusalem's destruction. The disciples' question was about the Temple's destruction, which Jesus answered directly."
  },
  {
    icon: Scale,
    title: "Law vs Grace",
    description: "The Mosaic Law was given to Israel as part of their covenant with God. Sin, biblically defined as 'transgression of the Law' (1 John 3:4), applied under that covenant. Christians are not under Law but under grace, led by the Spirit who writes God's character on our hearts.",
    example: "Romans 6:14 explicitly states we are 'not under law but under grace.' This doesn't mean anything goes—the Spirit produces fruit that naturally aligns with God's nature."
  }
];

const avoidances = [
  "Modernising ancient terms to fit contemporary meanings",
  "Futurist interpretations that ignore time statements",
  "Using 'Preterist' as a label (we prefer 'Contextual')",
  "Reading newspaper headlines into biblical prophecy",
  "Ignoring the audience to whom texts were written",
  "Treating metaphorical language as literal and vice versa"
];

const Methodology = () => {
  return (
    <>
      <Helmet>
        <title>CBS Methodology | The Christian Theologist</title>
        <meta 
          name="description" 
          content="Learn the Contextual Bible Study (CBS) methodology. Context is king—interpret Scripture in its original historical, cultural, and covenantal setting." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Hero */}
          <section className="bg-gradient-hero py-16 md:py-24 border-b border-border/50">
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl mx-auto text-center"
              >
                <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
                  Our Approach
                </span>
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                  Contextual Bible Study Methodology
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Most confusion in biblical interpretation comes from reading ancient texts 
                  through modern lenses. CBS methodology places every passage in its proper 
                  historical and covenantal context—the way the original audience would have 
                  understood it.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Principles */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  Core Principles
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  These six principles guide every teaching and interpretation we produce.
                </p>
              </motion.div>

              <div className="space-y-8">
                {principles.map((principle, index) => (
                  <motion.div
                    key={principle.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card variant="elevated">
                      <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                              <principle.icon className="h-7 w-7 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-heading font-semibold mb-3">
                              {principle.title}
                            </h3>
                            <p className="text-muted-foreground mb-4 leading-relaxed">
                              {principle.description}
                            </p>
                            <div className="bg-highlight-soft rounded-lg p-4">
                              <p className="text-sm">
                                <span className="font-semibold text-accent">Example: </span>
                                {principle.example}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* What We Avoid */}
          <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container px-4">
              <div className="max-w-3xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                    What We Avoid
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Clarity also comes from knowing what interpretive approaches to reject.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {avoidances.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3 bg-background p-4 rounded-lg border border-border/50"
                    >
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="max-w-2xl mx-auto text-center"
              >
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
                  Ready to Study in Context?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Start with our recommended reading path for newcomers, or browse all teachings 
                  to find specific topics that interest you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/teachings?path=recommended"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-accent text-primary-foreground rounded-lg font-medium shadow-card hover:shadow-elevated transition-shadow"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Start the Reading Path
                  </a>
                  <a 
                    href="/teachings"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-lg font-medium border border-border/50 hover:bg-secondary/80 transition-colors"
                  >
                    Browse All Teachings
                  </a>
                </div>
              </motion.div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Methodology;
