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
import { cn } from '@/utils/utils';
import { useState } from 'react';
import { Loader2Icon, Mail, Sparkles } from 'lucide-react';

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
      className="relative py-32 md:py-40 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-color via-accent-color/90 to-background/50" />

      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-64 h-64 bg-primary rounded-full blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-80 h-80 bg-foreground rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      {/* Decorative grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                             linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-2 border border-foreground/20 bg-background/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-foreground" />
            <span className="text-sm uppercase tracking-widest text-foreground/90">
              Stay Updated
            </span>
          </div>

          {/* Heading */}
          <h2
            className={cn(
              'font-rubik-glitch text-[2.5rem] md:text-[5rem] lg:text-[6rem]',
              'leading-none mb-6',
              'text-foreground drop-shadow-lg'
            )}
          >
            Join Our Newsletter
          </h2>

          {/* Divider */}
          <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-foreground to-transparent mb-8" />

          {/* Description */}
          <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
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
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-foreground/60 transition-colors" />
                          <Input
                            placeholder="your@email.com"
                            {...field}
                            className={cn(
                              'h-14 pl-12 pr-4 text-lg',
                              'bg-background/10 backdrop-blur-sm',
                              'border-2 border-foreground/20',
                              'text-foreground placeholder:text-foreground/40',
                              'focus:border-foreground/40 focus:bg-background/20',
                              'transition-all duration-300'
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-foreground/90 bg-background/20 backdrop-blur-sm px-3 py-1 rounded mt-2" />
                    </FormItem>
                  )}
                />
                <Button
                  disabled={inFlight}
                  type="submit"
                  size="lg"
                  className={cn(
                    'h-14 px-10 text-lg font-medium',
                    'bg-foreground text-background',
                    'hover:bg-foreground/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]',
                    'transition-all duration-300',
                    'border-2 border-foreground/20',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'whitespace-nowrap'
                  )}
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
