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
import { cn } from '@/utils/utils';

type Props = {
  /** Per-page skinning of the email field / submit button (e.g. AHC legacy) */
  inputClassName?: string;
  buttonClassName?: string;
};

/**
 * Email signup form + privacy note, posting to /api/subscribe. Shared by the
 * homepage newsletter section and the Astoria Horror Club page, which wrap it
 * in their own section styling.
 */
export function NewsletterSignupForm({ inputClassName, buttonClassName }: Props) {
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
        return;
      }

      toast.success('You have been subscribed to our newsletter.');
      form.reset();
    } catch (err) {
      toast.error('Failed to subscribe. Please try again later.');
    } finally {
      setInFlight(false);
    }
  }

  return (
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
                        className={cn('h-14 pl-12 pr-4 text-lg', inputClassName)}
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
              className={cn(
                'h-14 px-10 text-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
                buttonClassName
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
  );
}
