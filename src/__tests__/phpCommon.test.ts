import { expect, test } from 'vitest';

import * as phpCommon from '../common/php';
import * as phpParser from '../parsers/php/parser';
import * as testUtils from './testUtils';

test('Get defineValue from defineName in php code', async () => {
  const code = testUtils.stripInitialNewline(`
<?php
define('DUMMY', 1);
`);

  const ast = phpParser.getAst(code);
  if (!ast) return;

  const defineValue = phpCommon.getConstantOfDefineValueFromDefineNameInPHPCode(code, 'DUMMY');
  expect(defineValue).toBe(1);
});

test('Get defineValue from defineName in php code', async () => {
  // Ref: symfony/polyfill-mbstring/bootstrap.php
  const code = testUtils.stripInitialNewline(`
if (!defined('MB_CASE_UPPER')) {
    define('MB_CASE_UPPER', 0);
}
if (!defined('MB_CASE_LOWER')) {
    define('MB_CASE_LOWER', 1);
}
if (!defined('MB_CASE_TITLE')) {
    define('MB_CASE_TITLE', 2);
}
`);

  const defineNames = phpCommon.getConstantOfDefineNameFromPHPCode(code);

  const expected = ['MB_CASE_UPPER', 'MB_CASE_LOWER', 'MB_CASE_TITLE'];
  expect(defineNames).toMatchObject(expected);
});
