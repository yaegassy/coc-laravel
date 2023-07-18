import { ExtensionContext, commands, workspace } from 'coc.nvim';

import { SUPPORTED_LANGUAGE } from '../constant';
import { type ProjectManagerType } from '../projects/types';

export async function register(context: ExtensionContext, projectManagers: ProjectManagerType) {
  context.subscriptions.push(
    commands.registerCommand('laravel.project.stats', async () => {
      const { document } = await workspace.getCurrentState();
      if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

      let outputText = '';

      const bladeProjectList = Array.from(projectManagers.bladeProjectManager.bladeFilelist());
      const blaceProjectContent =
        '### Blade\n\n' + '```json\n' + JSON.stringify(bladeProjectList, null, 2) + '\n```\n\n';

      const componentProjectList = Array.from(projectManagers.bladeProjectManager.componentList());
      const componentProjectContent =
        '### Component\n\n' + '```json\n' + JSON.stringify(componentProjectList, null, 2) + '\n```\n\n';

      const translationProjectList = Array.from(projectManagers.translationProjectManager.list());
      const translationProjectContent =
        '### Translation\n\n' + '```json\n' + JSON.stringify(translationProjectList, null, 2) + '\n```\n\n';

      outputText += blaceProjectContent + componentProjectContent + translationProjectContent;

      await workspace.nvim
        .command('belowright vnew blade-stats | setlocal buftype=nofile bufhidden=hide noswapfile filetype=markdown')
        .then(async () => {
          const buf = await workspace.nvim.buffer;
          buf.setLines(outputText.split('\n'), { start: 0, end: -1 });
        });
    })
  );
}
