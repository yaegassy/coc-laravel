import { ExtensionContext, OutputChannel } from 'coc.nvim';

import { type ProjectManagerType } from '../projects/types';

import * as artisanRunCommandFeature from './features/artisanRun';
import * as projectRestartCommandFeature from './features/projectRestart';
import * as projectStatsCommandFeature from './features/projectStats';
import * as showOutputCommandFeature from './features/showOutput';
import * as stubsDownloadCommandFeature from './features/stubsDownload';
import * as stubsVersionCommandFeature from './features/stubsVersion';
import * as viewFindAllReferencesCommandFeature from './features/viewFindAllReferences';

export async function register(
  context: ExtensionContext,
  projectManager: ProjectManagerType,
  outputChannel: OutputChannel
) {
  outputChannel.appendLine('Start registration for command feature');

  showOutputCommandFeature.register(context, outputChannel);

  artisanRunCommandFeature.register(context);
  projectStatsCommandFeature.register(context, projectManager);
  projectRestartCommandFeature.register(context, projectManager);
  viewFindAllReferencesCommandFeature.register(context, projectManager);
  stubsDownloadCommandFeature.register(context);
  stubsVersionCommandFeature.register(context);
}
