import WeeklyEmail from '../WeeklyEmail';
import { weeklySample } from './sample-data';

// Local preview only (`npm run dev:email`). Sunday "This week at ZVC" email.
export default function WeeklyPreview() {
  return <WeeklyEmail {...weeklySample} />;
}
