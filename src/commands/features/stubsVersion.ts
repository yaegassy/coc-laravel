import { ExtensionContext, commands, window } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import { STUBS_VENDOR_NAME } from '../../constant';

export function register(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(`laravel.stubs.version`, async () => {
      const versionTextPath = path.join(context.storagePath, STUBS_VENDOR_NAME, 'version.txt');
      if (fs.existsSync(versionTextPath)) {
        const version = fs.readFileSync(versionTextPath, { encoding: 'utf8' });
        window.showInformationMessage(version);
      }
    })
  );
}
