import { workspace } from 'coc.nvim';

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
        if (stdout.includes('PHP Error:') || stdout.includes('in Psy Shell code on line')) {
          reject(undefined);
        } else {
          resolve(stdout);
        }
      } else {
        reject(stderr);
      }
    });
  }).catch(() => {
    return undefined;
  });
  return r;
}

export async function runTinkerReflection(code: string, artisanPath: string) {
  const phpPath = getPhpPath();

  const r = new Promise<string | undefined>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cp.exec(`"${phpPath}" "${artisanPath}" tinker --execute="${code}"`, (err, stdout, _stderr) => {
      if (err) {
        reject(undefined);
      }

      if (stdout.length > 0) {
        if (stdout.includes('ReflectionException')) {
          reject(undefined);
        } else {
          resolve(stdout);
        }
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
  let viewPath: string | undefined = undefined;

  const getViewPathPHPCode = `echo json_encode(config('view.paths'))`;
  const resViewPath = await runTinker(getViewPathPHPCode, artisanPath);
  if (!resViewPath || resViewPath === 'null') return;
  try {
    const viewPaths = JSON.parse(resViewPath) as string[];
    viewPath = viewPaths[0]
      .replace(/["']/g, '')
      .replace(/\\/g, '') // remove json quate
      .replace(/\\\\/g, '/') // replace window path to posix path
      .replace('\n', '');
  } catch (e) {}

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
