import { expect, test } from 'vitest';

import { BladeDocument } from 'stillat-blade-parser/out/document/bladeDocument';
import { BladeComponentNode, BladeEchoNode, DirectiveNode } from 'stillat-blade-parser/out/nodes/nodes';
import { Position as ParserPosition, Range as ParserRange } from 'stillat-blade-parser/out/nodes/position';
import * as bladeCommon from '../common/blade';

import * as testUtils from './testUtils';

test('Check the count of {{ ... }} nodes', () => {
  const code = testUtils.stripInitialNewline(`
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased">
        <div class="min-h-screen bg-gray-100">
            @include('layouts.navigation')

            <!-- Page Heading -->
            @if (isset($header))
                <header class="bg-white shadow">
                    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {{ $header }}
                    </div>
                </header>
            @endif

            <!-- Page Content -->
            <main>
                {{ $slot }}


                @php
                  $isActive = false;
                  $hasError = true;
                @endphp
            </main>
        </div>
    </body>
</html>
`);

  const assertionNodes: BladeEchoNode[] = [];

  const parsedBladeDoc = BladeDocument.fromText(code);
  parsedBladeDoc.getAllNodes().forEach((node) => {
    if (node instanceof BladeEchoNode) {
      assertionNodes.push(node);
    }
  });

  expect(assertionNodes.length).toBe(5);
});

test('Check the positions of the parameters of the target directive', () => {
  const code = testUtils.stripInitialNewline(`
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased">
        <div class="min-h-screen bg-gray-100">
            @include('layouts.navigation')

            <!-- Page Heading -->
            @if (isset($header))
                <header class="bg-white shadow">
                    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {{ $header }}
                    </div>
                </header>
            @endif

            <!-- Page Content -->
            <main>
                {{ $slot }}


                @php
                  $isActive = false;
                  $hasError = true;
                @endphp
            </main>
        </div>
    </body>
</html>
`);

  const assertionData: ParserRange[] = [];

  const parsedBladeDoc = BladeDocument.fromText(code);
  parsedBladeDoc.getAllNodes().forEach((node) => {
    if (node instanceof DirectiveNode) {
      if (node.directiveName === 'include') {
        if (node.directiveParametersPosition) {
          assertionData.push(node.directiveParametersPosition);
        }
      }
    }
  });

  expect(assertionData[0].start).toEqual({
    index: 725,
    offset: 725,
    line: 19,
    char: 21,
  });

  expect(assertionData[0].end).toEqual({
    index: 747,
    offset: 747,
    line: 19,
    char: 43,
  });
});

test('Check the contents of the if directive parameter', () => {
  const code = testUtils.stripInitialNewline(`
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased">
        <div class="min-h-screen bg-gray-100">
            @include('layouts.navigation')

            <!-- Page Heading -->
            @if (isset($header))
                <header class="bg-white shadow">
                    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {{ $header }}
                    </div>
                </header>
            @endif

            <!-- Page Content -->
            <main>
                {{ $slot }}


                @php
                  $isActive = false;
                  $hasError = true;
                @endphp
            </main>
        </div>
    </body>
</html>
`);

  const assertionData: string[] = [];

  const parsedBladeDoc = BladeDocument.fromText(code);
  parsedBladeDoc.getAllNodes().forEach((node) => {
    if (node instanceof DirectiveNode) {
      if (node.directiveName === 'if') {
        if (node.directiveParametersPosition) {
          assertionData.push(node.directiveParameters);
        }
      }
    }
  });

  expect(assertionData[0]).toBe('(isset($header))');
});

test('Get the location of the endphp directive based on the php directive.', () => {
  const code = testUtils.stripInitialNewline(`
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased">
        <div class="min-h-screen bg-gray-100">
            @include('layouts.navigation')

            <!-- Page Heading -->
            @if (isset($header))
                <header class="bg-white shadow">
                    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {{ $header }}
                    </div>
                </header>
            @endif

            <!-- Page Content -->
            <main>
                {{ $slot }}


                @php
                  $isActive = false;
                  $hasError = true;
                @endphp
            </main>
        </div>
    </body>
</html>
`);

  const assertionData: ParserPosition[] = [];

  const parsedBladeDoc = BladeDocument.fromText(code);
  parsedBladeDoc.getAllNodes().forEach((node) => {
    if (node instanceof DirectiveNode) {
      if (node.directiveName === 'php') {
        const endPhp = node.getFinalClosingDirective();
        if (endPhp.startPosition) {
          assertionData.push(endPhp.startPosition);
        }
      }
    }
  });

  expect(assertionData[0]).toEqual({
    index: 1248,
    offset: 1248,
    line: 38,
    char: 18,
  });
});

