import { DocumentSelector } from 'coc.nvim';

// @ts-ignore
import { stubsVersion } from '../package.json';

export const SUPPORTED_LANGUAGE = ['php', 'blade'];

export const DOCUMENT_SELECTOR: DocumentSelector = [
  { language: 'php', scheme: 'file' },
  { language: 'blade', scheme: 'file' },
];

export const STUBS_VERSION = stubsVersion;
export const STUBS_VENDOR_NAME = 'phpstorm-stubs';

export const METHOD_DIRECTIVE_PARAMETERS = ['PUT', 'PATCH', 'DELETE'];
