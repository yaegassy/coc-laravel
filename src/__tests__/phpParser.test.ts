import { expect, test } from 'vitest';

import fs from 'fs';
import path from 'path';

import * as validationService from '../completions/services/validationService';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test('Determine if the FormRequest class is an inherited class', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'php', 'validation_class_extends_form_request.php'), {
    encoding: 'utf8',
  });
  const ast = validationService.getAst(code);

  const exists = validationService.existsExtendsFormRequest(ast);
  expect(exists).toBe(true);
});

// TODO: And more...
