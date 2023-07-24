import { expect, test } from 'vitest';

import fs from 'fs';
import path from 'path';

import * as bladeRouteCompletionService from '../completions/services/bladeRouteService';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test('Check route-static-method-in-blade-echo.blade', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'blade', 'route-static-method-in-blade-echo.blade.php'), {
    encoding: 'utf8',
  });

  expect(bladeRouteCompletionService.canCompletionFromContext(code, 13)).toBe(false);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 14)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 24)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 25)).toBe(false);
});

test('Check route-static-method-in-php-directive.blade', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'blade', 'route-static-method-in-php-directive.blade.php'), {
    encoding: 'utf8',
  });

  expect(bladeRouteCompletionService.canCompletionFromContext(code, 17)).toBe(false);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 18)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 28)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 29)).toBe(false);
});

test('Check route-static-method-in-directive-with-parameters', () => {
  const code = fs.readFileSync(
    path.join(FIXTURES_DIR, 'blade', 'route-static-method-in-directive-with-parameters.blade.php'),
    {
      encoding: 'utf8',
    }
  );

  expect(bladeRouteCompletionService.canCompletionFromContext(code, 15)).toBe(false);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 16)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 26)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 27)).toBe(false);
});

test('Check route-static-method-in-component', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'blade', 'route-static-method-in-component.blade.php'), {
    encoding: 'utf8',
  });

  expect(bladeRouteCompletionService.canCompletionFromContext(code, 46)).toBe(false);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 47)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 57)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 58)).toBe(false);
});
