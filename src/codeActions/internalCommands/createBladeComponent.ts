import { Document, ExtensionContext, Uri, commands, workspace, window } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import { getAppPath, getArtisanPath, getComposerJsonContent, getViewPath } from '../../common/shared';
import { ComposerJsonContentType, PhpNamespaceType } from '../../common/types';
import { SUPPORTED_LANGUAGE } from '../../constant';

export function register(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      'laravel.internal.createBladeComponent',
      doCommand(),
      null,
      true // internal
    )
  );
}

enum PickedItemEnum {
  Cancel = -1,
  ClassBased = 0,
  Anonymouse = 1,
  //Inline = 3, // Not required in the context of this feature
}

function doCommand() {
  return async (doc: Document, name: string) => {
    if (!SUPPORTED_LANGUAGE.includes(doc.languageId)) return;

    const pickerItems = ['class-based', 'anonymous'];
    const picked: PickedItemEnum = await window.showMenuPicker(pickerItems, `Select`);
    if (picked === PickedItemEnum.Cancel) return;

    const bladeComponentBaseDir = await getBladeComponentBaseDir();
    if (!bladeComponentBaseDir) return;

    const componentBaseDir = await getClassComponentBaseDir();
    if (!componentBaseDir) return;

    const relativeComponentClassFilePath = getRelativeComponentClassFilePathFromComponentTagName(name);
    const componentKeyName = getComponentKeyNameFromComponentTagName(name);

    const componentClassFilePath = path.join(componentBaseDir, relativeComponentClassFilePath);
    const componentClassFileDir = path.dirname(componentClassFilePath);
    try {
      await fs.promises.lstat(componentClassFileDir);
    } catch (e) {
      await fs.promises.mkdir(componentClassFileDir, { recursive: true });
    }

    const composerJsonContent = await getComposerJsonContent();
    if (!composerJsonContent) return;

    const projectNamespaces = getProjectNamespacesFromComposerJson(composerJsonContent);
    const workspaceUriPath = Uri.parse(workspace.root).toString();
    const componentClassFileUri = Uri.parse(componentClassFilePath).toString();
    const relativeFilePathFromWorkspaceRoot = componentClassFileUri.replace(workspaceUriPath + '/', '');
    const phpNamespace = getFileNamespace(projectNamespaces, relativeFilePathFromWorkspaceRoot);
    if (!phpNamespace) return;

    const phpClassName = path.basename(componentClassFilePath, '.php');

    const componentClassContent = generateComponentClassFileContent(componentKeyName, phpNamespace, phpClassName);
    if (picked === PickedItemEnum.ClassBased) {
      await fs.promises.writeFile(componentClassFilePath, componentClassContent, { encoding: 'utf8' });
    }

    const bladeComponentPath =
      path.join(bladeComponentBaseDir, name.replace('x-', '').replace('.', path.sep)) + '.blade.php';
    const bladeComponentDir = path.dirname(bladeComponentPath);
    try {
      await fs.promises.lstat(bladeComponentDir);
    } catch (e) {
      await fs.promises.mkdir(bladeComponentDir, { recursive: true });
    }

    const bladeComponentContent = generateBladeComponentFileContent();
    if (picked === PickedItemEnum.ClassBased || picked === PickedItemEnum.Anonymouse) {
      await fs.promises.writeFile(bladeComponentPath, bladeComponentContent, { encoding: 'utf8' });
    }
  };
}

async function getClassComponentBaseDir() {
  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const appPath = await getAppPath(artisanPath);
  if (!appPath) return;

  return path.join(appPath, 'View', 'Components');
}

async function getBladeComponentBaseDir() {
  const artisanPath = getArtisanPath();
  if (!artisanPath) return;

  const viewPath = await getViewPath(artisanPath);
  if (!viewPath) return;

  return path.join(viewPath, 'components');
}

function getRelativeComponentClassFilePathFromComponentTagName(name: string) {
  const stripComponentPrefix = name.replace(/^x-/, '');
  const splitName = stripComponentPrefix.split('.');
  const capitalizedArr = splitName.map((v) => capitalize(v));
  const relativeComponentClassFilePath = capitalizedArr.join(path.sep) + '.php';

  return relativeComponentClassFilePath;
}

function getComponentKeyNameFromComponentTagName(name: string) {
  return 'components' + '.' + name.replace('x-', '');
}

function generateComponentClassFileContent(componentKeyName: string, phpNamespace: string, className: string) {
  // MEMO: \ -> \\
  const contens = stripInitialNewline(`
<?php

namespace ${phpNamespace};

use Closure;
use Illuminate\\Contracts\\View\\View;
use Illuminate\\View\\Component;

class ${className} extends Component
{
    /**
     * Create a new component instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('${componentKeyName}');
    }
}
`);

  return contens;
}

function generateBladeComponentFileContent() {
  // MEMO: \ -> \\
  const contens = stripInitialNewline(`
<div>
    <!--Generated from coc-laravel  -->
</div>
`);

  return contens;
}

function getProjectNamespacesFromComposerJson(composerJsonContent: ComposerJsonContentType) {
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

function getFileNamespace(namespaces: PhpNamespaceType[], relativeFilePath: string) {
  const fileName = relativeFilePath.split('/').slice(-1)[0];

  for (const namespace of namespaces) {
    for (const k of Object.keys(namespace)) {
      if (relativeFilePath.startsWith(namespace[k])) {
        const fileNamespace = relativeFilePath
          .replace(namespace[k], k)
          .replace(/\//g, '\\')
          .replace(fileName, '')
          .replace(/\\$/, '');

        return fileNamespace;
      }
    }
  }
}

function stripInitialNewline(text: string) {
  return text.replace(/^\n/, '');
}

function capitalize(s: string) {
  if (typeof s !== 'string' || !s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
