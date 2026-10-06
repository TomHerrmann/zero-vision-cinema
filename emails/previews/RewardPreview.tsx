import RewardEmail from '../RewardEmail';
import { rewardSample } from './sample-data';

// Local preview only (`npm run dev:email`). Renders the real RewardEmail with a
// sample code.
export default function RewardPreview() {
  return <RewardEmail {...rewardSample} />;
}
