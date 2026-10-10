import type { CollectionConfig } from 'payload';

// Loaded on demand: lib/refundRequests pulls in the Stripe and QStash clients,
// which the config shouldn't construct just to be imported (type generation,
// migrations).
const lib = () => import('@/lib/refundRequests');

/**
 * Refund requests: nothing is refunded until an admin approves one. Filed by
 * the buyer's "Request a refund" link (POST /api/refund) when the event is
 * within 48 hours (further out it still refunds automatically), or by an admin
 * from an order's page (for buyers who email in). Approving issues the Stripe refund;
 * the `charge.refunded` webhook does the rest exactly as before (mark the order
 * refunded, free the seats, loyalty, refund email).
 *
 * Tied to the order and its Stripe customer id only — no email or other PII.
 * Every write goes through the endpoints below (or POST /api/refund), never the
 * REST/admin form, so status changes are always the guarded ones in
 * lib/refundRequests.
 */
export const RefundRequests: CollectionConfig = {
  slug: 'refund-requests',
  labels: { singular: 'Refund request', plural: 'Refund requests' },
  admin: {
    group: 'Events',
    useAsTitle: 'id',
    defaultColumns: ['id', 'order', 'status', 'source', 'requestedAt', 'decidedAt'],
  },
  access: {
    create: () => false,
    delete: () => false,
    read: ({ req }) => Boolean(req.user),
    update: () => false,
  },
  endpoints: [
    {
      // GET /api/refund-requests/:id/summary — what the decision panel shows.
      path: '/:id/summary',
      method: 'get',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const summary = await (await lib()).getRefundRequestSummary(
          req.payload,
          Number(req.routeParams?.id)
        );
        if (!summary) return Response.json({ error: 'Not found' }, { status: 404 });
        return Response.json(summary);
      },
    },
    {
      // POST /api/refund-requests/:id/approve  { voidRewards?: boolean }
      path: '/:id/approve',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const id = Number(req.routeParams?.id);
        const body = req.json ? await req.json().catch(() => ({})) : {};
        const result = await (await lib()).approveRefundRequest(req.payload, id, {
          userId: Number(req.user.id),
          voidRewards: Boolean(body?.voidRewards),
        });
        return Response.json(result, { status: result.ok ? 200 : result.status });
      },
    },
    {
      // POST /api/refund-requests/:id/decline
      path: '/:id/decline',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const id = Number(req.routeParams?.id);
        const result = await (await lib()).declineRefundRequest(req.payload, id, {
          userId: Number(req.user.id),
        });
        return Response.json(result, { status: result.ok ? 200 : result.status });
      },
    },
    {
      // POST /api/refund-requests/for-order/:orderId — an admin files one for a
      // buyer who emailed in. Returns the (new or already pending) request.
      path: '/for-order/:orderId',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const orderId = Number(req.routeParams?.orderId);
        const result = await (await lib()).createRefundRequest(req.payload, orderId, 'admin');
        return Response.json(result, { status: result.ok ? 200 : result.status });
      },
    },
  ],
  fields: [
    {
      // Decision panel: order summary, loyalty effect, Approve / Decline.
      name: 'decision',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/RefundDecision#RefundDecision',
        },
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'customerId',
      type: 'text',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' },
      ],
      index: true,
      admin: { readOnly: true },
    },
    {
      // `buyer`: the link in their ticket email. `admin`: filed from the order.
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Buyer (ticket email link)', value: 'buyer' },
        { label: 'Admin (from the order)', value: 'admin' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'requestedAt',
      type: 'date',
      required: true,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'decidedAt',
      type: 'date',
      required: false,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'decidedBy',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: { readOnly: true },
    },
    {
      name: 'stripeRefundId',
      type: 'text',
      required: false,
      admin: { readOnly: true },
    },
    {
      // Codes voided on approval because the admin ticked "void their code".
      name: 'voidedRewardCodes',
      type: 'text',
      required: false,
      admin: { readOnly: true },
    },
    {
      // Idempotency guard for the "new refund request" email to us.
      name: 'notifiedAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
    {
      // Idempotency guard for the decline email to the buyer.
      name: 'declineEmailSentAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
  ],
};
