import { BladeProjectsManager } from './managers/blade';
import { TranslationProjectManager } from './managers/translation';

export type BladeProjectsManagerType = BladeProjectsManager;
export type TranslationProjectManagerType = TranslationProjectManager;

export type ProjectManagerType = {
  bladeProjectManager: BladeProjectsManagerType;
  translationProjectManager: TranslationProjectManagerType;
};
