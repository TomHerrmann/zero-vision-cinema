import * as migration_20251230_230832 from './20251230_230832';
import * as migration_20260722_150000 from './20260722_150000';
import * as migration_20260723_120000 from './20260723_120000';

export const migrations = [
  {
    up: migration_20251230_230832.up,
    down: migration_20251230_230832.down,
    name: '20251230_230832'
  },
  {
    up: migration_20260722_150000.up,
    down: migration_20260722_150000.down,
    name: '20260722_150000'
  },
  {
    up: migration_20260723_120000.up,
    down: migration_20260723_120000.down,
    name: '20260723_120000'
  },
];
