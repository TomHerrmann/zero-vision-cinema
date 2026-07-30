/**
 * Send the real transactional/broadcast templates to your own inbox for QA —
 * no Stripe, no QStash, no order needed. Renders each template with the shared
 * sample data and sends via Resend.
 *
 *   npx tsx --env-file=.env.local scripts/preview-emails.tsx you@example.com
 *   npm run email:send -- you@example.com
 *
 * The recipient defaults to $EMAIL_QA_TO if set. Uses your live RESEND_API_KEY
 * and sends `From:` the verified ZVC address, so this reflects real delivery
 * and rendering (Gmail / Apple Mail), just with sample content.
 */
import { Resend } from 'resend';
import TicketEmail from '../emails/TicketEmail';
import RefundEmail from '../emails/RefundEmail';
import BroadcastEmail from '../emails/BroadcastEmail';
import {
  ticketSample,
  refundSample,
  broadcastPaidSample,
  broadcastBookClubSample,
} from '../emails/previews/sample-data';
import { ZVC_EMAIL_ADDRESS } from '../app/contsants/constants';

async function main() {
  const to = process.argv[2] ?? process.env.EMAIL_QA_TO;
  if (!to) {
    console.error(
      'Usage: npx tsx --env-file=.env.local scripts/preview-emails.tsx <recipient@example.com>\n' +
        '(or set EMAIL_QA_TO in the env)'
    );
    process.exit(1);
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set — run with --env-file=.env.local');
    process.exit(1);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const emails = [
    {
      subject: '[QA] Your tickets for The Thing (1982) — Zero Vision Cinema',
      react: <TicketEmail {...ticketSample} />,
    },
    {
      subject: '[QA] Your refund for The Thing (1982) — Zero Vision Cinema',
      react: <RefundEmail {...refundSample} />,
    },
    {
      subject: '[QA] Coming up: The Thing (1982) — Zero Vision Cinema',
      react: <BroadcastEmail {...broadcastPaidSample} />,
    },
    {
      subject: '[QA] Today: Astoria Horror Book Club — Zero Vision Cinema',
      react: <BroadcastEmail {...broadcastBookClubSample} />,
    },
  ];

  console.log(`Sending ${emails.length} sample emails to ${to} …`);
  for (const { subject, react } of emails) {
    const { data, error } = await resend.emails.send({
      from: ZVC_EMAIL_ADDRESS,
      to,
      subject,
      react,
    });
    if (error) {
      console.error(`  ✗ ${subject}\n    ${error.message ?? JSON.stringify(error)}`);
    } else {
      console.log(`  ✓ ${subject}  (${data?.id})`);
    }
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