test('Various parsing examples of blade component', () => {
  const code = testUtils.stripInitialNewline(`
<section>
    <header>
        <h2 class="text-lg font-medium text-gray-900">
            {{ __('Profile Information') }}
        </h2>

        <p class="mt-1 text-sm text-gray-600">
            {{ __("Update your account's profile information and email address.") }}
        </p>
    </header>

    <form id="send-verification" method="post" action="{{ route('verification.send') }}">
        @csrf
    </form>

    <form method="post" action="{{ route('profile.update') }}" class="mt-6 space-y-6">
        @csrf
        @method('patch')

        <div>
            <x-input-label for="name" :value="__('Name')" />
            <x-text-input id="name" name="name" type="text" class="mt-1 block w-full" :value="old('name', $user->name)" required autofocus autocomplete="name" />
            <x-input-error class="mt-2" :messages="$errors->get('name')" />
        </div>

        <div>
            <x-input-label for="email" :value="__('Email')" />
            <x-text-input id="email" name="email" type="email" class="mt-1 block w-full" :value="old('email', $user->email)" required autocomplete="username" />
            <x-input-error class="mt-2" :messages="$errors->get('email')" />

            @if ($user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail && ! $user->hasVerifiedEmail())
                <div>
                    <p class="text-sm mt-2 text-gray-800">
                        {{ __('Your email address is unverified.') }}

                        <button form="send-verification" class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {{ __('Click here to re-send the verification email.') }}
                        </button>
                    </p>

                    @if (session('status') === 'verification-link-sent')
                        <p class="mt-2 font-medium text-sm text-green-600">
                            {{ __('A new verification link has been sent to your email address.') }}
                        </p>
                    @endif
                </div>
            @endif
        </div>

        <div class="flex items-center gap-4">
            <x-primary-button>{{ __('Save') }}</x-primary-button>

            @if (session('status') === 'profile-updated')
                <p
                    x-data="{ show: true }"
                    x-show="show"
                    x-transition
                    x-init="setTimeout(() => show = false, 2000)"
                    class="text-sm text-gray-600"
                >{{ __('Saved.') }}</p>
            @endif
        </div>
    </form>
</section>
`);

  const assertionComponentNames: string[] = [];
  const assertionHasParmeterses: boolean[] = [];
  const assertionParmetersBindValues: string[] = [];
  const assertionParmetersBindValuePositions: ParserRange[] = [];

  const parsedBladeDoc = BladeDocument.fromText(code);

  parsedBladeDoc.getAllNodes().forEach((node) => {
    if (node instanceof BladeComponentNode) {
      assertionComponentNames.push(node.getComponentName());
      assertionHasParmeterses.push(node.hasParameters);

      if (node.hasParameters) {
        for (const p of node.parameters) {
          if (p.name.startsWith(':')) {
            assertionParmetersBindValues.push(p.value);
            if (p.valuePosition) {
              assertionParmetersBindValuePositions.push(p.valuePosition);
            }
          }
        }
      }
    }
  });

  expect(assertionComponentNames[0]).toBe('input-label'); // Name without `x-`
  expect(assertionHasParmeterses[0]).toBe(true);
  expect(assertionParmetersBindValues[0]).toBe("__('Name')");
  expect(assertionParmetersBindValuePositions[0].start).toEqual({
    char: 46,
    index: 600,
    line: 21,
    offset: 600,
  });
  expect(assertionParmetersBindValuePositions[0].end).toEqual({
    char: 57,
    index: 611,
    line: 21,
    offset: 611,
  });
});

test('Is editor offset in blade php region', async () => {
  const code = testUtils.stripInitialNewline(`
<x-input-label for="name" :value="__('Name')" />
@if (session('status') === 'verification-link-sent')
@endif
{{  }}
<?php
  echo "test";
?>
`);

  const editorOffset = 33;
  const res = await bladeCommon.isEditorOffsetInBladePhpRelatedRegion(code, editorOffset);

  expect(res).toBe(true);
});
