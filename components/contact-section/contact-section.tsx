import {
  Film,
  PersonStanding,
  Projector,
  Video,
  MessageCircle,
} from "lucide-react";
import SectionHeading from "../ui/section-heading";
import ContactForm from "../contact-form/contact-form";

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="relative pt-16 md:pt-20 pb-28 md:pb-36 overflow-hidden bg-blackout"
    >
      {/* Texture */}
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="mb-20">
          <SectionHeading
            kicker="Get In Touch"
            title="Contact Us"
            icon={MessageCircle}
          />
          <p className="zvc-body text-xl md:text-2xl text-glow/70 max-w-3xl mx-auto text-center mt-8">
            We&apos;d love to hear from you. Whether you have a question,
            suggestion, or want to collaborate.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left side - Info */}
          <div className="space-y-12">
            <div>
              <h3 className="font-display uppercase text-glow text-2xl md:text-3xl mb-6">
                Why Reach Out?
              </h3>
              <ul className="space-y-4">
                {[
                  {
                    icon: Film,
                    text: "You Have A Suggestion For A Film",
                  },
                  {
                    icon: Video,
                    text: "You're a Filmmaker Looking to Screen Your Movie",
                  },
                  {
                    icon: PersonStanding,
                    text: "You Want To Know How To Get Involved",
                  },
                  {
                    icon: Projector,
                    text: "You Want to Host Private Events or Public Screenings",
                  },
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="group flex items-start gap-4 p-4 border-2 border-glow/10 bg-card hover:border-blue-light/40 transition-colors duration-300"
                  >
                    <div className="zvc-icon-frame w-10 h-10 flex-shrink-0 mt-1">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <p className="zvc-body text-lg text-glow/80 leading-relaxed">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional info */}
            <div className="zvc-card p-8">
              <h4 className="font-display uppercase text-glow text-xl mb-4">
                Quick Response
              </h4>
              <p className="zvc-body text-glow/70 leading-relaxed">
                We typically respond within 24-48 hours. For urgent inquiries
                about upcoming events, please mention it in your message.
              </p>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="lg:sticky lg:top-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
