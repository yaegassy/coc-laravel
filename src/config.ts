import { workspace } from 'coc.nvim';

const _config = workspace.getConfiguration('laravel');

/**
 * Settings that are frequently referenced from multiple locations are added here
 */
export const config = {
  completion: {
    get phpFunctionEnable() {
      return _config.get<boolean>('completion.phpFunctionEnable', true);
    },
    get phpClassEnable() {
      return _config.get<boolean>('completion.phpClassEnable', true);
    },
    get phpStaticClassEnable() {
      return _config.get<boolean>('completion.phpStaticClassEnable', true);
    },
    get phpConstantEnable() {
      return _config.get<boolean>('completion.phpConstantEnable', true);
    },
    get phpVariableEnable() {
      return _config.get<boolean>('completion.phpVariableEnable', true);
    },
    get phpObjectMemberEnable() {
      return _config.get<boolean>('completion.phpObjectMemberEnable', true);
    },
  },
};
