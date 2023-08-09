import { expect, test } from 'vitest';

import path from 'path';

import * as composerCommon from '../common/composer';
import * as testUtils from './testUtils';

test('Get abusolute files at vendorComposer target file of php code', async () => {
  const rootDir = testUtils.TEST_LV_PROJECT_PATH;
  const code = testUtils.stripInitialNewline(`
<?php

$vendorDir = dirname(__DIR__);
$baseDir = dirname($vendorDir);

return array(
    'App\\Console\\Kernel' => $baseDir . '/app/Console/Kernel.php',
    'Illuminate\\Auth\\Access\\AuthorizationException' => $vendorDir . '/laravel/framework/src/Illuminate/Auth/Access/AuthorizationException.php',
);
`);

  const resourceFiles = composerCommon.getAbusoluteFileResourcesAtVendorComposerTargetFileOfphpCode(code, rootDir);

  const expected = [
    {
      name: 'App\\Console\\Kernel',
      path: path.join(rootDir, '/app/Console/Kernel.php'),
    },
    {
      name: 'Illuminate\\Auth\\Access\\AuthorizationException',
      path: path.join(rootDir, '/vendor/laravel/framework/src/Illuminate/Auth/Access/AuthorizationException.php'),
    },
  ];

  expect(resourceFiles).toMatchObject(expected);
});
