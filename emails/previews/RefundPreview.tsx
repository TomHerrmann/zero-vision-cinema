import RefundEmail from '../RefundEmail';
import { refundSample } from './sample-data';

// Local preview only (`npm run dev:email`). Renders the real RefundEmail with
// sample data — production sends pass live order/Stripe data.
export default function RefundPreview() {
  return <RefundEmail {...refundSample} />;
}
