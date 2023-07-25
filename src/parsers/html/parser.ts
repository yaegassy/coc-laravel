import * as htmlLs from 'vscode-html-languageservice';

export function parse(code: string) {
  const ls = htmlLs.getLanguageService();
  const document = htmlLs.TextDocument.create('dummy://dummy.html', 'html', 0, code);
  return ls.parseHTMLDocument(document);
}
