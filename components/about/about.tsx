import { MapPin, Heart, Film } from 'lucide-react';
import SectionHeading from '../ui/section-heading';

const FEATURES = [
  {
    icon: MapPin,
    title: 'Pop-Up Venues',
    body: 'Bringing cinema to unique locations across New York City, from intimate bars to vibrant block parties.',
  },
  {
    icon: Film,
    title: 'Curated Selection',
    body: "Underground favorites, hidden gems, and genre-defining films you won't find in mainstream theaters.",
  },
  {
    icon: Heart,
    title: 'Community Focused',
    body: 'We foster a welcoming community of film enthusiasts, creators, and anyone who loves a good movie.',
  },
];

// Film-sprocket perforation strip (deterministic, pure CSS)
const sprocket = {
  backgroundImage:
    'repeating-linear-gradient(90deg, var(--color-blue-light) 0 14px, transparent 14px 34px)',
  backgroundSize: '34px 10px',
  backgroundRepeat: 'repeat-x',
  backgroundPosition: 'center',
  opacity: 0.35,
};

export default function About() {
  return (
    <section id="about" className="relative py-28 md:py-36 overflow-hidden bg-card">
      {/* Sprocket dividers */}
      <div className="absolute top-6 left-0 right-0 h-2.5" style={sprocket} aria-hidden="true" />
      <div className="absolute bottom-6 left-0 right-0 h-2.5" style={sprocket} aria-hidden="true" />
      {/* Texture */}
      <div className="absolute inset-0 zvc-grain pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
        <SectionHeading kicker="Our Story" title="About Us" className="mb-16" />

        <div className="space-y-12">
          <p className="zvc-body text-2xl md:text-3xl lg:text-4xl text-center leading-relaxed text-glow/90 max-w-4xl mx-auto">
            Zero Vision Cinema screens films at venues throughout NYC, from bars
            and breweries to block parties. We curate a selection of{' '}
            <span className="text-blue-light">niche movies</span>,{' '}
            <span className="text-blue-light">genre films</span>, and{' '}
            <span className="text-blue-light">cult classics</span>.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="zvc-card p-8">
                <div className="zvc-icon-frame w-14 h-14 mb-6">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-display uppercase text-glow text-2xl mb-3">
                  {title}
                </h3>
                <p className="zvc-body text-glow/60 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center pt-12">
            <p className="zvc-body text-lg md:text-xl text-glow/70 mb-6">
              Interested in hosting a screening at your venue or event?
            </p>
            <a href="#contact" className="zvc-btn text-lg py-4">
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
