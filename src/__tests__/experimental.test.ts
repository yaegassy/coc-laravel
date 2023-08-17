import { expect, test } from 'vitest';

import * as testUtils from './testUtils';

type PHPDeclaredClassesType = string[];
type PHPDefinedFunctionsType = {
  internal: string[];
  user: string[];
};

test('Check get_declared_classes', async () => {
  // `get_declared_classes` can only be obtained for predefined classes. Undefined classes cannot be retrieved until you try to use the class.
  // To get all classes, you need to check composer's classmap.

  const code = testUtils.stripInitialNewline(`
echo json_encode(get_declared_classes(), JSON_PRETTY_PRINT);
`);

  const rootDir = testUtils.TEST_LV_PROJECT_PATH;
  const artisanPath = testUtils.getArtisanPath(rootDir)!;

  const resJsonStr = await testUtils.runTinker(code, artisanPath);
  if (!resJsonStr) return;

  const a = JSON.parse(resJsonStr) as PHPDeclaredClassesType[];
  //console.log(JSON.stringify(a.length, null, 2));

  // dummy
  expect(true).toBe(true);
});

test('Check get_defined_function', async () => {
  // `get_defined_functions` is an all lowercase function name, including namespaces, etc.
  // Therefore, further processing is required to make the actual definition.

  const code = testUtils.stripInitialNewline(`
echo json_encode(get_defined_functions(), JSON_PRETTY_PRINT);
`);

  const rootDir = testUtils.TEST_LV_PROJECT_PATH;
  const artisanPath = testUtils.getArtisanPath(rootDir)!;

  const resJsonStr = await testUtils.runTinker(code, artisanPath);
  if (!resJsonStr) return;

  const a = JSON.parse(resJsonStr) as PHPDefinedFunctionsType[];
  //console.log(JSON.stringify(a, null, 2));

  // dummy
  expect(true).toBe(true);
});
