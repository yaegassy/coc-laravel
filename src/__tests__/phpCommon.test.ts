import { describe, expect, test } from 'vitest';

import * as phpCommon from '../common/php';
import * as phpParser from '../parsers/php/parser';
import { PHPClassItemKindEnum } from '../projects/types';
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

test('Get class item kind from php code by name', async () => {
  const code = testUtils.stripInitialNewline(`
<?php
class DummyClass {}
interface DummyInterface {}
trait DummyTrait {}
enum DummyEnum {}
`);

  const kind1 = phpCommon.getClassItemKindFromPHPCodeByName(code, 'DummyClass');
  const kind2 = phpCommon.getClassItemKindFromPHPCodeByName(code, 'DummyInterface');
  const kind3 = phpCommon.getClassItemKindFromPHPCodeByName(code, 'DummyTrait');
  const kind4 = phpCommon.getClassItemKindFromPHPCodeByName(code, 'DummyEnum');

  expect(kind1).toBe(PHPClassItemKindEnum.Class);
  expect(kind2).toBe(PHPClassItemKindEnum.Interface);
  expect(kind3).toBe(PHPClassItemKindEnum.Trait);
  expect(kind4).toBe(PHPClassItemKindEnum.Enum);
});

describe('Get definition string of class related item', () => {
  test('Class | Get definition string of class related item', async () => {
    const code = testUtils.stripInitialNewline(`
<?php
class Request extends SymfonyRequest implements Arrayable, ArrayAccess
{
  // ...snip
}
`);

    const itemName = 'Request';
    const itemKindName = phpCommon.getClassItemKindName(PHPClassItemKindEnum.Class);
    const offset = phpCommon.getClassItemStartOffsetFromPhpCode(code, itemName, itemKindName)!;
    const definitionString = phpCommon.getDefinitionStringByStartOffsetFromPhpCode(code, offset);

    expect(definitionString).toBe('class Request extends SymfonyRequest implements Arrayable, ArrayAccess');
  });

  test('Interface | Get definition string of class related item', async () => {
    const code = testUtils.stripInitialNewline(`
<?php
interface ValidatorInterface
{
  // ...snip
}
`);

    const itemName = 'ValidatorInterface';
    const itemKindName = phpCommon.getClassItemKindName(PHPClassItemKindEnum.Interface);
    const offset = phpCommon.getClassItemStartOffsetFromPhpCode(code, itemName, itemKindName)!;
    const definitionString = phpCommon.getDefinitionStringByStartOffsetFromPhpCode(code, offset);

    expect(definitionString).toBe('interface ValidatorInterface');
  });

  test('Trait | Get definition string of class related item', async () => {
    const code = testUtils.stripInitialNewline(`
<?php
trait Boundaries
{
  // ...snip
}
`);

    const itemName = 'Boundaries';
    const itemKindName = phpCommon.getClassItemKindName(PHPClassItemKindEnum.Trait);
    const offset = phpCommon.getClassItemStartOffsetFromPhpCode(code, itemName, itemKindName)!;
    const definitionString = phpCommon.getDefinitionStringByStartOffsetFromPhpCode(code, offset);

    expect(definitionString).toBe('trait Boundaries');
  });

  test('Enum | Get definition string of class related item', async () => {
    const code = testUtils.stripInitialNewline(`
<?php
enum Level: int
{
  // ...snip
}
`);

    const itemName = 'Level';
    const itemKindName = phpCommon.getClassItemKindName(PHPClassItemKindEnum.Enum);
    const offset = phpCommon.getClassItemStartOffsetFromPhpCode(code, itemName, itemKindName)!;
    const definitionString = phpCommon.getDefinitionStringByStartOffsetFromPhpCode(code, offset);

    expect(definitionString).toBe('enum Level: int');
  });
});

test('Get documantation of class related item', async () => {
  const code = testUtils.stripInitialNewline(`
<?php
/**
 * @method array validate(array $rules, ...$params)
 * @method array validateWithBag(string $errorBag, array $rules, ...$params)
 * @method bool hasValidSignature(bool $absolute = true)
 */
class Request extends SymfonyRequest implements Arrayable, ArrayAccess
{
  // ...snip
}
`);

  const classItemName = 'Request';
  const classItemKindName = phpCommon.getClassItemKindName(PHPClassItemKindEnum.Class);
  const documantaion = phpCommon.getClassItemDocumantationFromPhpCode(code, classItemName, classItemKindName);

  const expected = `/**
 * @method array validate(array $rules, ...$params)
 * @method array validateWithBag(string $errorBag, array $rules, ...$params)
 * @method bool hasValidSignature(bool $absolute = true)
 */`;

  expect(documantaion).toBe(expected);
});

describe('Check scope resolution items', () => {
  test('Even if the member name has not been entered yet, it can be successfully retrieved as items.', async () => {
    const code = testUtils.stripInitialNewline(`
<?php
Dummy\\Foo\\Bar::
`);

    const ast = phpParser.getAstByParseCode(code);
    if (!ast) return;

    const items = phpCommon.getScopeResolutionItemsFromPhpCode(code);

    const expected = [
      {
        class: {
          name: 'Dummy\\Foo\\Bar',
          startOffset: 6,
          endOffset: 19,
        },
        member: {
          name: '',
          startOffset: 22,
          endOffset: 22,
        },
      },
    ];

    // If there is no string, start has the same value as end.
    // If there is a string, start will also be at the appropriate offset.

    expect(items).toMatchObject(expected);
  });
});

test('Get class constant range offset from php code', async () => {
  const code = testUtils.stripInitialNewline(`
<?php
class DateTime implements DateTimeInterface
{
    public const RFC822 = 'D, d M y H:i:s O';

    public const RFC850 = 'l, d-M-y H:i:s T';

    // ...snip
}
`);

  const ast = phpParser.getAstByParseCode(code);
  if (!ast) return;

  const itemRangeOffset = phpCommon.getClassConstantRangeOffsetFromPhpCode(code, 'DateTime', 'RFC822');

  const expected = { start: 69, end: 96 };
  expect(itemRangeOffset).toMatchObject(expected);
});
