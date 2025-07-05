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
import { Rubik_Glitch } from 'next/font/google';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

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
      className="flex flex-col justify-center items-center rounded-none border-none bg-sky-900 p-12 w-full text-center px-8"
    >
      <div className="w-full md:w-2/3">
        <h2
          className={cn(
            'text-[2.5rem] md:text-[4rem] font-semibold mb-12',
            rubikGlitchFont.className
          )}
        >
          Join Our Newsletter
        </h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 flex flex-wrap w-full justify-center"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full md:w-1/2">
                  <FormControl>
                    <Input placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={inFlight}
              className="w-full md:w-1/ lg:w-1/5 mx-4"
              type="submit"
            >
              {inFlight ? <Loader2Icon className="animate-spin" /> : <></>}
              Subscribe
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
