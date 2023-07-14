import { ExtensionContext, commands, workspace } from 'coc.nvim';

import { type BladeCacheManagerType } from '../cacheManagers/managerTypes';

import { SUPPORTED_LANGUAGE } from '../constant';

export async function register(context: ExtensionContext, bladeCacheManager: BladeCacheManagerType) {
  context.subscriptions.push(
    commands.registerCommand('laravel.stats', async () => {
      const { document } = await workspace.getCurrentState();
      if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

      const cacheList = Array.from(bladeCacheManager.list());
      const outputText = JSON.stringify(cacheList, null, 2);

      await workspace.nvim
        .command('belowright vnew blade-stats | setlocal buftype=nofile bufhidden=hide noswapfile filetype=json')
        .then(async () => {
          const buf = await workspace.nvim.buffer;
          buf.setLines(outputText.split('\n'), { start: 0, end: -1 });
        });
    })
  );
}
