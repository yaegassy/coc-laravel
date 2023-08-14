import { workspace } from 'coc.nvim';

const _config = workspace.getConfiguration('laravel');

/**
 * Settings that are frequently referenced from multiple locations are added here
 */
export const config = {
  completion: {
    phpFunctionEnable: _config.get<boolean>('completion.phpFunctionEnable', true),
    phpClassEnable: _config.get<boolean>('completion.phpClassEnable', true),
    phpConstantEnable: _config.get<boolean>('completion.phpConstantEnable', true),
    get phpVariableEnable() {
      const defaultValue = true;
      return _config.get<boolean>('completion.phpVariableEnable', defaultValue);
    },
  },
};
