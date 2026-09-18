import { Mail } from 'lucide-react';
import { NewsletterSignupForm } from './newsletter-signup-form';

export function NewsletterSignup() {
  return (
    <section
      id="newsletter"
      className="relative pt-24 md:pt-32 pb-16 md:pb-20 overflow-hidden bg-blackout"
    >
      {/* Blue riso wash + texture */}
      <div
        className="absolute inset-0 bg-blue-light/10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 zvc-halftone pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
        <div className="flex flex-col items-center text-center mb-12">
          {/* Badge */}
          <span className="zvc-badge mb-8">
            <Mail className="w-4 h-4" aria-hidden="true" />
            Stay Updated
          </span>

          {/* Heading */}
          <h2 className="zvc-heading text-[2.75rem] md:text-[5rem] lg:text-[6rem] mb-6">
            Join Our Newsletter
          </h2>

          {/* Divider */}
          <span className="zvc-rule mb-8" aria-hidden="true" />

          {/* Description */}
          <p className="zvc-body text-xl md:text-2xl text-glow/80 max-w-2xl mx-auto leading-relaxed">
            Get updates on upcoming screenings, special events, and cult film
            recommendations delivered to your inbox.
          </p>
        </div>

        <NewsletterSignupForm />
      </div>
    </section>
  );
}
