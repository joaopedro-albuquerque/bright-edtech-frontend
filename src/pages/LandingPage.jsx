import Header from '../components/Header';
import Hero from '../components/Hero';
import Feature from '../components/Feature';
import Team from '../components/Team';
import TechStack from '../components/TechStack';
import Metrics from '../components/Metrics';
import Footer from '../components/Footer';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Header />
      <main>
        <section id="hero">
          <Hero />
        </section>
        <section id="feature">
          <Feature />
        </section>
        <section id="team">
          <Team />
        </section>
        <section id="tech">
          <TechStack />
        </section>
        <section id="metrics">
          <Metrics />
        </section>
      </main>
      <Footer />
    </div>
  );
}