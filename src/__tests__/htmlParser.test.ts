import { expect, test } from 'vitest';

import * as htmlLanguageService from 'vscode-html-languageservice';
import * as htmlParser from '../parsers/html/parser';
import * as testUtils from './testUtils';

test('Html parser example test', () => {
  const code = testUtils.stripInitialNewline(`
<div>
  <main>
    <p>Example</p>
  </main>
</div>
`);

  const parsedDoc = htmlParser.parse(code);

  expect(parsedDoc.findNodeAt(9).tag).toBe('main');
  expect(parsedDoc.findNodeAt(9).start).toBe(8);
  expect(parsedDoc.findNodeAt(9).end).toBe(43);
  expect(parsedDoc.findNodeAt(9).startTagEnd).toBe(14);
  expect(parsedDoc.findNodeAt(9).endTagStart).toBe(36);
  expect(parsedDoc.findNodeAt(9).parent?.tag).toBe('div');
  expect(parsedDoc.findNodeAt(9).children[0].tag).toBe('p');
});

test('Example custom data provider', () => {
  const tags: htmlLanguageService.ITagData[] = [
    {
      name: 'foo',
      description: {
        kind: 'markdown',
        value: 'The `<foo>` element',
      },
      attributes: [
        {
          name: 'bar',
          description: {
            kind: 'markdown',
            value: 'The `<foo bar>` attribute',
          },
          values: [
            {
              name: 'baz',
              description: {
                kind: 'markdown',
                value: 'The `<foo bar="baz">` attribute',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'Bar',
      description: {
        kind: 'markdown',
        value: 'The `<Bar>` element',
      },
      attributes: [
        {
          name: 'Xoo',
        },
      ],
    },
  ];

  const globalAttributes: htmlLanguageService.IAttributeData[] = [
    { name: 'fooAttr', description: { kind: 'markdown', value: '`fooAttr` Attribute' } },
    { name: 'xattr', description: { kind: 'markdown', value: '`xattr` attributes' }, valueSet: 'x' },
  ];

  const valueSets: htmlLanguageService.IValueSet[] = [
    {
      name: 'x',
      values: [
        {
          name: 'xval',
          description: {
            kind: 'markdown',
            value: '`xval` value',
          },
        },
      ],
    },
  ];

  const provider = htmlLanguageService.newHTMLDataProvider('test', {
    version: 1,
    tags,
    globalAttributes,
    valueSets,
  });

  const languageOptions: htmlLanguageService.LanguageServiceOptions = {
    useDefaultDataProvider: false,
    customDataProviders: [provider],
  };

  const ls = htmlLanguageService.getLanguageService(languageOptions);

  const content = '<';
  const document = htmlLanguageService.TextDocument.create('test://test.html', 'html', 0, content);

  const htmlDoc = ls.parseHTMLDocument(document);

  const position: htmlLanguageService.Position = {
    line: 0,
    character: 1,
  };

  const htmlCompletionList = ls.doComplete(document, position, htmlDoc);
  expect(htmlCompletionList.items[1].label).toBe('foo');
});
