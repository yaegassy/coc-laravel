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

  const value = phpCommon.getConstantOfDefineValueFromDefineNameInPHPCode(code, 'DUMMY');
  expect(value).toBe(1);
});

test('Get constant of defineName in php code', async () => {
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

  const names = phpCommon.getConstantOfDefineNameFromPHPCode(code);

  const expected = ['MB_CASE_UPPER', 'MB_CASE_LOWER', 'MB_CASE_TITLE'];
  expect(names).toMatchObject(expected);
});

test('Get function from php code', async () => {
  // Ref: symfony/polyfill-mbstring/bootstrap.php
  const code = testUtils.stripInitialNewline(`
if (!function_exists('mb_convert_encoding')) {
    function mb_convert_encoding($string, $to_encoding, $from_encoding = null) { return p\Mbstring::mb_convert_encoding($string, $to_encoding, $from_encoding); }
}
if (!function_exists('mb_decode_mimeheader')) {
    function mb_decode_mimeheader($string) { return p\Mbstring::mb_decode_mimeheader($string); }
}
`);

  const names = phpCommon.getFunctionFromPHPCode(code);

  const expected = ['mb_convert_encoding', 'mb_decode_mimeheader'];
  expect(names).toMatchObject(expected);
});

test('Get function with namespace from php code', async () => {
  // \ -> \\
  const code = testUtils.stripInitialNewline(`
namespace Laravel\\Prompts;

use Closure;
use Illuminate\\Support\\Collection;

/**
 * Prompt the user for text input.
 */
function text(string $label, string $placeholder = '', string $default = '', bool|string $required = false, Closure $validate = null): string
{
    return (new TextPrompt($label, $placeholder, $default, $required, $validate))->prompt();
}

/**
 * Prompt the user for input, hiding the value.
 */
function password(string $label, string $placeholder = '', bool|string $required = false, Closure $validate = null): string
{
    return (new PasswordPrompt($label, $placeholder, $required, $validate))->prompt();
}
`);
  const namespaces = phpCommon.getNamespaceFromPHPCode(code);
  const functionNames = phpCommon.getFunctionFromPHPCode(code);

  const names: string[] = [];

  for (const f of functionNames) {
    if (namespaces.length > 0) {
      names.push(namespaces[0] + '\\' + f);
    } else {
      names.push(f);
    }
  }

  const expected = ['Laravel\\Prompts\\text', 'Laravel\\Prompts\\password'];

  expect(names).toMatchObject(expected);
});
