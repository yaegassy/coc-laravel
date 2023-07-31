import fs from 'fs';
import path from 'path';

import { ComposerJsonContentType, PhpNamespaceType } from './types';

export async function getComposerJsonContent(rootDir: string) {
  const composerJsonPath = path.join(rootDir, 'composer.json');
  let composerJsonContent: ComposerJsonContentType | null = null;
  try {
    composerJsonContent = JSON.parse(await fs.promises.readFile(composerJsonPath, 'utf8'));
  } catch (error) {
    composerJsonContent = null;
  }

  return composerJsonContent;
}

export function getProjectNamespacesFromComposerJson(composerJsonContent: ComposerJsonContentType) {
  const projectNamespaces: { [key: string]: string }[] = [];

  if (composerJsonContent.autoload) {
    if ('psr-4' in composerJsonContent.autoload) {
      for (const [k, v] of Object.entries(composerJsonContent.autoload['psr-4'])) {
        projectNamespaces.push({
          [k]: v,
        });
      }
    }
  }

  if (composerJsonContent['autoload-dev']) {
    if ('psr-4' in composerJsonContent['autoload-dev']) {
      for (const [k, v] of Object.entries(composerJsonContent['autoload-dev']['psr-4'])) {
        projectNamespaces.push({
          [k]: v,
        });
      }
    }
  }

  return projectNamespaces;
}

export function getRelativeClassFilePathFromNamespaces(namespaces: PhpNamespaceType[], namespaceClass: string) {
  for (const namespace of namespaces) {
    for (const [k, v] of Object.entries(namespace)) {
      if (namespaceClass.startsWith(k)) {
        const converted = namespaceClass
          .replace(/^\\\\/, '') // For FQCN, remove the first backslash
          .replace(k, v)
          .replace(/\\/g, '/'); // Replace backslash with path-style slash

        return converted + '.php';
      }
    }
  }
}
