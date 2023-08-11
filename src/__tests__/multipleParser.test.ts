import { expect, test } from 'vitest';

import * as bladeRouteCompletionService from '../completions/services/bladeRouteService';
import * as testUtils from './testUtils';

test('Check route-static-method-in-blade-echo.blade', () => {
  const code = testUtils.stripInitialNewline(`
{{ Route::has('register') }}
`);

  expect(bladeRouteCompletionService.canCompletionFromContext(code, 13)).toBe(false);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 14)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 24)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 25)).toBe(false);
});

test('Check route-static-method-in-php-directive.blade', () => {
  const code = testUtils.stripInitialNewline(`
@php
  Route::has('register');
@endphp
`);

  expect(bladeRouteCompletionService.canCompletionFromContext(code, 17)).toBe(false);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 18)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 28)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 29)).toBe(false);
});

test('Check route-static-method-in-directive-with-parameters', () => {
  const code = testUtils.stripInitialNewline(`
@if (Route::has('register'))
@endif
`);

  expect(bladeRouteCompletionService.canCompletionFromContext(code, 15)).toBe(false);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 16)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 26)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 27)).toBe(false);
});

test('Check route-static-method-in-component', () => {
  const code = testUtils.stripInitialNewline(`
<x-app-layout>
  <x-sample :message="Route::has('register')" />
</x-app-layout>
`);

  expect(bladeRouteCompletionService.canCompletionFromContext(code, 46)).toBe(false);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 47)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 57)).toBe(true);
  expect(bladeRouteCompletionService.canCompletionFromContext(code, 58)).toBe(false);
});
