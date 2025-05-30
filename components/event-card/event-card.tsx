import Link from 'next/link';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import Image from 'next/image';

type Props = {
  event: {};
};

const EventCard = ({ event }: Props) => {
  return (
    <Card>
      {/* <CardHeader>
        <CardTitle className="text-center">{event.title}</CardTitle>
        <CardDescription className="text-center">
          {event?.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Image
          alt={event.title + ' poster'}
          src={event.imageUrl}
          width={300}
          height={300}
          className="px-8 pb-8"
        />
        <p>{event.description}</p>
      </CardContent>
      <CardFooter className="justify-center">
        <Button asChild>
          <Link href={event.ticketLink}>{'Buy Tickets'}</Link>
        </Button>
      </CardFooter> */}
    </Card>
  );
};

export default EventCard;
