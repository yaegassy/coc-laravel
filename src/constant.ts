import { DocumentSelector } from 'coc.nvim';

export const SUPPORTED_LANGUAGE = ['php', 'blade'];

export const DOCUMENT_SELECTOR: DocumentSelector = [
  { language: 'php', scheme: 'file' },
  { language: 'blade', scheme: 'file' },
];
