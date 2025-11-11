'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Mail, Calendar, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const paymentIntent = searchParams.get('payment_intent');

  useEffect(() => {
    if (!paymentIntent) {
      setStatus('error');
      return;
    }

    // Verify payment status with Stripe
    const verifyPayment = async () => {
      try {
        const response = await fetch(
          `/api/stripe/verify-payment?payment_intent=${paymentIntent}`
        );
        const data = await response.json();

        if (data.status === 'succeeded') {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [paymentIntent]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-foreground/70 text-lg animate-pulse">
            Confirming your purchase...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-background/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-destructive/10 border-2 border-destructive/30 p-8 md:p-10 text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-destructive/30">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-rubik-glitch text-2xl md:text-3xl mb-3 text-foreground">
            PAYMENT VERIFICATION FAILED
          </h1>
          <p className="text-foreground/60 mb-8 leading-relaxed">
            We couldn't verify your payment. If you were charged, please contact
            support.
          </p>
          <div className="space-y-3">
            <Link href="/events">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
                Return to Events
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-background/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-primary/10 border-2 border-primary/20 p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/30 shadow-lg shadow-green-500/20">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-rubik-glitch text-2xl md:text-3xl mb-3 text-foreground leading-none">
            PURCHASE SUCCESSFUL!
          </h1>
          <p className="text-foreground/60 leading-relaxed">
            Thank you for your purchase. Your tickets have been confirmed.
          </p>
        </div>

        <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-5 mb-5 backdrop-blur-sm shadow-lg shadow-primary/5">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Check Your Email
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                We've sent your tickets and order confirmation to your email
                address. Please check your inbox (and spam folder).
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background/30 border-2 border-primary/10 rounded-xl p-5 mb-8 backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-foreground/70 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What's Next?
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Save your tickets to your phone or print them. Present them at
                the venue entrance on the day of the event.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/events" className="block">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 font-semibold">
              Browse More Events
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button
              variant="outline"
              className="w-full border-primary/20 hover:bg-primary/10 hover:border-primary/30 text-foreground transition-all duration-300"
            >
              Return to Home
            </Button>
          </Link>
        </div>

        <p className="text-xs text-foreground/40 text-center mt-6 font-mono">
          Payment ID: {paymentIntent?.slice(0, 20)}...
        </p>
      </div>
    </div>
  );
}
