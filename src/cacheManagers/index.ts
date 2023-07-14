import { ExtensionContext, workspace } from 'coc.nvim';

import { SUPPORTED_LANGUAGE } from '../constant';
import { BladeCacheManager } from './features/blade';
import { type CacheManagersType } from './managerTypes';

export async function register(context: ExtensionContext) {
  const { document } = await workspace.getCurrentState();

  if (!SUPPORTED_LANGUAGE.includes(document.languageId)) return;

  const bladeCacheManager = new BladeCacheManager(workspace.root);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workspace.documents.map(async (_doc) => {
    ////console.log(`=FIRST OPEN=`);
    if (!bladeCacheManager.isInitialized()) {
      await bladeCacheManager.initial();
    }
  });

  workspace.onDidOpenTextDocument(
    async (e) => {
      if (!bladeCacheManager.isInitialized()) {
        if (!SUPPORTED_LANGUAGE.includes(e.languageId)) {
          ////console.log(`=DID OPEN=`);
          await bladeCacheManager.initial();
        }
      }
    },
    null,
    context.subscriptions
  );

  const cacheManagers: CacheManagersType = {
    managers: {
      bladeCacheManager,
    },
  };

  return cacheManagers;
}
