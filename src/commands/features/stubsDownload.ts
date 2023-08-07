import { ExtensionContext, commands, window, workspace } from 'coc.nvim';

import { randomBytes } from 'crypto';
import extract from 'extract-zip';
import fs from 'fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import path from 'path';
import { rimrafSync } from 'rimraf';
import stream from 'stream';
import util from 'util';

import { STUBS_VENDOR_NAME, STUBS_VERSION } from '../../constant';

const DOWNLOAD_STUBS_VERSION = getDownloadStubsVersion();

const pipeline = util.promisify(stream.pipeline);
const agent = process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy as string) : null;

export async function register(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand(`laravel.stubs.download`, handleDownloadStubs(context)));
}

function getDownloadStubsVersion() {
  const customStubsVersion = workspace.getConfiguration('laravel').get('stubs.customVersion', '');
  if (customStubsVersion) return customStubsVersion;
  return STUBS_VERSION;
}

function handleDownloadStubs(context: ExtensionContext) {
  return async () => {
    const msg = `Download/Redownload sutbs?`;
    const ret = await window.showPrompt(msg);
    if (ret) {
      await doDownload(context).catch(() => {});
      await doExtract(context).catch(() => {});
      window.showInformationMessage(`Successfully downloaded`);

      setTimeout(() => {
        commands.executeCommand('editor.action.restart');
      }, 1000);
    } else {
      //
    }
  };
}

async function doDownload(context: ExtensionContext): Promise<void> {
  const statusItem = window.createStatusBarItem(0, { progress: true });
  statusItem.text = `Downloading ${STUBS_VENDOR_NAME}`;
  statusItem.show();

  const downloadUrl = `https://github.com/JetBrains/phpstorm-stubs/archive/refs/tags/${DOWNLOAD_STUBS_VERSION}.zip`;

  // @ts-ignore
  const resp = await fetch(downloadUrl, { agent });
  if (!resp.ok) {
    statusItem.hide();
    throw new Error('Download failed');
  }

  let cur = 0;
  const len = Number(resp.headers.get('content-length'));
  resp.body.on('data', (chunk: Buffer) => {
    cur += chunk.length;
    const p = ((cur / len) * 100).toFixed(2);
    statusItem.text = `${p}% Downloading ${STUBS_VENDOR_NAME}`;
  });

  const _path = path.join(context.storagePath, `${STUBS_VENDOR_NAME}.zip`);
  const randomHex = randomBytes(5).toString('hex');
  const tempFile = path.join(context.storagePath, `${STUBS_VENDOR_NAME}-${randomHex}.zip`);

  const destFileStream = fs.createWriteStream(tempFile, { mode: 0o755 });
  await pipeline(resp.body, destFileStream);
  await new Promise<void>((resolve) => {
    destFileStream.on('close', resolve);
    destFileStream.destroy();
    setTimeout(resolve, 1000);
  });

  await fs.promises.unlink(_path).catch((err) => {
    if (err.code !== 'ENOENT') throw err;
  });
  await fs.promises.rename(tempFile, _path);

  statusItem.hide();
}

async function doExtract(context: ExtensionContext) {
  const zipPath = path.join(context.storagePath, `${STUBS_VENDOR_NAME}.zip`);
  const extractPath = path.join(context.storagePath);
  const extractedFilenames: string[] = [];
  const targetPath = path.join(context.storagePath, `${STUBS_VENDOR_NAME}`);

  rimrafSync(targetPath);

  if (fs.existsSync(zipPath)) {
    await extract(zipPath, {
      dir: extractPath,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onEntry(entry, _zipfile) {
        extractedFilenames.push(entry.fileName);
      },
    });

    const extractedBaseDirName = extractedFilenames[0];
    const extractedBasePath = path.join(context.storagePath, extractedBaseDirName);

    // Add text file for tag version identification
    const versionTxtFilePath = path.join(extractedBasePath, 'version.txt');
    fs.writeFileSync(versionTxtFilePath, `tag: ${DOWNLOAD_STUBS_VERSION}`);

    fs.renameSync(extractedBasePath, targetPath);
    rimrafSync(zipPath);
  }
}
