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
import { Label } from '../ui/label';
import {
  Film,
  Loader2Icon,
  PersonStanding,
  Projector,
  Video,
} from 'lucide-react';
import { Rubik_Glitch } from 'next/font/google';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import contactEmailSchema from '@/app/(frontend)/(schemas)/contactEmailSchema';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../ui/form';
import { toast } from 'sonner';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

export default function ContactSection() {
  const [inFlight, setInFlight] = useState(false);

  const form = useForm<z.infer<typeof contactEmailSchema>>({
    resolver: zodResolver(contactEmailSchema),
    defaultValues: {
      email: '',
      name: '',
      message: '',
    },
  });

  async function onSubmit(values: z.infer<typeof contactEmailSchema>) {
    setInFlight(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        toast.error('Email failed to send. Please try again later.');
      }

      form.reset();
      toast.success('Your message was sent!');
    } catch (error) {
      toast.error('Email failed to send. Please try again later.');
    }
    setInFlight(false);
  }

  return (
    <section className="flex flex-col md:flex-row md:flex-wrap w-full gap-12 md:gap-20 justify-center items-start rounded-none border-none bg-yellow-50 text-stone-900 p-2 md:p-12">
      <div className="flex flex-col justify-start text-center w-full md:w-1/2">
        <h2
          className={cn(
            'text-[2.5rem] md:text-[4rem] font-semibold mb-4',
            rubikGlitchFont.className
          )}
        >
          Contact Us
        </h2>
        <p className="text-center text-xl p-4 md:p-8">
          We'd love to hear from you. Just fill out the email form on this page
          and we'll get back to you as soon as we can.
        </p>
        <ul className="md:w-9/10 text-sm md:text-lg text-start space-y-2 py-2 md:py-0 md:mx-8">
          <li className="flex">
            <Film className="mx-3" />
            You Have A Suggestion For A Film
          </li>
          <li className="flex">
            <Video className="mx-3" />
            You're a Filmmaker Looking to Screen Your Movie
          </li>
          <li className="flex">
            <PersonStanding className="mx-3" />
            You Want To Know How To Get Involved
          </li>
          <li className="flex">
            <Projector className="mx-3" />
            You Want to Host Private Events or Public Screenings
          </li>
        </ul>
      </div>
      <Card className="max-w-2xl shadow-lg border w-full md:w-1/3">
        <CardHeader>
          <CardTitle>
            <h3
              className={cn(
                'text-[1.5rem] md:text-[2.5rem] font-semibold mb-4',
                rubikGlitchFont.className
              )}
            >
              Send An Email
            </h3>
          </CardTitle>
          <CardDescription>
            Send us a message and we’ll get back to you shortly.
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
                      <Input placeholder="Your name" {...field} />
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
                      <Input placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="h-50">
                    <FormControl>
                      <Textarea
                        placeholder="Write us a message and we'll get back to you"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={inFlight} className="w-full">
                {inFlight ? <Loader2Icon className="animate-spin" /> : <></>}
                Submit
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
