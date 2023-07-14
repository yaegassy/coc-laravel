import { expect, test } from 'vitest';

import { BladeDocument } from 'stillat-blade-parser/out/document/bladeDocument';
import { BladeComponentNode, BladeEchoNode, DirectiveNode } from 'stillat-blade-parser/out/nodes/nodes';
import { Position as ParserPosition, Range as ParserRange } from 'stillat-blade-parser/out/nodes/position';

import fs from 'fs';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test('Check the count of {{ ... }} nodes', () => {
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'blade', 'basic.blade.php'), { encoding: 'utf8' });

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
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'blade', 'basic.blade.php'), { encoding: 'utf8' });

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
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'blade', 'basic.blade.php'), { encoding: 'utf8' });

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
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'blade', 'basic.blade.php'), { encoding: 'utf8' });

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
  const code = fs.readFileSync(path.join(FIXTURES_DIR, 'blade', 'component-contain.blade.php'), {
    encoding: 'utf8',
  });

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

// TODO: And more...
