import * as migration_20251230_230832 from './20251230_230832';
import * as migration_20260701_142200 from './20260701_142200';
import * as migration_20260701_152105 from './20260701_152105';

export const migrations = [
  {
    up: migration_20251230_230832.up,
    down: migration_20251230_230832.down,
    name: '20251230_230832',
  },
  {
    up: migration_20260701_142200.up,
    down: migration_20260701_142200.down,
    name: '20260701_142200',
  },
  {
    up: migration_20260701_152105.up,
    down: migration_20260701_152105.down,
    name: '20260701_152105'
  },
];
