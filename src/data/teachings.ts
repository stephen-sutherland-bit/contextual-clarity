// Mock data for teachings - this will later connect to your database

export interface Teaching {
  id: string;
  title: string;
  date: string;
  primaryTheme: string;
  secondaryThemes: string[];
  scriptures: string[];
  doctrines: string[];
  keywords: string[];
  questionsAnswered: string[];
  quickAnswer: string;
  fullContent: string;
  readingOrder?: number;
}

export const teachings: Teaching[] = [
  {
    id: "D-001",
    title: "Understanding the Covenants: Why Context Matters",
    date: "15-March-2025",
    primaryTheme: "Covenant Theology",
    secondaryThemes: ["CBS Methodology", "Mosaic Law", "New Covenant", "Hermeneutics"],
    scriptures: ["Jeremiah 31:31-34", "Hebrews 8:6-13", "Galatians 3:24-25", "Romans 7:1-6"],
    doctrines: ["Covenant Framework", "Law and Grace", "Fulfilment in Christ"],
    keywords: ["covenant", "old testament", "new testament", "law", "grace", "context", "bible study", "interpretation", "Moses", "Jesus"],
    questionsAnswered: [
      "What is the difference between the Old and New Covenant?",
      "Are Christians still under the Law of Moses?",
      "Why does understanding covenants matter for Bible study?",
      "When did the Mosaic Covenant end?"
    ],
    quickAnswer: "The Mosaic Covenant (Old Covenant) was a conditional agreement between God and Israel, governing their relationship through the Law given at Sinai. The New Covenant, prophesied in Jeremiah 31 and established through Christ, replaced it entirely at AD 70 when the Temple was destroyed. Christians today live under the New Covenant of grace, not the requirements of Mosaic Law. Understanding which covenant governs a passage is essential for proper biblical interpretation.",
    fullContent: "The full teaching content would go here...",
    readingOrder: 1
  },
  {
    id: "D-002",
    title: "The World of the Bible: Understanding Ancient Terminology",
    date: "22-March-2025",
    primaryTheme: "Biblical Language",
    secondaryThemes: ["CBS Methodology", "Contextual Interpretation", "Ancient Worldview"],
    scriptures: ["John 3:16", "Romans 1:8", "Colossians 1:6", "Matthew 24:14"],
    doctrines: ["Literal vs Symbolic", "Authorial Intent", "Historical Context"],
    keywords: ["world", "cosmos", "oikoumene", "terminology", "greek", "language", "meaning", "context", "audience"],
    questionsAnswered: [
      "What does 'the world' mean in the Bible?",
      "Did Jesus really mean the entire planet?",
      "How do I know when language is symbolic?",
      "Why do different translations use different words?"
    ],
    quickAnswer: "When biblical authors wrote 'the world' (Greek: kosmos or oikoumene), they typically meant the known world of their time—the Roman Empire and surrounding regions, or specifically the Jewish world. John 3:16's 'world' refers to the covenant community, not every individual on the planet. Understanding this prevents misapplication of texts meant for specific ancient audiences.",
    fullContent: "The full teaching content would go here...",
    readingOrder: 2
  },
  {
    id: "D-003",
    title: "Clouds of Judgement: Symbolic Language in Prophecy",
    date: "29-March-2025",
    primaryTheme: "Prophetic Literature",
    secondaryThemes: ["CBS Methodology", "Old Testament Background", "Symbolism", "Judgement"],
    scriptures: ["Matthew 24:30", "Daniel 7:13", "Isaiah 19:1", "Psalm 18:9-12", "Revelation 1:7"],
    doctrines: ["Literal vs Symbolic", "Fulfilment Horizon", "AD 70"],
    keywords: ["clouds", "coming", "judgement", "prophecy", "second coming", "parousia", "symbolic", "metaphor", "Daniel", "Matthew 24"],
    questionsAnswered: [
      "What do clouds mean in biblical prophecy?",
      "Is Jesus literally coming on clouds?",
      "When was Matthew 24 fulfilled?",
      "What happened in AD 70?"
    ],
    quickAnswer: "In Old Testament prophetic language, 'coming on clouds' consistently symbolises divine judgement, not physical travel. When God 'came' to Egypt (Isaiah 19:1), it described judgement through Assyria—not a literal cloud ride. Jesus used this same imagery in Matthew 24, prophesying judgement on Jerusalem, fulfilled in AD 70 when Rome destroyed the Temple. The original audience understood this symbolic language immediately.",
    fullContent: "The full teaching content would go here...",
    readingOrder: 3
  },
  {
    id: "D-004",
    title: "Who Are the Elect? Understanding Election in Context",
    date: "5-April-2025",
    primaryTheme: "Election & Calling",
    secondaryThemes: ["Covenant Theology", "Israel", "CBS Methodology", "Salvation"],
    scriptures: ["Matthew 24:22", "Romans 9:6-13", "1 Peter 2:9", "Isaiah 45:4", "Deuteronomy 7:6"],
    doctrines: ["Election", "Covenant Framework", "Corporate Identity"],
    keywords: ["elect", "chosen", "election", "predestination", "Israel", "church", "calling", "salvation", "remnant"],
    questionsAnswered: [
      "Who are 'the elect' in the Bible?",
      "Does God choose who gets saved?",
      "What is the relationship between Israel and the Church?",
      "Is election about individuals or groups?"
    ],
    quickAnswer: "Biblical 'election' primarily refers to God's choice of Israel as His covenant people (Deuteronomy 7:6), and later the faithful remnant within Israel who accepted Messiah. The 'elect' in Matthew 24 were Jewish Christians who fled Jerusalem before AD 70. Election in Scripture is primarily corporate (choosing a people for a purpose) rather than individual predestination to salvation or damnation.",
    fullContent: "The full teaching content would go here...",
    readingOrder: 4
  },
  {
    id: "D-005",
    title: "The Trinity Explained: Beyond Egg Analogies",
    date: "12-April-2025",
    primaryTheme: "Nature of God",
    secondaryThemes: ["Christology", "Theology Proper", "Church History"],
    scriptures: ["John 1:1-14", "Matthew 28:19", "2 Corinthians 13:14", "Colossians 2:9", "John 10:30"],
    doctrines: ["Trinity", "Deity of Christ", "Personhood of Spirit"],
    keywords: ["trinity", "God", "Jesus", "Holy Spirit", "one God", "three persons", "nature", "essence", "deity", "godhead"],
    questionsAnswered: [
      "What is the Trinity?",
      "Is the Trinity in the Bible?",
      "How can God be three and one?",
      "Why are egg/water analogies wrong?"
    ],
    quickAnswer: "The Trinity describes one God existing eternally as three distinct persons—Father, Son, and Spirit—sharing one divine essence. Common analogies (egg, water states, shamrock) actually teach heresy by suggesting God is either three parts or one being in three modes. The biblical witness shows the Father, Son, and Spirit interacting as distinct persons (Jesus praying to the Father, Spirit being sent) while each possessing full deity.",
    fullContent: "The full teaching content would go here...",
    readingOrder: 5
  },
  {
    id: "D-006",
    title: "Sin After the Cross: What Transgression Means Today",
    date: "19-April-2025",
    primaryTheme: "Hamartiology",
    secondaryThemes: ["Law and Grace", "New Covenant", "Christian Ethics"],
    scriptures: ["1 John 3:4", "Romans 4:15", "Romans 6:14", "Romans 7:7-12", "Galatians 5:18"],
    doctrines: ["Law vs Grace", "Definition of Sin", "New Covenant Ethics"],
    keywords: ["sin", "transgression", "law", "commandments", "grace", "freedom", "morality", "ethics", "obedience"],
    questionsAnswered: [
      "What is sin according to the Bible?",
      "Are Christians still sinners?",
      "If we're not under the Law, can we do anything?",
      "How should Christians live ethically?"
    ],
    quickAnswer: "Scripture defines sin as 'transgression of the Law' (1 John 3:4)—specifically the Mosaic Law given to Israel. Since that covenant ended at AD 70, Christians are not under Law but under grace (Romans 6:14). This doesn't mean anything goes; the New Covenant writes God's character on our hearts. Rather than external rule-following, we're called to walk by the Spirit, producing fruit that naturally aligns with God's nature.",
    fullContent: "The full teaching content would go here...",
    readingOrder: 6
  }
];

export const themes = [
  "Covenant Theology",
  "Biblical Language",
  "Prophetic Literature",
  "Election & Calling",
  "Nature of God",
  "Hamartiology",
  "CBS Methodology",
  "Law and Grace",
  "Christology",
  "Eschatology"
];

export const featuredQuestions = [
  "What is the difference between the Old and New Covenant?",
  "What does 'the world' mean in the Bible?",
  "What do clouds mean in biblical prophecy?",
  "Who are 'the elect' in the Bible?",
  "What is the Trinity?",
  "What is sin according to the Bible?",
  "When did the Mosaic Covenant end?",
  "Was Matthew 24 fulfilled?"
];
