import { Logtail } from '@logtail/node';

export const logtail = new Logtail(process.env.BETTERSTACK_SOURCE_TOKEN!);
