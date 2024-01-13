import {
  BasicList,
  ExtensionContext,
  ListContext,
  ListItem,
  Terminal,
  commands,
  listManager,
  window,
  workspace,
} from 'coc.nvim';

import cp from 'child_process';
import fs from 'fs';
import path from 'path';

import { getPhpPath } from '../../common/shared';

let terminal: Terminal | undefined;

type ArtisanListJsonType = {
  application: {
    name: string;
    version: string;
  };
  commands: ArtisanListCommandsJsonType[];
  namespaces: {
    id: string;
    commands: string[];
  };
};

type ArtisanListCommandsJsonType = {
  name: string;
  description: string;
};

export function register(context: ExtensionContext) {
  listManager.registerList(new ArtisanList('laravelArtisan', 'artisan for coc-laravel', 'artisan'));
  listManager.registerList(new ArtisanList('laravelSailArtisan', 'sail artisan for coc-laravel', 'sail'));

  context.subscriptions.push(
    commands.registerCommand('laravel.artisan.run', () => {
      workspace.nvim.command(`CocList laravelArtisan`);
    })
  );

  context.subscriptions.push(
    commands.registerCommand('laravel.sailArtisan.run', () => {
      workspace.nvim.command(`CocList laravelSailArtisan`);
    })
  );
}

async function getArtisanOrSailPath(entryPoint: string) {
  let cmdPath = '';
  if (entryPoint === 'sail') {
    const sailPath = path.join(workspace.root, 'vendor', 'bin', entryPoint);
    if (fs.existsSync(sailPath)) {
      cmdPath = sailPath;
    }
  } else {
    const artisanPath = path.join(workspace.root, entryPoint);
    if (fs.existsSync(artisanPath)) {
      cmdPath = artisanPath;
    }
  }
  return cmdPath;
}

async function getArtisanListCommandsJson(entryPointPath: string, isSail: boolean) {
  return new Promise<string[]>((resolve) => {
    const cmd = isSail ? `"${entryPointPath}" artisan list --format json` : `"${entryPointPath}" list --format json`;
    cp.exec(cmd, (err, stdout, stderr) => {
      if (err || stderr) resolve([]);

      if (stdout.length > 0) {
        try {
          const artisanListJson = JSON.parse(stdout) as ArtisanListJsonType;
          const names = artisanListJson.commands.map((c) => c.name);
          resolve(names);
        } catch (e) {
          resolve([]);
        }
      } else {
        resolve([]);
      }
    });
  });
}

async function runArtisan(commandName: string, entryPoint: string, baseCommandName: string) {
  const artisanOrSailPath = await getArtisanOrSailPath(entryPoint);
  if (!artisanOrSailPath) return;

  const withoutArgumentsCommandList = workspace
    .getConfiguration('laravel')
    .get<string[]>('artisan.withoutArgumentsCommandList', []);

  let input = '';
  if (!withoutArgumentsCommandList.includes(commandName)) {
    const isInput = await window.showPrompt(`"${commandName}" | Add args & options?`);
    if (isInput) {
      input = await window.requestInput(`${commandName}`);
      if (!input) {
        const isExec = await window.showPrompt(`Input is empty, can I run it?`);
        if (!isExec) return;
      }
    }
  }

  const args: string[] = [];
  // Sail
  if (artisanOrSailPath.endsWith('sail')) {
    args.push(artisanOrSailPath + ' artisan');
  } else {
    args.push(artisanOrSailPath);
  }
  args.push(commandName);

  if (input) args.push(input);

  if (terminal) {
    if (terminal.bufnr) {
      await workspace.nvim.command(`bd! ${terminal.bufnr}`);
    }
    terminal.dispose();
    terminal = undefined;
  }

  terminal = await window.createTerminal({ name: baseCommandName, cwd: workspace.root });

  // Sail
  if (artisanOrSailPath.endsWith('sail')) {
    terminal.sendText(`${args.join(' ')}`);
  } else {
    const phpPath = getPhpPath();
    terminal.sendText(`"${phpPath}" ${args.join(' ')}`);
  }

  const enableSplitRight = workspace.getConfiguration('laravel').get('artisan.enableSplitRight', false);

  if (enableSplitRight) terminal.hide();
  await workspace.nvim.command('stopinsert');
  if (enableSplitRight) {
    await workspace.nvim.command(`vert bel sb ${terminal.bufnr}`);
    await workspace.nvim.command(`wincmd p`);
  }
}

export class ArtisanList extends BasicList {
  name: string;
  description: string;
  entryPoint: string;

  constructor(name: string, description: string, entryPoint: string) {
    super();

    this.name = name;
    this.description = description;
    this.entryPoint = entryPoint;

    this.addAction('execute', (item: ListItem) => {
      runArtisan(item.label, this.entryPoint, this.name);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    const listItems: ListItem[] = [];
    const entryPointPath = await getArtisanOrSailPath(this.entryPoint);
    if (!entryPointPath) return listItems;

    let isSail = false;
    // Sail
    if (entryPointPath.endsWith('sail')) isSail = true;

    const commands = await getArtisanListCommandsJson(entryPointPath, isSail);
    commands.forEach((c) => listItems.push({ label: c }));
    return listItems;
  }
}
