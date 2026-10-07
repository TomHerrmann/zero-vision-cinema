import BroadcastEmail from '../BroadcastEmail';
import { broadcastCommunitySample } from './sample-data';

// Local preview only (`npm run dev:email`). Free community night (Rewind
// Wednesdays, Fridays at Medusa, Brewscares, Bingo): brand header, no CTA.
export default function BroadcastCommunityPreview() {
  return <BroadcastEmail {...broadcastCommunitySample} />;
}
