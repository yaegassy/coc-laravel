import { ExtensionContext, commands, window, workspace } from 'coc.nvim';

import { SUPPORTED_LANGUAGE } from '../../constant';
import { type ProjectManagerType } from '../../projects/types';

enum PickedItemEnum {
  Cancel = -1,
  All = 0,
  Blade = 1,
  ViewReference = 2,
  Component = 3,
  Livewire = 4,
  Translation = 5,
  PHPClass = 6,
  PHPFunction = 7,
  PHPConstant = 8,
  EloquentModel = 9,
}

const PICKER_ITEMS = [
  'ALL',
  'blade',
  'viewReference',
  'component',
  'livewire',
  'translate',
  'phpClass',
  'phpFunction',
  'phpConstant',
  'eloquentModel',
];

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  context.subscriptions.push(
    commands.registerCommand('laravel.project.stats', async () => {
      const { document } = await workspace.getCurrentState();
      if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

      const picked: PickedItemEnum = await window.showMenuPicker(PICKER_ITEMS, `Select`);
      if (picked === PickedItemEnum.Cancel) return;

      runStats(picked, projectManager);
    })
  );
}

async function runStats(picked: PickedItemEnum, projectManager: ProjectManagerType) {
  let contents = '';
  switch (picked) {
    case PickedItemEnum.All:
      contents = summaryContent(contents, projectManager);
      contents = targetContent(contents, 'Blade', Array.from(projectManager.bladeProjectManager.bladeFilelist()));
      contents = targetContent(
        contents,
        'View Reference',
        Array.from(projectManager.viewReferenceProjectManager.list())
      );
      contents = targetContent(contents, 'Component', Array.from(projectManager.bladeProjectManager.componentList()));
      contents = targetContent(contents, 'Livewire', Array.from(projectManager.livewireProjectManager.list()));
      contents = targetContent(contents, 'Translation', Array.from(projectManager.translationProjectManager.list()));
      contents = targetContent(contents, 'PHP Class', Array.from(projectManager.phpClassProjectManager.list()));
      contents = targetContent(contents, 'PHP Function', Array.from(projectManager.phpFunctionProjectManager.list()));
      contents = targetContent(contents, 'PHP Constant', Array.from(projectManager.phpConstantProjectManager.list()));
      contents = targetContent(
        contents,
        'Eloquent Model',
        Array.from(projectManager.eloquentModelProjectManager.list())
      );
      break;

    case PickedItemEnum.Blade:
      contents = targetContent(contents, 'Blade', Array.from(projectManager.bladeProjectManager.bladeFilelist()));
      break;

    case PickedItemEnum.ViewReference:
      contents = targetContent(
        contents,
        'View Reference',
        Array.from(projectManager.viewReferenceProjectManager.list())
      );
      break;

    case PickedItemEnum.Component:
      contents = targetContent(contents, 'Component', Array.from(projectManager.bladeProjectManager.componentList()));
      break;

    case PickedItemEnum.Livewire:
      contents = targetContent(contents, 'Livewire', Array.from(projectManager.livewireProjectManager.list()));
      break;

    case PickedItemEnum.Translation:
      contents = targetContent(contents, 'Translation', Array.from(projectManager.translationProjectManager.list()));
      break;

    case PickedItemEnum.PHPClass:
      contents = targetContent(contents, 'PHP Class', Array.from(projectManager.phpClassProjectManager.list()));
      break;

    case PickedItemEnum.PHPFunction:
      contents = targetContent(contents, 'PHP Function', Array.from(projectManager.phpFunctionProjectManager.list()));
      break;

    case PickedItemEnum.PHPConstant:
      contents = targetContent(contents, 'PHP Constant', Array.from(projectManager.phpConstantProjectManager.list()));
      break;

    case PickedItemEnum.EloquentModel:
      contents = targetContent(
        contents,
        'Eloquent Model',
        Array.from(projectManager.eloquentModelProjectManager.list())
      );
      break;

    default:
      break;
  }

  if (contents.length === 0) return;
  doRender(contents);
}

async function doRender(contents: string) {
  await workspace.nvim
    .command(
      'belowright vnew laravel-project-stats | setlocal buftype=nofile bufhidden=hide noswapfile filetype=markdown'
    )
    .then(async () => {
      const buf = await workspace.nvim.buffer;
      buf.setLines(contents.split('\n'), { start: 0, end: -1 });
    });
}

function summaryContent(contents: string, projectManager: ProjectManagerType) {
  contents += '### Summary\n\n';

  contents += `- Blade: ${projectManager.bladeProjectManager.bladeMapStore.size}\n`;
  contents += `- View Reference: ${projectManager.viewReferenceProjectManager.viewReferenceMapStore.size}\n`;
  contents += `- Component: ${projectManager.bladeProjectManager.componentMapStore.size}\n`;
  contents += `- Livewire: ${projectManager.livewireProjectManager.livewireMapStore.size}\n`;
  contents += `- Translation: ${projectManager.translationProjectManager.mapStore.size}\n`;
  contents += `- PHP Class: ${projectManager.phpClassProjectManager.phpClassMapStore.size}\n`;
  contents += `- PHP Function: ${projectManager.phpFunctionProjectManager.phpFunctionMapStore.size}\n`;
  contents += `- PHP Constant: ${projectManager.phpConstantProjectManager.phpConstantMapStore.size}\n`;
  contents += `- Eloquent Model: ${projectManager.eloquentModelProjectManager.eloquentModelMapStore.size}\n`;
  contents += `\n`;

  return contents;
}

function targetContent(contents: string, label: string, storeList: any[]) {
  contents += `### ${label}\n\n` + '```json\n' + JSON.stringify(storeList, null, 2) + '\n```\n\n';

  return contents;
}
