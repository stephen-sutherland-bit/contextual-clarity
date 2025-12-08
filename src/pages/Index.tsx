import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedQuestions from "@/components/FeaturedQuestions";
import MethodologyPreview from "@/components/MethodologyPreview";
import RecommendedPath from "@/components/RecommendedPath";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>The Christian Theologist | Contextual Bible Study</title>
        <meta 
          name="description" 
          content="Discover biblical teachings where context is king. Sound exegesis and CBS methodology making ancient Scripture accessible. Answers your pastor couldn't explain." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <FeaturedQuestions />
          <MethodologyPreview />
          <RecommendedPath />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
