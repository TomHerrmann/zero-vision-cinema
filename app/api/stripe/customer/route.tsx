import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';

interface CustomerResult {
  id: string;
  name: string | null;
  email: string | null;
  error?: string;
}

async function fetchCustomer(customerId: string): Promise<CustomerResult> {
  try {
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      return {
        id: customerId,
        name: null,
        email: null,
        error: 'Customer deleted',
      };
    }

    return {
      id: customer.id,
      name: customer.name || null,
      email: customer.email || null,
    };
  } catch (error: any) {
    return {
      id: customerId,
      name: null,
      email: null,
      error: error.type === 'StripeInvalidRequestError' ? 'Invalid customer ID' : 'API error',
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    // Handle single ID
    if (id && !ids) {
      const result = await fetchCustomer(id);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error === 'Invalid customer ID' ? 404 : 500 }
        );
      }
      return NextResponse.json(result);
    }

    // Handle multiple IDs
    if (ids) {
      const customerIds = ids.split(',').map(id => id.trim()).filter(Boolean);

      if (customerIds.length === 0) {
        return NextResponse.json(
          { error: 'At least one customer ID is required' },
          { status: 400 }
        );
      }

      if (customerIds.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 customer IDs allowed per request' },
          { status: 400 }
        );
      }

      // Fetch all customers concurrently
      const results = await Promise.all(
        customerIds.map(customerId => fetchCustomer(customerId))
      );

      return NextResponse.json({ customers: results });
    }

    return NextResponse.json(
      { error: 'Either "id" or "ids" parameter is required' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error in customer endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}