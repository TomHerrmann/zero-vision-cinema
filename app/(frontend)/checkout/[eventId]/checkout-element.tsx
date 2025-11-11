'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import type { Event } from '@/payload-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Minus, Plus } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutElementProps extends Event {}

// Zod schema for form validation
const checkoutFormSchema = z.object({
  quantity: z.number().min(1, 'Minimum 1 ticket').max(10, 'Maximum 10 tickets'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  joinMailingList: z.boolean(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

interface CheckoutFormProps {
  price: number;
  onQuantityChange: (quantity: number) => void;
}

function CheckoutForm({ price, onQuantityChange }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      quantity: 1,
      name: '',
      email: '',
      joinMailingList: true,
    },
  });

  const quantity = form.watch('quantity');
  const totalPrice = price * quantity;

  // Notify parent when quantity changes
  useEffect(() => {
    onQuantityChange(quantity);
  }, [quantity, onQuantityChange]);

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!stripe || !elements) {
      setError('Payment system not ready');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Subscribe to mailing list if opted in
      if (data.joinMailingList) {
        try {
          await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email }),
          });
        } catch (err) {
          console.error('Failed to subscribe to mailing list:', err);
          // Don't block payment if subscription fails
        }
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          receipt_email: data.email,
          payment_method_data: {
            billing_details: {
              name: data.name,
              email: data.email,
            },
          },
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const incrementQuantity = () => {
    const current = form.getValues('quantity');
    if (current < 10) {
      form.setValue('quantity', current + 1);
    }
  };

  const decrementQuantity = () => {
    const current = form.getValues('quantity');
    if (current > 1) {
      form.setValue('quantity', current - 1);
    }
  };

  if (success) {
    return (
      <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-6 backdrop-blur-sm shadow-lg">
        <p className="text-primary font-bold text-lg">Payment successful!</p>
        <p className="text-foreground/80 mt-2">Thank you for your purchase.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Quantity Selector */}
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">
                Number of Tickets
              </FormLabel>
              <FormControl>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={field.value <= 1}
                    className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all"
                  >
                    <Minus className="h-5 w-5 text-primary" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    className="w-24 text-center text-foreground font-bold text-xl bg-background/50 border-primary/20 focus:border-primary/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={field.value >= 10}
                    className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all"
                  >
                    <Plus className="h-5 w-5 text-primary" />
                  </Button>
                </div>
              </FormControl>
              <FormDescription className="text-center text-foreground/50 text-xs">
                Maximum 10 tickets per order
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price Summary */}
        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-5 border-2 border-primary/20 shadow-lg">
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-foreground/70">Price per ticket:</span>
            <span className="font-semibold text-foreground">
              ${price.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-foreground/70">Quantity:</span>
            <span className="font-semibold text-foreground">×{quantity}</span>
          </div>
          <div className="border-t border-primary/20 my-3"></div>
          <div className="flex justify-between items-center">
            <span className="text-foreground font-bold text-lg">Total:</span>
            <span className="text-2xl font-bold text-primary">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Customer Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your Name"
                  className="bg-background/50 border-primary/20 focus:border-primary/40 text-foreground placeholder:text-foreground/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  className="bg-background/50 border-primary/20 focus:border-primary/40 text-foreground placeholder:text-foreground/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Element */}
        <FormItem>
          <FormLabel className="text-foreground font-medium">Payment Details</FormLabel>
          <div className="mt-2 p-4 rounded-lg bg-background/50 border border-primary/20">
            <PaymentElement />
          </div>
        </FormItem>

        {/* Mailing List Checkbox */}
        <FormField
          control={form.control}
          name="joinMailingList"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-3 px-4 rounded-lg bg-background/30 border border-primary/10">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal cursor-pointer text-foreground/80 leading-relaxed">
                  Join our mailing list to receive updates about upcoming events
                  and exclusive offers
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!stripe || loading || !form.formState.isValid}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 border border-primary/20 font-semibold"
          size="lg"
        >
          {loading ? 'Processing...' : 'Complete Purchase'}
        </Button>

        <p className="text-xs text-foreground/40 text-center leading-relaxed">
          Secure payment powered by Stripe. Your payment information is
          encrypted and secure.
        </p>
      </form>
    </Form>
  );
}

export default function CheckoutElement({
  id: eventId,
  name,
  price,
}: CheckoutElementProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Create payment intent on mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            amount: price * 100, // Initial amount for 1 ticket
            eventName: name,
            quantity: 1,
          }),
        });

        const data = await response.json();
        console.log('Payment Intent Response:', data);

        if (data.clientSecret && data.paymentIntentId) {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
        } else {
          console.error('Payment Intent Error:', data);
          setError('Failed to initialize checkout');
        }
      } catch (err) {
        console.error('Payment Intent Creation Failed:', err);
        setError('Failed to initialize checkout');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [eventId, name, price]);

  // Update payment intent when quantity changes
  useEffect(() => {
    if (!paymentIntentId || quantity === 1) return; // Skip if no payment intent or initial quantity

    const updatePaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/payment-intent', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            amount: price * quantity * 100,
            quantity,
          }),
        });

        const data = await response.json();

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error('Failed to update payment amount:', err);
      }
    };

    updatePaymentIntent();
  }, [quantity, paymentIntentId, price]);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#fef9c3', // yellow-50
        colorBackground: 'oklch(0.147 0.004 49.25)', // background
        colorText: '#fef9c3', // yellow-50
        colorDanger: '#f87171', // red-400
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          backgroundColor: 'oklch(0.216 0.006 56.043)', // stone-900
          border: '1px solid rgba(254, 249, 195, 0.2)', // primary/20
          color: '#fef9c3',
        },
        '.Input:focus': {
          border: '1px solid rgba(254, 249, 195, 0.4)', // primary/40
          boxShadow: '0 0 0 1px rgba(254, 249, 195, 0.1)',
        },
        '.Label': {
          color: '#fef9c3',
          fontWeight: '500',
        },
      },
    },
    loader: 'auto',
  };

  return (
    <div className="bg-background/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-primary/10 border-2 border-primary/20 p-6 md:p-8 h-fit sticky top-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text">
        Complete Your Purchase
      </h2>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-foreground/70 animate-pulse">Loading payment form...</div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {clientSecret && !loading && (
        <Elements stripe={stripePromise} options={elementsOptions}>
          <CheckoutForm price={price} onQuantityChange={handleQuantityChange} />
        </Elements>
      )}
    </div>
  );
}
