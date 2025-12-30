import * as migration_20251230_230832 from './20251230_230832';

export const migrations = [
  {
    up: migration_20251230_230832.up,
    down: migration_20251230_230832.down,
    name: '20251230_230832'
  },
];
