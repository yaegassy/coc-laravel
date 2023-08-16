import { test, expect } from 'vitest';

import * as bladeParser from '../parsers/blade/parser';
import * as testUtils from './testUtils';

import * as bladeCommon from '../common/blade';
import { PHPVariableItemType } from '../common/types';

test('Get variable data items from the blade php-related node type', async () => {
  const code = testUtils.stripInitialNewline(`
<p>Dummy1</p>
<?php
    $inlineVar = "sample1Value";
    $inlineValueVar = $sample1;
?>

<p>Dummy2</p>

@php
    $directiveVar = "sample3Value";
@endphp

<p>Dummy3</p>

@php($shortDirectiveInt = 1)
@php($shortDirectiveBool = false)

<p>Dummy4</p>

<?php
    $inlineVar = "2023/08/14"
    $inlineObj = DateTime($date);
?>
`);

  const bladeDoc = bladeParser.getBladeDocument(code);
  if (!bladeDoc) return;

  const variableItems: PHPVariableItemType[] = [];

  const inlinePhpVariableItems = bladeCommon.getVariableItemsWithBladeRangeOffsetsFromBladeDoc(bladeDoc, 'inlinePhp');
  if (inlinePhpVariableItems.length > 0) variableItems.push(...inlinePhpVariableItems);

  const phpDirectiveVariableItems = bladeCommon.getVariableItemsWithBladeRangeOffsetsFromBladeDoc(
    bladeDoc,
    'phpDirective'
  );
  if (phpDirectiveVariableItems.length > 0) variableItems.push(...phpDirectiveVariableItems);

  const expected = [
    {
      name: 'inlineVar',
      type: 'string',
      start: 10,
      end: 20,
      bladeNodeStart: 14,
      bladeNodeEnd: 86,
      bladeNodeType: 'inlinePhp',
    },
    {
      name: 'inlineValueVar',
      type: 'variable',
      start: 43,
      end: 58,
      bladeNodeStart: 14,
      bladeNodeEnd: 86,
      bladeNodeType: 'inlinePhp',
    },
    {
      name: 'inlineVar',
      type: 'string',
      start: 10,
      end: 20,
      bladeNodeStart: 248,
      bladeNodeEnd: 319,
      bladeNodeType: 'inlinePhp',
    },
    {
      name: 'inlineObj',
      type: 'call',
      start: 40,
      end: 50,
      bladeNodeStart: 248,
      bladeNodeEnd: 319,
      bladeNodeType: 'inlinePhp',
    },
    {
      name: 'directiveVar',
      type: 'string',
      start: 10,
      end: 23,
      bladeNodeStart: 104,
      bladeNodeEnd: 152,
      bladeNodeType: 'phpDirective',
    },
    {
      name: 'shortDirectiveInt',
      type: 'int',
      start: 7,
      end: 25,
      bladeNodeStart: 170,
      bladeNodeEnd: 197,
      bladeNodeType: 'phpDirective',
    },
    {
      name: 'shortDirectiveBool',
      type: 'false',
      start: 7,
      end: 26,
      bladeNodeStart: 199,
      bladeNodeEnd: 231,
      bladeNodeType: 'phpDirective',
    },
  ];

  expect(variableItems).toMatchObject(expected);
});

test('Get the adjust offset from the php-related node type of the blade', async () => {
  const a1 = bladeCommon.getAdjustOffsetAtBladeNodeTypeString('inlinePhp');
  expect(a1).toBe(0);

  const a2 = bladeCommon.getAdjustOffsetAtBladeNodeTypeString('phpDirective');
  expect(a2).toBe(-1);
});

