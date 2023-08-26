import { expect, test } from 'vitest';

import * as viewReferenceCommon from '../common/viewReference';
import * as testUtils from './testUtils';

test('Testing get call view functions', async () => {
  const code = testUtils.stripInitialNewline(`
<?php
Route::get('/foo', function () {
    return view('foo', ['name' => 'bar']);
});
`);

  const callViewFuncs = viewReferenceCommon.getCallViewFunctionsFromPHPCode(code);
  const expected = [
    {
      value: 'foo',
      range: {
        start: {
          line: 2,
          character: 11,
        },
        end: {
          line: 2,
          character: 41,
        },
      },
    },
  ];

  expect(callViewFuncs).toMatchObject(expected);
});
