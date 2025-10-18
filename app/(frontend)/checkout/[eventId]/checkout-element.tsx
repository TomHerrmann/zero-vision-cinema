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
      // Store mailing list preference (handle this on your backend)
      if (data.joinMailingList) {
        console.log('User opted into mailing list:', data.email);
        // TODO: Send to backend API to subscribe to mailing list
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-semibold">Payment successful!</p>
        <p className="text-green-700 mt-2">Thank you for your purchase.</p>
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
              <FormLabel className="text-background">
                Number of Tickets
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={field.value <= 1}
                    className="h-10 w-10 rounded-md"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    className="w-20 text-center text-background font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={field.value >= 10}
                    className="h-10 w-10 rounded-md"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <FormDescription className="text-center">
                Maximum 10 tickets per order
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-600">Price per ticket:</span>
            <span className="font-medium text-background">
              ${price.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium text-background">×{quantity}</span>
          </div>
          <div className="border-t border-gray-300 my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-gray-900 font-semibold">Total:</span>
            <span className="text-xl font-bold text-sky-600">
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
              <FormLabel className="text-background">Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
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
              <FormLabel className="text-background">Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Element */}
        <FormItem>
          <FormLabel className="text-white">Payment Details</FormLabel>
          <div className="mt-2">
            <PaymentElement />
          </div>
        </FormItem>

        {/* Mailing List Checkbox */}
        <FormField
          control={form.control}
          name="joinMailingList"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal cursor-pointer text-background">
                  Join our mailing list to receive updates about upcoming events
                  and exclusive offers
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!stripe || loading || !form.formState.isValid}
          className="w-full bg-sky-900 text-foreground hover:bg-sky-800"
          size="lg"
        >
          {loading ? 'Processing...' : 'Complete Purchase'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const createPaymentIntent = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            amount: price * quantity * 100,
            eventName: name,
            quantity,
          }),
        });

        const data = await response.json();

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError('Failed to initialize checkout');
        }
      } catch (err) {
        setError('Failed to initialize checkout');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [eventId, name, price, quantity]);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
      },
    },
    loader: 'auto',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Complete Your Purchase
      </h2>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading payment form...</div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
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
