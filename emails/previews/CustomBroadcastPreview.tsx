import CustomBroadcastEmail from '../CustomBroadcastEmail';
import { customBroadcastSample } from './sample-data';

// Local preview only (`npm run dev:email`). Hand-written broadcast with a wide,
// a portrait and a small image, body links, a list and a CTA button.
export default function CustomBroadcastPreview() {
  return <CustomBroadcastEmail {...customBroadcastSample} />;
}
