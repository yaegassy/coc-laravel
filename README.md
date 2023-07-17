# coc-laravel

Laravel extension for [coc.nvim](https://github.com/neoclide/coc.nvim).

## Install

**CocInstall**:

> ...TODO

**vim-plug**:

```vim
Plug 'yaegassy/coc-laravel', {'do': 'yarn install --frozen-lockfile'}
```

## Features

This coc-extension will provide various completion features and more features for Laravel projects.

- Completions
  - Config completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635266998)
  - Env completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635267885)
  - Validation completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635268664)
  - Route completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635269933)
  - View completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635271315)
  - Middleware completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635271630)
  - Guard completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1635272378)
  - Translation completion | [DEMO](https://github.com/yaegassy/coc-laravel/issues/1#issuecomment-1637244306)

- [TODO]
  - Completions
    - Component completion
  - Definitions
    - Some features are provided by [coc-blade](https://github.com/yaegassy/coc-blade) that I am developing, but considering porting to `coc-laravel` with enhancements.
  - Diagnostics
    - Some features are provided by [coc-blade](https://github.com/yaegassy/coc-blade) that I am developing, but considering porting to `coc-laravel` with enhancements.
      - Warn of blade view files that do not exist in the project, etc.
  - CodeActions
    - Action to be generated if the target blade file does not exist in the project
  - Artisan and Sail commands integration
    - I am providing the feature in [@yaegassy/coc-intelephense](https://github.com/yaegassy/coc-intelephense), which I am developing, but I am considering porting the feature to `coc-laravel`
  - And more...

## [RECOMMENDED] Additional installation of "watchman"

`coc-laravel` uses the `workspace/didChangeWatchedFiles` notification to monitor files in the project.

In coc.nvim, it is recommended to install [watchman](https://facebook.github.io/watchman/) in order to utilize this feature.

- See: <https://github.com/neoclide/coc.nvim/wiki/Using-coc-extensions>

If you have difficulty installing `watchman`, you can use `coc-laravel` without `watchman`, but you may not be able to immediately use IntelliSense with the newly added files.

In this case, please manually enter the following command.

- `:CocCommand laravel.cache.regenerate`

or

- `:CocRestart`

## workspaceFolders

Depending on the project like mono repo or how Vim/Neovim is started, `workspaceFolders` may not be recognized correctly.

To make coc.nvim recognize `workspaceFolders` correctly, you can set `b:coc_root_patterns` in .vimrc/init.vim

**Example**:

```vim
  au FileType php let b:coc_root_patterns = ['.git', '.env', 'composer.json', 'artisan']
```

For more information, check this coc.nvim's wiki.

- <https://github.com/neoclide/coc.nvim/wiki/Using-workspaceFolders>

## Configuration options

- `laravel.enable`: Enable coc-laravel extension, default: `true`
- `laravel.completion.enable`: Enable all completion feature, default: `true`
- `laravel.completion.configEnable`: Enable config completion, default: `true`
- `laravel.completion.envEnable`: Enable env completion, default: true
- `laravel.completion.validationEnable`: Enable validation completion.
- `laravel.completion.routeEnable`: Enable route completion, default: `true`
- `laravel.completion.viewEnable`: Enable view completion, default: `true`
- `laravel.completion.middlewareEnable`: Enable middleware completion, default: `true`
- `laravel.completion.guardEnable`: Enable guard completion, default: `true`
- `laravel.completion.translationEnable`: Enable translation completion, default: `true`

## Commands

- `laravel.project.stats`: Show project stats
- `laravel.project.restart`: Run project restart

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

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
