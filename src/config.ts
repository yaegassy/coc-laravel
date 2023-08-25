import { workspace } from 'coc.nvim';

const _config = workspace.getConfiguration('laravel');

/**
 * Settings that are frequently referenced from multiple locations are added here
 */
export const config = {
  enable: _config.get<boolean>('enable', true),
  project: {
    get startupMessageEnable() {
      return _config.get<boolean>('project.startupMessageEnable', true);
    },
  },
  completion: {
    get configEnable() {
      return _config.get<boolean>('completion.configEnable', true);
    },
    get envEnable() {
      return _config.get<boolean>('completion.envEnable', true);
    },
    get validationEnable() {
      return _config.get<boolean>('completion.validationEnable', true);
    },
    get routeEnable() {
      return _config.get<boolean>('completion.routeEnable', true);
    },
    get viewEnable() {
      return _config.get<boolean>('completion.viewEnable', true);
    },
    get middlewareEnable() {
      return _config.get<boolean>('completion.middlewareEnable', true);
    },
    get guardEnable() {
      return _config.get<boolean>('completion.guardEnable', true);
    },
    get translationEnable() {
      return _config.get<boolean>('completion.translationEnable', true);
    },
    get componentEnable() {
      return _config.get<boolean>('completion.componentEnable', true);
    },
    get methodParameterEnable() {
      return _config.get<boolean>('completion.methodParameterEnable', true);
    },
    get directiveEnable() {
      return _config.get<boolean>('completion.directiveEnable', true);
    },
    get livewireEnable() {
      return _config.get<boolean>('completion.livewireEnable', true);
    },
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
    get phpKeywordEnable() {
      return _config.get<boolean>('completion.phpKeywordEnable', true);
    },
    get eloquentModelFieldEnable() {
      return _config.get<boolean>('completion.eloquentModelFieldEnable', true);
    },
    phpFunction: {
      get stubsEnable() {
        return _config.get<boolean>('completion.phpFunction.stubsEnable', true);
      },
      get vendorEnable() {
        return _config.get<boolean>('completion.phpFunction.vendorEnable', true);
      },
    },
    phpClass: {
      get stubsEnable() {
        return _config.get<boolean>('completion.phpClass.stubsEnable', true);
      },
      get vendorEnable() {
        return _config.get<boolean>('completion.phpClass.vendorEnable', true);
      },
    },
    phpConstant: {
      get stubsEnable() {
        return _config.get<boolean>('completion.phpConstant.stubsEnable', true);
      },
      get vendorEnable() {
        return _config.get<boolean>('completion.phpConstant.vendorEnable', true);
      },
    },
  },
};
