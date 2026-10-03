import { Closing } from "@/components/Closing";
import { Configurator } from "@/components/Configurator";
import { DayJourney } from "@/components/DayJourney";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Intro } from "@/components/Intro";
import { Manifesto } from "@/components/Manifesto";
import { Materials } from "@/components/Materials";

export default function Home() {
  return (
    <>
      <Intro />
      <Header />
      <main id="main">
        <Hero />
        <Manifesto />
        <DayJourney />
        <Materials />
        <Configurator />
        <Closing />
      </main>
    </>
  );
}
