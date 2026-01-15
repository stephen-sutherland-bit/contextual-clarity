import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedQuestions from "@/components/FeaturedQuestions";
import MethodologyPreview from "@/components/MethodologyPreview";
import PhaseOverview from "@/components/PhaseOverview";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>The Berean Press | Contextual Bible Study</title>
        <meta 
          name="description" 
          content="Correcting misinterpretations through Covenantal Contextual Methodology. Sound exegesis making ancient Scripture accessible. Answers your pastor couldn't explain." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <FeaturedQuestions />
          <MethodologyPreview />
          <PhaseOverview />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;