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
import {
  Film,
  Loader2Icon,
  PersonStanding,
  Projector,
  Video,
  Send,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/utils/utils';
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
          credentials: 'include',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        toast.error('Email failed to send. Please try again later.');
      }

      form.reset();
      toast.success('Your message was sent!');
      setInFlight(false);
      return;
    } catch (err) {
      toast.error('Email failed to send. Please try again later.');
      setInFlight(false);
      return;
    }
  }

  return (
    <section
      id="contact"
      className="relative py-32 md:py-40 overflow-hidden bg-gradient-to-b from-background via-foreground/5 to-background"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at center, oklch(0.987 0.026 102.212) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 border border-primary/20 bg-background/80 backdrop-blur-sm">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-sm uppercase tracking-widest text-foreground/70">
              Get In Touch
            </span>
          </div>

          <h2
            className={cn(
              'font-rubik-glitch text-[2.5rem] md:text-[5rem] lg:text-[6rem]',
              'leading-none mb-6',
              'bg-gradient-to-b from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent'
            )}
          >
            Contact Us
          </h2>

          <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent mb-8" />

          <p className="text-xl md:text-2xl text-foreground/70 max-w-3xl mx-auto">
            We'd love to hear from you. Whether you have a question, suggestion,
            or want to collaborate.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left side - Info */}
          <div className="space-y-12">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">
                Why Reach Out?
              </h3>
              <ul className="space-y-4">
                {[
                  {
                    icon: Film,
                    text: 'You Have A Suggestion For A Film',
                  },
                  {
                    icon: Video,
                    text: "You're a Filmmaker Looking to Screen Your Movie",
                  },
                  {
                    icon: PersonStanding,
                    text: 'You Want To Know How To Get Involved',
                  },
                  {
                    icon: Projector,
                    text: 'You Want to Host Private Events or Public Screenings',
                  },
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="group flex items-start gap-4 p-4 border border-primary/10 bg-background/30 backdrop-blur-sm hover:border-primary/30 hover:bg-background/50 transition-all duration-300"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-lg text-foreground/80 leading-relaxed">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional info */}
            <div className="p-8 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm">
              <h4 className="text-xl font-semibold mb-4 text-foreground">
                Quick Response
              </h4>
              <p className="text-foreground/70 leading-relaxed">
                We typically respond within 24-48 hours. For urgent inquiries
                about upcoming events, please mention it in your message.
              </p>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="lg:sticky lg:top-8">
            <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/5">
              <CardHeader className="pb-6">
                <CardTitle>
                  <h3 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">
                    Send A Message
                  </h3>
                </CardTitle>
                <CardDescription className="text-base text-foreground/60">
                  Fill out the form below and we'll get back to you shortly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Your name"
                              {...field}
                              className="h-12 text-base bg-background/50 border-primary/20 focus:border-primary/40"
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
                              className="h-12 text-base bg-background/50 border-primary/20 focus:border-primary/40"
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
                              className="min-h-[160px] text-base bg-background/50 border-primary/20 focus:border-primary/40 resize-none"
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
                      className={cn(
                        'w-full h-12 text-lg font-medium',
                        'bg-primary text-primary-foreground',
                        'hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]',
                        'transition-all duration-300',
                        'border border-primary/20',
                        'disabled:opacity-50'
                      )}
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
          </div>
        </div>
      </div>
    </section>
  );
}
