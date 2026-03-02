import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Users, Target } from "lucide-react";
import { Helmet } from "react-helmet-async";

const About = () => {
  return (
    <>
      <Helmet>
        <title>About | The Berean Press</title>
        <meta 
          name="description" 
          content="Learn about The Berean Press and our mission to correct misinterpretations through Covenantal Contextual Methodology." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col texture-paper">
        <Header />
        <main className="flex-1">
          {/* Hero */}
          <section className="relative bg-gradient-hero py-16 md:py-24 border-b border-border/50 texture-leather">
            <div className="container px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl mx-auto text-center"
              >
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6 hero-text letterpress">
                  About The Berean Press
                </h1>
                <p className="text-lg md:text-xl hero-text-muted leading-relaxed">
                  Correcting misinterpretations through Covenantal Contextual Methodology—like the 
                  Bereans of Acts 17:11 who diligently searched the scriptures.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Mission */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <div className="max-w-3xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="prose-teaching"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold m-0">Our Mission</h2>
                  </div>
                  
                  <p className="text-lg leading-relaxed mb-6">
                    For too long, Christians have struggled with confusing explanations, 
                    contradictory teachings, and questions their pastors couldn't adequately 
                    answer. The problem isn't a lack of sincerity among teachers—it's that 
                    most have never been taught <em>how</em> or <em>why</em> to study the 
                    Bible with a contextual lens.
                  </p>

                  <p className="text-lg leading-relaxed mb-6">
                    The Berean Press exists to bridge that gap. We take theological 
                    content from The Christian Theologist—often from informal Bible studies 
                    full of tangents that make for rich discussion—and transform 
                    it into accessible, pedagogically sound teachings that work for complete 
                    newcomers and seasoned scholars alike.
                  </p>

                  <p className="text-lg leading-relaxed">
                    Our approach uses what educators call "invisible pedagogy"—scholarly terms 
                    are explained naturally within the text, complex concepts are reinforced 
                    through strategic repetition, and nothing is dumbed down. The result is 
                    teaching that respects both the reader's intelligence and their need for 
                    clear explanation.
                  </p>
                </motion.div>

                {/* What We Do */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="mt-16"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold">What We Teach</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-card p-6 rounded-xl border border-border/50">
                      <h3 className="font-heading font-semibold mb-2">Contextual Interpretation</h3>
                      <p className="text-muted-foreground text-sm">
                        Every passage in its original historical, cultural, and covenantal setting—the 
                        way the first readers would have understood it.
                      </p>
                    </div>
                    <div className="bg-card p-6 rounded-xl border border-border/50">
                      <h3 className="font-heading font-semibold mb-2">Fulfilled Prophecy</h3>
                      <p className="text-muted-foreground text-sm">
                        Understanding that Jesus' prophecies in Matthew 24 and Revelation found their 
                        fulfilment in AD 70—not in newspaper headlines.
                      </p>
                    </div>
                    <div className="bg-card p-6 rounded-xl border border-border/50">
                      <h3 className="font-heading font-semibold mb-2">Covenant Clarity</h3>
                      <p className="text-muted-foreground text-sm">
                        Distinguishing properly between the Mosaic and New Covenants, understanding 
                        what applies to whom and when.
                      </p>
                    </div>
                    <div className="bg-card p-6 rounded-xl border border-border/50">
                      <h3 className="font-heading font-semibold mb-2">Accessible Depth</h3>
                      <p className="text-muted-foreground text-sm">
                        Teaching that never sacrifices scholarly rigour for accessibility—you get 
                        both, invisibly woven together.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Who We Are */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="mt-16"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold">Who We Are</h2>
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    These teachings emerge from weekly informal Bible studies led by 
                    Jim of The Christian Theologist—whānau (family) discussions where 
                    questions are explored, tangents become insights, and the unthought-of 
                    ideas which most people would see as being of no value, often contain 
                    the most valuable pedagogical gems.
                  </p>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We use New Zealand English (judgement, fulfilment, honour) and 
                    occasionally integrate te reo Māori (Māori Language) where it enriches understanding. 
                    Our heart is for the Aotearoa (NZ) context while serving readers worldwide.
                  </p>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="mt-16 p-8 bg-secondary/30 rounded-2xl text-center"
                >
                  <h3 className="font-heading font-semibold text-xl mb-3">
                    Want More From The Christian Theologist?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    For regular in-depth studies directly from Jim, subscribe to his Substack.
                  </p>
                  <Button variant="hero" asChild>
                    <a 
                      href="https://christiantheologist.substack.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Visit Substack
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </motion.div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default About;
