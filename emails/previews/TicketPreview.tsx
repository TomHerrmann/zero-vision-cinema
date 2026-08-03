import TicketEmail from '../TicketEmail';
import { ticketSample } from './sample-data';

// Local preview only (`npm run dev:email`). Renders the real TicketEmail with
// sample receipt data — production sends pass live order/Stripe data.
export default function TicketPreview() {
  return <TicketEmail {...ticketSample} />;
}
