import { workspace, Uri } from 'coc.nvim';

import cp from 'child_process';
import fs from 'fs';
import path from 'path';

export function getPhpPath() {
  const phpPath = workspace.getConfiguration('laravel').get('environment.phpPath', '');
  if (phpPath) return phpPath;

  return 'php';
}

export function getArtisanPath() {
  try {
    const artisanPath = path.join(workspace.root, 'artisan');
    if (fs.existsSync(artisanPath)) {
      return artisanPath;
    }
  } catch {
    return undefined;
  }
}

/**
 * @param code - Receive a code that uses "single" quotes
 * @param artisanPath - Path to artisan command
 */
export async function runTinker(code: string, artisanPath: string) {
  const phpPath = getPhpPath();

  const r = new Promise<string | undefined>((resolve, reject) => {
    cp.exec(`"${phpPath}" "${artisanPath}" tinker --execute="${code}"`, (err, stdout, stderr) => {
      if (err) reject(undefined);

      if (stdout.length > 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    });
  }).catch(() => {
    return undefined;
  });
  return r;
}

export async function runRouteListJson(artisanPath: string) {
  const phpPath = getPhpPath();

  const r = new Promise<string | undefined>((resolve, reject) => {
    cp.exec(`"${phpPath}" "${artisanPath}" route:list --json`, (err, stdout, stderr) => {
      if (err) reject(undefined);

      if (stdout.length > 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    });
  }).catch(() => {
    return undefined;
  });
  return r;
}

export async function getAppPath(artisanPath: string) {
  const getAppPathPHPCode = `echo json_encode(app()->path())`;
  const resAppPath = await runTinker(getAppPathPHPCode, artisanPath);
  if (!resAppPath) return;
  const appPath = resAppPath
    .replace(/["']/g, '')
    .replace(/\\/g, '') // remove json quate
    .replace(/\\\\/g, '/') // replace window path to posix path
    .replace('\n', '');

  return appPath;
}

export async function getViewPath(artisanPath: string) {
  const getViewPathPHPCode = `echo json_encode(app()->viewPath())`;
  const resViewPath = await runTinker(getViewPathPHPCode, artisanPath);
  if (!resViewPath) return;
  const viewPath = resViewPath
    .replace(/["']/g, '')
    .replace(/\\/g, '') // remove json quate
    .replace(/\\\\/g, '/') // replace window path to posix path
    .replace('\n', '');

  return viewPath;
}

export async function getLangPath(artisanPath: string) {
  const getLangPathPHPCode = `echo json_encode(app()->langPath())`;
  const resLangPath = await runTinker(getLangPathPHPCode, artisanPath);
  if (!resLangPath) return;
  const langPath = resLangPath.replace(/["']/g, '').replace(/\\/g, '').replace('\n', '');

  return langPath;
}

export async function getLocale(artisanPath: string) {
  const getLocalePHPCode = `echo json_encode(config('app.locale'))`;
  const resLocale = await runTinker(getLocalePHPCode, artisanPath);
  if (!resLocale) return;
  const locale = resLocale.replace(/["']/g, '').replace(/\\/g, '').replace('\n', '');

  return locale;
}

export function getRelativePosixFilePath(absoluteFilePath: string, rootPath: string) {
  const rootUri = Uri.parse(rootPath).toString();
  const abusoluteFileUri = Uri.parse(absoluteFilePath).toString();
  return abusoluteFileUri.replace(rootUri + '/', '');
}
