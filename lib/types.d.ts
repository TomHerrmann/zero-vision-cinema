type FakeEvent = {
  title: string;
  description: string;
  ticketLink: string;
  imageUrl: string;
  price: number;
  datetime: Date;
  location: string;
};

type EventSelection = 'future' | 'past' | 'all';
type EventOrder = 'dsc' | 'asc';

type Attendee = {
  eventName: string;
  customerName: string;
  customerEmail: string;
  quantity: number;
};
