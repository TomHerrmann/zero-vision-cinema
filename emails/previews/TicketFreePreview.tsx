import TicketEmail from '../TicketEmail';
import { ticketFreeSample } from './sample-data';

// Local preview only (`npm run dev:email`): a free ticket redeemed with a
// loyalty reward code (no charge, no receipt, no refund link).
export default function TicketFreePreview() {
  return <TicketEmail {...ticketFreeSample} />;
}
