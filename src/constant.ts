import { DocumentSelector } from 'coc.nvim';

import path from 'path';

// @ts-ignore
import { stubsVersion } from '../package.json';

export const SUPPORTED_LANGUAGE = ['php', 'blade'];

export const DOCUMENT_SELECTOR: DocumentSelector = [
  { language: 'php', scheme: 'file' },
  { language: 'blade', scheme: 'file' },
];

export const STUBS_VERSION = stubsVersion;
export const STUBS_UPSTREAM_NAME = 'phpstorm-stubs';

export const BUILTIN_FUNCTIONS_JSON_PATH = path.resolve(__dirname, '../resources/jsonData/builtinFunctions.json');

export const METHOD_DIRECTIVE_PARAMETERS = ['PUT', 'PATCH', 'DELETE'];
