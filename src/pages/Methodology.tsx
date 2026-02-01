import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  XCircle,
  AlertTriangle,
  Train,
  Globe,
  FileText,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const principles = [
  {
    icon: BookMarked,
    title: "Covenantal Location",
    description: "Every passage belongs to a specific covenant context. Identifying whether a text operates under the Mosaic Covenant or the New Covenant is the first and most crucial interpretive step. This determines everything—audience, obligations, promises, and application.",
    example: "When James writes 'faith without works is dead' (James 2:26), he's addressing Judean believers still under Mosaic obligations. This isn't a universal formula for salvation but an intra-covenantal exhortation to his specific audience."
  },
  {
    icon: ScrollText,
    title: "Instrumental Mode",
    description: "Each covenant operated with a different 'instrumental mode'—HOW it functioned. The Mosaic Covenant was material, external, and national: physical temple, animal sacrifices, ethnic identity, land promises. The New Covenant is spiritual, internal, and universal: hearts as temples, Christ's once-for-all sacrifice, faith identity, heavenly inheritance.",
    example: "Under Moses, blessing meant rain, crops, and victory in battle (Deuteronomy 28). Under Christ, we are blessed 'with every spiritual blessing in the heavenly places' (Ephesians 1:3). Same God, different instrumental mode."
  },
  {
    icon: Target,
    title: "Authorial Intent & Audience",
    description: "The meaning of a text is what the original author intended to communicate to his original audience. We seek to understand what they would have understood, not what we want it to mean today. Every New Testament letter had specific recipients facing specific circumstances.",
    example: "When Paul wrote to the Corinthians about 'the present distress' (1 Corinthians 7:26), he was addressing an imminent crisis his readers faced—not giving timeless marriage advice divorced from its historical context."
  },
  {
    icon: Eye,
    title: "Literal vs Symbolic Language",
    description: "Ancient literature uses symbolic and metaphorical language that would have been immediately understood by its original audience. 'Clouds' symbolise divine judgement, 'stars falling' represent authorities being overthrown, 'world' often means the known world or covenant community—not the entire planet.",
    example: "Isaiah 19:1 describes God 'riding on a swift cloud' to judge Egypt—fulfilled through the Assyrian invasion, not a literal cloud chariot. Jesus uses the same imagery in Matthew 24:30 for the judgement on Jerusalem."
  },
  {
    icon: History,
    title: "The Imminent Horizon",
    description: "Jesus' prophecies in Matthew 24 and the book of Revelation had a first-century fulfilment. When Jesus said 'this generation will not pass away until all these things take place' (Matthew 24:34), he meant the generation standing before him. AD 70—when Rome destroyed Jerusalem and the Temple—was the 'end of the age': the end of the Mosaic Covenant age, not the end of planet Earth.",
    example: "The 'great tribulation' Jesus described (Matthew 24:21) matches Josephus's account of Jerusalem's destruction. Over one million Judeans perished. The disciples' question was about the Temple's destruction, which Jesus answered directly."
  },
  {
    icon: Scale,
    title: "Law vs Grace",
    description: "The Mosaic Law was given to Israel as part of their covenant with God. Sin, biblically defined as 'transgression of the Law' (1 John 3:4), applied under that covenant. Christians are not under Law but under grace, led by the Spirit who writes God's character on our hearts. We don't need external rules because we have internal transformation.",
    example: "Romans 6:14 explicitly states we are 'not under law but under grace.' This doesn't mean anything goes—the Spirit produces fruit that naturally aligns with God's nature (Galatians 5:22–23)."
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

const diagnosticQuestions = [
  {
    question: "Which covenant governs this passage?",
    description: "Is this Mosaic instruction, New Covenant teaching, or Transition Literature written during the overlap?"
  },
  {
    question: "Who is the original audience?",
    description: "Judean believers? Gentile converts? A mixed congregation? The answer shapes application."
  },
  {
    question: "What is the instrumental mode?",
    description: "Is this operating in the material/external realm (Mosaic) or spiritual/internal realm (New Covenant)?"
  },
  {
    question: "Where are we in covenant history?",
    description: "Before AD 30? During the Transition (AD 30–70)? After the Mosaic age ended?"
  },
  {
    question: "What is the fulfilment horizon?",
    description: "Did the original audience expect imminent fulfilment? Do time-indicators point to their generation?"
  }
];

const Methodology = () => {
  return (
    <>
      <Helmet>
        <title>CCM Methodology | The Berean Press</title>
        <meta 
          name="description" 
          content="Learn the Covenantal Contextual Methodology (CCM). Context is king—interpret Scripture in its original historical, cultural, and covenantal setting." 
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
                  Covenantal Contextual Methodology
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Most confusion in biblical interpretation comes from reading ancient texts 
                  through modern lenses. CCM places every passage in its proper 
                  historical and covenantal context—the way the original audience would have 
                  understood it.
                </p>
              </motion.div>
            </div>
          </section>

          {/* The Core Problem: Covenantal Mislocation */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-6">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                    The Core Problem: Covenantal Mislocation
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Why so much of modern Christianity feels confusing, contradictory, or burdensome.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card variant="elevated">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Train className="h-7 w-7 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-heading font-semibold mb-4">
                            The Steam Locomotive Analogy
                          </h3>
                          <p className="text-muted-foreground mb-4 leading-relaxed">
                            Imagine a train engineer in 2025 reading an operating manual from 1895. The 
                            manual tells him to shovel coal into the firebox, watch the steam pressure gauge, 
                            and oil the pistons regularly. He follows these instructions faithfully—but his 
                            train is a diesel locomotive. The manual is excellent, accurate, and authoritative. 
                            It's just not written for his engine.
                          </p>
                          <p className="text-muted-foreground mb-4 leading-relaxed">
                            <strong className="text-foreground">This is covenantal mislocation:</strong> taking 
                            instructions, warnings, and promises given under one covenant and applying them to 
                            people living under a different covenant. The commands are genuinely from God. They 
                            were genuinely binding—<em>on their original audience, under their original covenant</em>.
                          </p>
                          <p className="text-muted-foreground leading-relaxed">
                            Most interpretive confusion in the church today stems from reading Mosaic Covenant 
                            instructions as if they were written for New Covenant believers—or misunderstanding 
                            New Testament letters written during the transition period (AD 30–70) as if they 
                            were written after that transition was complete.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>

          {/* The Two Covenants: Different Modes of Operation */}
          <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  The Two Covenants: Different Instrumental Modes
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Same God, different operating systems. Understanding HOW each covenant functioned 
                  transforms our reading of Scripture.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card variant="elevated" className="h-full">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                          <Scale className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-xl font-heading font-semibold">Mosaic Covenant</h3>
                          <p className="text-sm text-muted-foreground">Israel as Nation-State</p>
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {[
                          "Material blessings: land, rain, crops, livestock",
                          "External observances: Sabbath, festivals, dietary laws",
                          "National identity: ethnic Israel, physical borders",
                          "Physical temple: God's presence in one location",
                          "Priesthood mediating: access to God through Levites",
                          "Written constitution: Torah as national law code"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Card variant="elevated" className="h-full border-primary/30">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Globe className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-heading font-semibold">New Covenant</h3>
                          <p className="text-sm text-muted-foreground">Global Whānau (Family)</p>
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {[
                          "Spiritual blessings: every blessing in heavenly places",
                          "Internal transformation: Spirit writes on hearts",
                          "Universal identity: neither Judean nor Greek",
                          "Hearts as temples: God's presence within each believer",
                          "Direct access: no human mediator required",
                          "Law of Christ: love written on the heart"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Reading the NT as Transition Literature */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                    Reading the New Testament as Transition Literature
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    This single insight transforms how we read the entire New Testament.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card variant="elevated">
                    <CardContent className="p-6 md:p-8">
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        The New Testament was written between approximately AD 30 and AD 70—<strong className="text-foreground">during 
                        the Mosaic age</strong>, not after it ended. This means every letter, every instruction, 
                        every warning was written while the Temple still stood, while Mosaic sacrifices were 
                        still being offered, and while Jewish believers still participated in Jewish customs.
                      </p>
                      
                      <div className="bg-highlight-soft rounded-lg p-5 mb-6">
                        <h4 className="font-heading font-semibold mb-3 flex items-center gap-2">
                          <Train className="h-5 w-5 text-primary" />
                          The Passport Transition Analogy
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Imagine a country undergoing a transition from monarchy to democracy. For 40 years, 
                          both systems coexist: the old king still reigns, but the new parliament is growing 
                          in authority. Citizens during this period hold dual passports. Documents from this 
                          era reflect both systems—some instructions apply under royal decree, others under 
                          parliamentary law, and some to both.
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                          The New Testament is "transition literature"—written when both Mosaic and New 
                          Covenants were valid, before the old one was made obsolete in AD 70. Instructions 
                          that seem contradictory often resolve when we ask: "Which covenant is this addressing?"
                        </p>
                      </div>

                      <h4 className="font-heading font-semibold mb-3">Implications for Interpretation</h4>
                      <ul className="space-y-2">
                        {[
                          "Paul's letters to Jewish believers may include instructions valid only during the transition",
                          "Warnings about 'falling away' often address apostasy to Judaism, not modern backsliding",
                          "References to 'the end' and 'the coming day' pointed to AD 70, not a distant future",
                          "Instructions about relations between Jewish and Gentile believers addressed temporary tensions"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>

          {/* The Imminent Horizon */}
          <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container px-4">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                    <History className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                    The Imminent Horizon: AD 70 as Covenant Eschaton
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    The "end times" already happened—to the generation Jesus addressed.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card variant="elevated">
                    <CardContent className="p-6 md:p-8">
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        When the disciples asked Jesus about the Temple's destruction and "the end of the age" 
                        (Matthew 24:3), they weren't asking about the end of planet Earth. The Greek 'aion' 
                        means "age" or "era"—they were asking about the end of the Temple era, the Mosaic age.
                      </p>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        Jesus answered their question directly: <em>"Truly, I say to you, this generation will 
                        not pass away until all these things take place"</em> (Matthew 24:34). He gave them 
                        signs to watch for—and those signs were fulfilled between AD 66–70 when Rome besieged 
                        and destroyed Jerusalem.
                      </p>

                      <div className="bg-highlight-soft rounded-lg p-5">
                        <h4 className="font-heading font-semibold mb-3">What AD 70 Accomplished</h4>
                        <ul className="space-y-2">
                          {[
                            "The Temple destroyed: God no longer 'dwelt' in a building—His presence is in His people",
                            "Mosaic sacrifices ended permanently: Christ's sacrifice was 'once for all'",
                            "The 'old covenant' made obsolete: 'ready to vanish away' (Hebrews 8:13) finally vanished",
                            "The 'last days' of the Mosaic age concluded: we live in the ongoing New Covenant age",
                            "Judgement on unfaithful Israel completed: the covenant curses of Deuteronomy 28 fulfilled"
                          ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>

          {/* 5 Diagnostic Questions */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                  <HelpCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  How This Changes Our Reading: 5 Diagnostic Questions
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Before applying any passage, ask these five questions.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {diagnosticQuestions.map((item, index) => (
                  <motion.div
                    key={item.question}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card variant="elevated" className="h-full">
                      <CardContent className="p-5">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <span className="text-lg font-bold text-primary">{index + 1}</span>
                        </div>
                        <h3 className="font-heading font-semibold mb-2 text-lg">
                          {item.question}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Core Principles */}
          <section className="py-16 md:py-24 bg-secondary/30">
            <div className="container px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                  Core Principles in Detail
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

          {/* The Result: Clarity, Coherence, and Consolation */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                    The Result: Clarity, Coherence, and Consolation
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    What changes when we read Scripture in its covenantal context?
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card variant="elevated">
                    <CardContent className="p-6 md:p-8">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-heading font-semibold mb-3 text-lg">Clarity</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Passages that once seemed contradictory resolve when we identify the covenant 
                            context. "Work out your salvation with fear" (Philippians 2:12) no longer 
                            contradicts "by grace through faith" when we understand Paul's audience and situation.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-heading font-semibold mb-3 text-lg">Coherence</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            The Bible becomes one coherent story: God's covenant with Israel served its 
                            purpose and gave way to the New Covenant for all peoples. The story has a 
                            beginning, middle, and resolution—not an open-ended wait for a future finale.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-heading font-semibold mb-3 text-lg">Consolation</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            The burden lifts when we realise we're not waiting for God to act—He already 
                            has. We're not trying to earn favour under Law—we're resting in grace. We're 
                            not bracing for judgement—judgement came in AD 70. We live in the accomplished kingdom.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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
                  Start with our Foundations phase for newcomers, or browse all teachings 
                  to find specific topics that interest you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/teachings?phase=foundations"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-accent text-primary-foreground rounded-lg font-medium shadow-card hover:shadow-elevated transition-shadow"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Start with Foundations
                  </Link>
                  <Link 
                    to="/teachings"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-lg font-medium border border-border/50 hover:bg-secondary/80 transition-colors"
                  >
                    Browse All Teachings
                  </Link>
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
