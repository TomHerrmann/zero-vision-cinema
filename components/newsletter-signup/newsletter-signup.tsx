'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components//ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import subscribeSchema from '@/app/(frontend)/(schemas)/subscribeSchema';
import { useState } from 'react';
import { Loader2Icon, Mail } from 'lucide-react';

export function NewsletterSignup() {
  const [inFlight, setInFlight] = useState(false);

  const form = useForm<z.infer<typeof subscribeSchema>>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof subscribeSchema>) {
    setInFlight(true);
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          credentials: 'include',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        toast.error('Subscription failed. Please try again later.');
      }

      toast.success('You have been subscribed to our newsletter.');
      form.reset();
    } catch (err) {
      toast.error('Failed to subscribe. Please try again later.');
    }
    setInFlight(false);
  }

  return (
    <section
      id="newsletter"
      className="relative pt-24 md:pt-32 pb-16 md:pb-20 overflow-hidden bg-blackout"
    >
      {/* Blue riso wash + texture */}
      <div className="absolute inset-0 bg-blue-light/10 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 zvc-halftone pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 zvc-grain pointer-events-none" aria-hidden="true" />

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

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
              <div className="flex flex-col md:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-glow/40 group-focus-within:text-blue-light transition-colors" />
                          <Input
                            placeholder="your@email.com"
                            {...field}
                            className="h-14 pl-12 pr-4 text-lg"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-glow/90 bg-blackout/60 px-3 py-1 mt-2" />
                    </FormItem>
                  )}
                />
                <Button
                  disabled={inFlight}
                  type="submit"
                  size="lg"
                  className="h-14 px-10 text-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {inFlight ? (
                    <Loader2Icon className="w-5 h-5 animate-spin" />
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Privacy notice */}
          <p className="text-center text-sm text-foreground/60 mt-6">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
