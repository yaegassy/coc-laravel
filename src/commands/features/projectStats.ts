import { ExtensionContext, commands, workspace } from 'coc.nvim';

import { SUPPORTED_LANGUAGE } from '../../constant';
import { type ProjectManagerType } from '../../projects/types';

export async function register(context: ExtensionContext, projectManagers: ProjectManagerType) {
  context.subscriptions.push(
    commands.registerCommand('laravel.project.stats', async () => {
      const { document } = await workspace.getCurrentState();
      if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

      let outputText = '';

      const bladeProjectList = Array.from(projectManagers.bladeProjectManager.bladeFilelist());
      const blaceProjectContent =
        '### Blade\n\n' + '```json\n' + JSON.stringify(bladeProjectList, null, 2) + '\n```\n\n';

      const viewReferenceProjectList = Array.from(projectManagers.viewReferenceProjectManager.list());
      const viewReferenceContent =
        '### View Reference\n\n' + '```json\n' + JSON.stringify(viewReferenceProjectList, null, 2) + '\n```\n\n';

      const componentProjectList = Array.from(projectManagers.bladeProjectManager.componentList());
      const componentProjectContent =
        '### Component\n\n' + '```json\n' + JSON.stringify(componentProjectList, null, 2) + '\n```\n\n';

      const livewireProjectList = Array.from(projectManagers.livewireProjectManager.list());
      const livewireProjectContent =
        '### Livewire\n\n' + '```json\n' + JSON.stringify(livewireProjectList, null, 2) + '\n```\n\n';

      const translationProjectList = Array.from(projectManagers.translationProjectManager.list());
      const translationProjectContent =
        '### Translation\n\n' + '```json\n' + JSON.stringify(translationProjectList, null, 2) + '\n```\n\n';

      const phpClassProjectList = Array.from(projectManagers.phpClassProjectManager.list());
      const phpClassProjectContent =
        '### PHP Class\n\n' + '```json\n' + JSON.stringify(phpClassProjectList, null, 2) + '\n```\n\n';

      const phpFunctionProjectList = Array.from(projectManagers.phpFunctionProjectManager.list());
      const phpFunctionProjectContent =
        '### PHP Function\n\n' + '```json\n' + JSON.stringify(phpFunctionProjectList, null, 2) + '\n```\n\n';

      const phpConstantProjectList = Array.from(projectManagers.phpConstantProjectManager.list());
      const phpConstantProjectContent =
        '### PHP Constant\n\n' + '```json\n' + JSON.stringify(phpConstantProjectList, null, 2) + '\n```\n\n';

      outputText +=
        blaceProjectContent +
        viewReferenceContent +
        componentProjectContent +
        livewireProjectContent +
        translationProjectContent +
        phpClassProjectContent +
        phpFunctionProjectContent +
        phpConstantProjectContent;

      await workspace.nvim
        .command('belowright vnew blade-stats | setlocal buftype=nofile bufhidden=hide noswapfile filetype=markdown')
        .then(async () => {
          const buf = await workspace.nvim.buffer;
          buf.setLines(outputText.split('\n'), { start: 0, end: -1 });
        });
    })
  );
}