test('Get variable data items that can be completed from the editor offset', async () => {
  const phpVariableItems: PHPVariableItemType[] = [
    {
      name: 'inlineVar',
      type: 'string',
      start: 10,
      end: 20,
      bladeNodeStart: 14,
      bladeNodeEnd: 86,
      bladeNodeType: 'inlinePhp',
    },
    {
      name: 'shortDirectiveInt',
      type: 'int',
      start: 7,
      end: 25,
      bladeNodeStart: 170,
      bladeNodeEnd: 197,
      bladeNodeType: 'phpDirective',
    },
  ];

  let editorOffset = 0;

  // 1
  editorOffset = 33;
  const a1 = bladeCommon.getVariableItemsFromEditorOffset(phpVariableItems, editorOffset);

  const e1 = [
    // [Not Listed] | 20 (end) + 14 (bladeNodeStart) + 0 (adjustOffset) <= 33 (editorOffset)
    //{
    //  name: 'inlineVar',
    //  type: 'string',
    //},
    // [Not Listed] | 25 (end) + 170 (bladeNodeStart) - 1 (adjustOffset) <= 33 (editorOffset)
    //{
    //  name: 'shortDirectiveInt',
    //  type: 'int',
    //},
  ];
  expect(a1).toMatchObject(e1);

  // 2
  editorOffset = 34;
  const a2 = bladeCommon.getVariableItemsFromEditorOffset(phpVariableItems, editorOffset);

  const e2 = [
    // [Listed] | 20 (end) + 14 (bladeNodeStart) + 0 (adjustOffset) <= 34 (editorOffset)
    {
      name: 'inlineVar',
      type: 'string',
    },
    // [Not Listed] | 25 (end) + 170 (bladeNodeStart) - 1 (adjustOffset) <= 34 (editorOffset)
    //{
    //  name: 'shortDirectiveInt',
    //  type: 'int',
    //},
  ];
  expect(a2).toMatchObject(e2);

  // 3
  editorOffset = 193;
  const a3 = bladeCommon.getVariableItemsFromEditorOffset(phpVariableItems, editorOffset);

  const e3 = [
    // [Listed] | 20 (end) + 14 (bladeNodeStart) + 0 (adjustOffset) <= 193 (editorOffset)
    {
      name: 'inlineVar',
      type: 'string',
    },
    // [Not Listed] | 25 (end) + 170 (bladeNodeStart) - 1 (adjustOffset) <= 193 (editorOffset)
    //{
    //  name: 'shortDirectiveInt',
    //  type: 'int',
    //},
  ];
  expect(a3).toMatchObject(e3);

  // 4
  editorOffset = 194;
  const a4 = bladeCommon.getVariableItemsFromEditorOffset(phpVariableItems, editorOffset);

  const e4 = [
    // [Listed] | 20 (end) + 14 (bladeNodeStart) + 0 (adjustOffset) <= 194 (editorOffset)
    {
      name: 'inlineVar',
      type: 'string',
    },
    // [Listed] | 25 (end) + 170 (bladeNodeStart) - 1 (adjustOffset) <= 194 (editorOffset)
    {
      name: 'shortDirectiveInt',
      type: 'int',
    },
  ];
  expect(a4).toMatchObject(e4);
});

test('Testing virtual php eval code', async () => {
  const code = testUtils.stripInitialNewline(`
<p>Dummy1</p>
<?php
    $inlineVar = "sample1Value";
    $inlineValueVar = $sample1;
?>

<p>Dummy2</p>

@php
    $directiveVar = "sample3Value";
@endphp

<p>Dummy3</p>

@php($shortDirectiveInt = 1)
@php($shortDirectiveBool = false)

<p>Dummy4</p>

<?php
    $inlineVar = "2023/08/14";
    $inlineObj = DateTime($date);
?>
`);

  const actual = bladeCommon.generateVirtualPhpEvalCode(code);

  const expected = `
    $inlineVar = "sample1Value";
    $inlineValueVar = $sample1;

    $directiveVar = "sample3Value";

$shortDirectiveInt = 1;
$shortDirectiveBool = false;

    $inlineVar = "2023/08/14";
    $inlineObj = DateTime($date);
`;

  expect(actual).toMatchObject(expected);
});
