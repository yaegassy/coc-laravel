export type RangeOffset = {
  start: number;
  end: number;
};

// TODO: Refactoring to follow, as it was ported from coc-blade.
export type CompletionItemDataType = {
  source: CompletionItemSource;
  snippetsText?: string;
};

type CompletionItemSource =
  | 'laravel-blade-directive'
  //  | 'blade-directive'
  | 'blade-snippets'
  | 'livewire-directive-component'
  | 'livewire-tag'
  | 'livewire-tag-component'
  | 'livewire-wire'
  | 'livewire-wire-action'
  | 'livewire-wire-event';
