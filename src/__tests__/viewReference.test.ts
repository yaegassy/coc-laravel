import { describe, expect, test } from 'vitest';

import { CallViewFunctionForReferenceType } from '../common/types';
import * as viewReferenceCommon from '../common/viewReference';
import * as testUtils from './testUtils';

describe('Testing get call view functions', () => {
  test('Non chain with method | return node', async () => {
    const code = testUtils.stripInitialNewline(`
<?php
Route::get('/foo', function () {
    return view('foo', ['bar' => 'dummy']);
});
`);

    const returnOrArrowFuncNodes = viewReferenceCommon.getReturnOrArrowFuncNodesFromPHPCode(code);
    if (!returnOrArrowFuncNodes) return;

    const callViewFunctions: CallViewFunctionForReferenceType[] = [];
    for (const node of returnOrArrowFuncNodes) {
      const res = viewReferenceCommon.getCallViewFunctionsNonChainWithMethod(node);
      if (res) callViewFunctions.push(res);
    }

    const expected = [
      {
        name: 'foo',
        startOffset: 50,
        endOffset: 54,
        dataKeys: ['bar'],
      },
    ];

    expect(callViewFunctions).toMatchObject(expected);
  });

  test('No chain with method | allowfunc node', async () => {
    const code = testUtils.stripInitialNewline(`
<?php
Route::get('/one', fn() => view('one', ['two' => 'dummy']));
`);

    const returnOrArrowFuncNodes = viewReferenceCommon.getReturnOrArrowFuncNodesFromPHPCode(code);
    if (!returnOrArrowFuncNodes) return;

    const callViewFunctions: CallViewFunctionForReferenceType[] = [];
    for (const node of returnOrArrowFuncNodes) {
      const res = viewReferenceCommon.getCallViewFunctionsNonChainWithMethod(node);
      if (res) callViewFunctions.push(res);
    }

    const expected = [
      {
        name: 'one',
        startOffset: 33,
        endOffset: 37,
        dataKeys: ['two'],
      },
    ];

    expect(callViewFunctions).toMatchObject(expected);
  });

  test('With chain with method | return node', async () => {
    const code = testUtils.stripInitialNewline(`
<?php
Route::get('/hop', function () {
    return view('hop')->with("step", "stepValue")->with(["jump" => "jumpValue"]);
});
`);

    const returnOrArrowFuncNodes = viewReferenceCommon.getReturnOrArrowFuncNodesFromPHPCode(code);
    if (!returnOrArrowFuncNodes) return;

    const callViewFunctions: CallViewFunctionForReferenceType[] = [];
    for (const node of returnOrArrowFuncNodes) {
      const res = viewReferenceCommon.getCallViewFunctionsWithChainWithMethod(node);
      if (res) callViewFunctions.push(res);
    }

    const expected = [
      {
        name: 'hop',
        startOffset: 50,
        endOffset: 54,
        dataKeys: ['step', 'jump'],
      },
    ];

    expect(callViewFunctions).toMatchObject(expected);
  });

  test('With chain with method | allowfunc node', async () => {
    const code = testUtils.stripInitialNewline(`
<?php
Route::get('/hop', fn() => view('hop')->with("step", "stepValue")->with(["jump" => "jumpValue"]));
`);

    const returnOrArrowFuncNodes = viewReferenceCommon.getReturnOrArrowFuncNodesFromPHPCode(code);
    if (!returnOrArrowFuncNodes) return;

    const callViewFunctions: CallViewFunctionForReferenceType[] = [];
    for (const node of returnOrArrowFuncNodes) {
      const res = viewReferenceCommon.getCallViewFunctionsWithChainWithMethod(node);
      if (res) callViewFunctions.push(res);
    }

    const expected = [
      {
        name: 'hop',
        startOffset: 33,
        endOffset: 37,
        dataKeys: ['step', 'jump'],
      },
    ];

    expect(callViewFunctions).toMatchObject(expected);
  });
});
