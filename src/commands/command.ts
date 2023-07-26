import { ExtensionContext } from 'coc.nvim';

import { type ProjectManagerType } from '../projects/types';

import * as projectRestartCommandFeature from './features/projectRestart';
import * as projectStatsCommandFeature from './features/projectStats';
import * as viewFindAllReferencesCommandFeature from './features/viewFindAllReferences';

export async function register(context: ExtensionContext, projectManager: ProjectManagerType) {
  projectStatsCommandFeature.register(context, projectManager);
  projectRestartCommandFeature.register(context, projectManager);
  viewFindAllReferencesCommandFeature.register(context, projectManager);
}
