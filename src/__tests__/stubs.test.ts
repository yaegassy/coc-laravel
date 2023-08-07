import { expect, test } from 'vitest';

import fs from 'fs';
import path from 'path';

import { getContextListFromStubMapPHPCode, isAllowStubFile } from '../common/stubs';

const STUBS_PATH = path.resolve(path.join(__dirname, '../../stubs'));
const USE_STUBS = ['Core', 'date', 'standard'];

test('Get list of constatns from StubsMmap file', async () => {
  const stubsMapPHPCode = await fs.promises.readFile(path.join(STUBS_PATH, 'PhpStormStubsMap.php'), {
    encoding: 'utf8',
  });

  const constantContextList = getContextListFromStubMapPHPCode(stubsMapPHPCode, 'CONSTANTS');
  if (!constantContextList) return;

  const constants = constantContextList.filter((c) => isAllowStubFile(c.path, USE_STUBS));

  expect(constants.length).toBe(551);
  expect(constants[0]).toMatchObject({
    name: 'ABDAY_1',
    path: 'standard/standard_defines.php',
  });
});
