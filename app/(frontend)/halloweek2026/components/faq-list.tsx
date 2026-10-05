import { ChevronDown } from 'lucide-react';

type Props = { faqs: { question: string; answer: string }[] };

/**
 * Native <details> accordion — open/close with no client JS, and every answer
 * stays findable by in-page search and screen readers.
 */
export default function FaqList({ faqs }: Props) {
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="group border-2 border-glow/15 bg-card open:border-blue-light/40 transition-colors"
        >
          <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 md:p-6">
            <h3 className="font-display uppercase text-xl md:text-2xl text-glow">
              {faq.question}
            </h3>
            <ChevronDown
              className="w-5 h-5 shrink-0 text-blue-light transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="zvc-body text-base md:text-lg leading-relaxed px-5 md:px-6 pb-5 md:pb-6">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
