'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const paymentIntent = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get(
    'payment_intent_client_secret'
  );

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Confirming your purchase...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Verification Failed
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't verify your payment. If you were charged, please contact
            support.
          </p>
          <div className="space-y-3">
            <Link href="/events">
              <Button className="w-full bg-sky-900 hover:bg-sky-800">
                Return to Events
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Purchase Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your tickets have been confirmed.
          </p>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sky-900 mb-1">
                Check Your Email
              </h3>
              <p className="text-sm text-sky-700">
                We've sent your tickets and order confirmation to your email
                address. Please check your inbox (and spam folder).
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">What's Next?</h3>
              <p className="text-sm text-gray-700">
                Save your tickets to your phone or print them. Present them at
                the venue entrance on the day of the event.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/events">
            <Button className="w-full bg-sky-900 hover:bg-sky-800">
              Browse More Events
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Return to Home
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Payment ID: {paymentIntent?.slice(0, 20)}...
        </p>
      </div>
    </div>
  );
}
