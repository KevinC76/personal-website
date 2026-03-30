import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Tools from "@/components/Tools";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <div className="max-w-screen-2xl mx-auto w-full px-6">
        <Hero />
        <Tools />
      </div>
      {/* Full viewport width — black bg */}
      <Projects />
      <div className="max-w-screen-2xl mx-auto w-full px-6">
        <Contact />
      </div>
      <Footer />
    </>
  );
}
