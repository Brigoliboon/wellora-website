import Header from "@/components/sections/Header";
import Hero from "@/components/landingpage/Hero";
import HowItWorks from "@/components/landingpage/HowItWorks";
import WhyWellOra from "@/components/landingpage/WhyWellOra";
import Experts from "@/components/landingpage/Experts";
import DownloadApp from "@/components/landingpage/DownloadApp";
import Faq from "@/components/landingpage/Faq";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <WhyWellOra />
        <Experts />
        <DownloadApp />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
