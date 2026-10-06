import TicketEmail from '../TicketEmail';
import { ticketEarnedSample } from './sample-data';

// Local preview only (`npm run dev:email`): the third purchase in the window,
// all three eyes crossed out and the free-ticket code shown.
export default function TicketEarnedPreview() {
  return <TicketEmail {...ticketEarnedSample} />;
}
