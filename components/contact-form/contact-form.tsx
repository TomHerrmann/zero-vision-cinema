'use client';

import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Loader2Icon, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import contactEmailSchema, {
  ContactInbox,
} from '@/app/(frontend)/(schemas)/contactEmailSchema';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../ui/form';
import { toast } from 'sonner';

type Props = {
  /** Which ZVC inbox the message is emailed to. Defaults to info@. */
  inbox?: ContactInbox;
};

/**
 * Name / email / message form. Submissions are emailed to our inbox through
 * Resend and nothing is stored on our side; the sender's email is only used
 * as the reply-to so we can write back.
 */
export default function ContactForm({ inbox = 'info' }: Props) {
  const [inFlight, setInFlight] = useState(false);

  const form = useForm<z.infer<typeof contactEmailSchema>>({
    resolver: zodResolver(contactEmailSchema),
    defaultValues: {
      email: '',
      name: '',
      message: '',
      inbox,
    },
  });

  async function onSubmit(values: z.infer<typeof contactEmailSchema>) {
    setInFlight(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          credentials: 'include',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        toast.error('Email failed to send. Please try again later.');
        return;
      }

      form.reset();
      toast.success('Your message was sent!');
    } catch (err) {
      toast.error('Email failed to send. Please try again later.');
    } finally {
      setInFlight(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-6">
        <CardTitle>
          <h3 className="font-display uppercase text-glow text-2xl md:text-3xl mb-6">
            Send A Message
          </h3>
        </CardTitle>
        <CardDescription className="zvc-body text-base text-glow/60">
          Fill out the form below and we&apos;ll get back to you shortly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Your name"
                      {...field}
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="your@email.com"
                      {...field}
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your inquiry..."
                      {...field}
                      className="min-h-[160px] text-base resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={inFlight}
              size="lg"
              className="w-full text-lg disabled:opacity-50"
            >
              {inFlight ? (
                <Loader2Icon className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
