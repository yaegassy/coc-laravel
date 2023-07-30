# coc-laravel

Laravel extension for [coc.nvim](https://github.com/neoclide/coc.nvim).

## Install

**CocInstall**:

```vim
:CocInstall @yaegassy/coc-laravel
```

> scoped packages

**vim-plug**:

```vim
Plug 'yaegassy/coc-laravel', {'do': 'yarn install --frozen-lockfile'}
```

## Features

**Note**:

This coc-extension executes `artisan` commands in the background for some features. Therefore, you must be able to run `PHP` in your environment.

---

This coc-extension will provide various completion features and more features for Laravel projects.

- Completions
  - Component completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1650935001)
  - PHP Function completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1643359916)
    - Provides function completion within the PHP-related regions of the Blade file.
  - Directive completion
  - Config completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635266998)
  - Env completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635267885)
  - Validation completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635268664)
  - Route completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635269933)
  - View completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635271315)
  - Middleware completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635271630)
  - Guard completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635272378)
  - Translation completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1637244306)
  - Method directive parameter completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1647629965)
  - Misc
    - Please install [coc-blade](https://github.com/yaegassy/coc-blade), it is implemented in [coc-blade](https://github.com/yaegassy/coc-blade)
- Definitions
  - View definition | [DEMO](https://github.com/yaegassy/coc-laravel/issues/2#issuecomment-1644973067)
    - [PHP -> Blade] Definition jump to the Blade template specified by the view() function.
  - Blade View definition | [DEMO](https://github.com/yaegassy/coc-laravel/issues/2#issuecomment-1644973626)
    - [Blade -> Blade] Jump to the Blade template specified by the `@extends` and `@include` directives.
  - Component definition | [DEMO](https://github.com/yaegassy/coc-laravel/issues/2#issuecomment-1644974475)
    - [Blade -> PHP or Blade] Jump to the component file. Both class components and anonymous components are supported.
- References
  - `laravel.view.findAllReferences` command | [DEMO](https://github.com/yaegassy/coc-laravel/issues/3#issuecomment-1645929779)
    - [Blade -> PHP] Show references to PHP files that use the current blade
      file. Referenced directories are `routes`, `app/Http/Controllers`,
      `app/View/Components` and `app/Http/Livewire`.
  - View reference | [DEMO](https://github.com/yaegassy/coc-laravel/issues/3#issuecomment-1645932674)
    - [PHP -> Blade] Reference to a PHP file that uses the same template in the view function.
- Hovers
  - ComponentTag Hover | [DEMO](https://github.com/yaegassy/coc-laravel/issues/4#issue-1816594130)
  - Blade Directive Hover
- Diagnostics
  - Missing component validation
  - Method directive parameter validation | [DEMO](https://github.com/yaegassy/coc-laravel/issues/5#issuecomment-1647636587)
  - [TODO]
    - Diagnostic features will be added as we come up with useful ones, based on projects already analyzed.
- CodeActions
  - Create blade component
  - Fix method directive parameter | [DEMO](https://github.com/yaegassy/coc-laravel/issues/6#issuecomment-1648914444)
  - [TODO]
    - CodeAction features will be added as we come up with useful ones, based on projects already analyzed.
- Artisan and Sail commands integration
  - `laravel.artisan.run` command feature.
  - `laravel.sailArtisan.run` command feature.

## [RECOMMENDED] Additional installation of "watchman"

`coc-laravel` uses the `workspace/didChangeWatchedFiles` notification to monitor files in the project.

In coc.nvim, it is recommended to install [watchman](https://facebook.github.io/watchman/) in order to utilize this feature.

- See: <https://github.com/neoclide/coc.nvim/wiki/Using-coc-extensions>

If you have difficulty installing `watchman`, you can use `coc-laravel` without `watchman`, but you may not be able to immediately use IntelliSense with the newly added files.

In this case, please manually enter the following command.

- `:CocCommand laravel.project.restart`

or

- `:CocRestart`

## workspaceFolders

Depending on the project like mono repo or how Vim/Neovim is started, `workspaceFolders` may not be recognized correctly.

To make coc.nvim recognize `workspaceFolders` correctly, you can set `b:coc_root_patterns` in .vimrc/init.vim

**Example**:

```vim
  au FileType php,blade let b:coc_root_patterns = ['.git', '.env', 'composer.json', 'artisan']
```

For more information, check this coc.nvim's wiki.

- <https://github.com/neoclide/coc.nvim/wiki/Using-workspaceFolders>

## Configuration options

- `laravel.enable`: Enable coc-laravel extension, default: `true`
- `laravel.environment.phpPath`: Path to PHP, you can use a custom version of PHP. If there is no setting, `php` of the execution environment will be used. default: `""`
- `laravel.completion.enable`: Enable all completion feature, default: `true`
- `laravel.completion.directiveEnable`: Enable directive completion, default: `true`
- `laravel.completion.configEnable`: Enable config completion, default: `true`
- `laravel.completion.envEnable`: Enable env completion, default: true
- `laravel.completion.validationEnable`: Enable validation completion.
- `laravel.completion.routeEnable`: Enable route completion, default: `true`
- `laravel.completion.viewEnable`: Enable view completion, default: `true`
- `laravel.completion.middlewareEnable`: Enable middleware completion, default: `true`
- `laravel.completion.guardEnable`: Enable guard completion, default: `true`
- `laravel.completion.translationEnable`: Enable translation completion, default: `true`
- `laravel.completion.componentEnable`: Enable component completion, default: `true`
- `laravel.completion.phpFunctionEnable`: Enable php function completion, default: `true`
- `laravel.completion.methodParameterEnable`: Enable method parameter completion, default: `true`
- `laravel.definition.enable`: Enable definition, default `true`
- `laravel.reference.enable`: Enable reference, default `true`
- `laravel.hover.enable`: Enable hover, default `true`
- `laravel.diagnostic.enable`: Enable diagnostic, default: `true`
- `laravel.codeAction.enable`: Enable code action, default: `true`
- `laravel.artisan.withoutArgumentsCommandList`: List of commands to quickly execute `laravel.artisan.run` or `laravel.sailArtisan.run` without prompting for arguments or options, e.g. `[\"route:list\", \"clear-compiled\"]`, default: `[]`
- `laravel.artisan.enableSplitRight`: Use vertical belowright for artisan terminal window, default: `false`

## Commands

- `laravel.project.restart`: Run project restart
- `laravel.project.stats`: (Develop) Show project stats
- `laravel.artisan.run`: Run artisan command
- `laravel.sailArtisan.run`: Run sail artisan command
- `laravel.view.findAllReferences`: Find view file references

## CodeActions

**Example key mapping (Code Action related)**:

```vim
nmap <silent> ga <Plug>(coc-codeaction-line)
nmap <silent> <leader>ac <Plug>(coc-codeaction-cursor)
```

**Actions**:

- `Create blade component`
- `Fix method directive parameter`

## Recommended coc-extensions for php

- [@yaegassy/coc-intelephense](https://github.com/yaegassy/coc-intelephense)
- [coc-blade](https://github.com/yaegassy/coc-blade)
- [@yaegassy/coc-phpstan](https://github.com/yaegassy/coc-phpstan)
- [coc-php-cs-fixer](https://github.com/yaegassy/coc-php-cs-fixer)
- [coc-psalm](https://github.com/yaegassy/coc-psalm)

## Inspired Projects

- [amir9480/vscode-laravel-extra-intellisense](https://github.com/amir9480/vscode-laravel-extra-intellisense)
- [Laravel Idea](https://laravel-idea.com/)
- and More...

## Thanks

- [glayzzle/php-parser](https://github.com/glayzzle/php-parser)
- [Stillat/blade-parser-typescript](https://github.com/Stillat/blade-parser-typescript)
- [JetBrains/phpstorm-stubs](https://github.com/JetBrains/phpstorm-stubs)
- [microsoft/vscode-html-languageservice](https://github.com/microsoft/vscode-html-languageservice)
- [web-tree-sitter](https://www.npmjs.com/package/web-tree-sitter)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
