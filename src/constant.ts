import { DocumentSelector } from 'coc.nvim';

import path from 'path';

export const SUPPORTED_LANGUAGE = ['php', 'blade'];

export const DOCUMENT_SELECTOR: DocumentSelector = [
  { language: 'php', scheme: 'file' },
  { language: 'blade', scheme: 'file' },
];

export const BUILTIN_FUNCTIONS_JSON_PATH = path.resolve(__dirname, '../resources/jsonData/builtinFunctions.json');

export const METHOD_DIRECTIVE_PARAMETERS = ['PUT', 'PATCH', 'DELETE'];
