import { ExtensionContext, commands, window } from 'coc.nvim';

import path from 'path';
import fs from 'fs';

import { STUBS_UPSTREAM_NAME } from '../../constant';

export function register(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(`laravel.stubs.version`, async () => {
      const versionTextPath = path.join(context.storagePath, STUBS_UPSTREAM_NAME, 'version.txt');
      if (fs.existsSync(versionTextPath)) {
        const version = fs.readFileSync(versionTextPath, { encoding: 'utf8' });
        window.showInformationMessage(version);
      }
    })
  );
}
