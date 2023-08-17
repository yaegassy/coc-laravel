import { BasicList, ExtensionContext, ListContext, ListItem, commands, listManager, window, workspace } from 'coc.nvim';

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
}

const PICKER_ITEMS = [
  //'ALL',
  'blade',
  'viewReference',
  'component',
  'livewire',
  'translate',
  'phpClass',
  'phpFunction',
  'phpConstant',
];

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  const { document } = await workspace.getCurrentState();
  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  listManager.registerList(
    new ProjectFinderList('laravelProjectFinder', 'project finder for coc-laravel', projectManager)
  );

  context.subscriptions.push(
    commands.registerCommand('laravel.project.finder', async () => {
      const picked: PickedItemEnum = await window.showMenuPicker(PICKER_ITEMS, `Select`);
      if (picked === PickedItemEnum.Cancel) return;

      workspace.nvim.command(`CocList laravelProjectFinder ${PICKER_ITEMS[picked]}`);
    })
  );
}

export class ProjectFinderList extends BasicList {
  name: string;
  description: string;
  projectManager: ProjectManagerType;

  constructor(name: string, description: string, projectManager: ProjectManagerType) {
    super();

    this.name = name;
    this.description = description;
    this.projectManager = projectManager;

    this.addAction('execute', (item: ListItem) => {
      if (item.data) doRender(JSON.stringify(item.data, null, 2));
    });
  }

  public async loadItems(context: ListContext): Promise<ListItem[]> {
    const listItems: ListItem[] = [];

    if (context.args.includes('blade')) {
      const storeList = Array.from(this.projectManager.bladeProjectManager.bladeFilelist());
      storeList.forEach((s) => listItems.push({ label: s[0], data: s }));
    } else if (context.args.includes('viewReference')) {
      const storeList = Array.from(this.projectManager.viewReferenceProjectManager.list());
      storeList.forEach((s) => listItems.push({ label: s[0], data: s }));
    } else if (context.args.includes('component')) {
      const storeList = Array.from(this.projectManager.bladeProjectManager.componentList());
      storeList.forEach((s) => listItems.push({ label: s[0], data: s }));
    } else if (context.args.includes('livewire')) {
      const storeList = Array.from(this.projectManager.livewireProjectManager.list());
      storeList.forEach((s) => listItems.push({ label: s[0], data: s }));
    } else if (context.args.includes('translate')) {
      const storeList = Array.from(this.projectManager.translationProjectManager.list());
      storeList.forEach((s) => listItems.push({ label: s[0], data: s }));
    } else if (context.args.includes('phpClass')) {
      const storeList = Array.from(this.projectManager.phpClassProjectManager.list());
      storeList.forEach((s) => listItems.push({ label: s[0], data: s }));
    } else if (context.args.includes('phpFunction')) {
      const storeList = Array.from(this.projectManager.phpFunctionProjectManager.list());
      storeList.forEach((s) => listItems.push({ label: s[0], data: s }));
    } else if (context.args.includes('phpConstant')) {
      const storeList = Array.from(this.projectManager.phpConstantProjectManager.list());
      storeList.forEach((s) => listItems.push({ label: s[0], data: s }));
    }

    return listItems;
  }
}

async function doRender(contents: string) {
  await workspace.nvim
    .command(
      'belowright vnew laravel-project-finder | setlocal buftype=nofile bufhidden=hide noswapfile filetype=markdown'
    )
    .then(async () => {
      const buf = await workspace.nvim.buffer;
      buf.setLines(contents.split('\n'), { start: 0, end: -1 });
    });
}
