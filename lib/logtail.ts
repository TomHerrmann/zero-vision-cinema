import { Logtail } from '@logtail/node';

const noop = () => Promise.resolve({} as any);
const noopLogger = { info: noop, warn: noop, error: noop };

export const logtail = process.env.BETTERSTACK_SOURCE_TOKEN
  ? new Logtail(process.env.BETTERSTACK_SOURCE_TOKEN)
  : noopLogger as unknown as Logtail;
