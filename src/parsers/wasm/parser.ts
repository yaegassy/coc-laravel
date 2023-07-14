import Parser = require('web-tree-sitter');

export async function initializeWasmParser(wasmPath: string): Promise<Parser> {
  await Parser.init();
  const parser = new Parser();
  const Lang = await Parser.Language.load(wasmPath);
  parser.setLanguage(Lang);

  return parser;
}
