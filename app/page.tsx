import Header from "@/components/sections/Header";
import Hero from "@/components/landingpage/Hero";
import HowItWorks from "@/components/landingpage/HowItWorks";
import WhyWellOra from "@/components/landingpage/WhyWellOra";
import DownloadApp from "@/components/landingpage/DownloadApp";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <WhyWellOra />
        <DownloadApp />
      </main>
    </>
  );
}
