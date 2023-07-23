import { Position } from 'coc.nvim';

import { BladeComponentNode, BladeEchoNode, DirectiveNode } from 'stillat-blade-parser/out/nodes/nodes';
import * as bladeParer from '../../parsers/blade/parser';

export function canCompletionFromPHPRegionInBlade(code: string, editorPostion: Position) {
  const bladeDoc = bladeParer.getBladeDocument(code);
  if (!bladeDoc) return undefined;

  const flags: boolean[] = [];

  bladeDoc.getAllNodes().forEach((node) => {
    // TODO: Further increase judgment depending on the context within.
    //
    // Case:
    //   - {{ | }}
    if (node instanceof BladeEchoNode) {
      if (node.startPosition && node.endPosition) {
        if (node.startPosition.line - 1 <= editorPostion.line && node.endPosition.line - 1 >= editorPostion.line) {
          if (node.startPosition.line - 1 === editorPostion.line) {
            if (node.endPosition.line - 1 === editorPostion.line) {
              if (
                node.startPosition.char - 1 <= editorPostion.character &&
                node.endPosition.char - 1 >= editorPostion.character
              ) {
                flags.push(true);
              }
            } else {
              if (node.startPosition.char - 1 <= editorPostion.character) {
                flags.push(true);
              }
            }
          } else {
            if (node.endPosition.line - 1 === editorPostion.line) {
              if (node.endPosition.char - 1 >= editorPostion.character) {
                flags.push(true);
              }
            } else {
              flags.push(true);
            }
          }
        }
      }
    }

    // Case:
    //   - @php ... @endphp
    if (node instanceof DirectiveNode) {
      if (node.directiveName === 'php') {
        const endPhpDirectiveNode = node.getFinalClosingDirective();
        if (endPhpDirectiveNode.directiveName === 'endphp') {
          if (node.startPosition && endPhpDirectiveNode.endPosition) {
            if (node.startPosition.line - 1 === editorPostion.line) {
              if (endPhpDirectiveNode.endPosition.line - 1 === editorPostion.line) {
                if (
                  node.startPosition.char - 1 <= editorPostion.character &&
                  endPhpDirectiveNode.endPosition.char - 1 >= editorPostion.character
                ) {
                  flags.push(true);
                }
              } else {
                if (node.startPosition.char - 1 <= editorPostion.character) {
                  flags.push(true);
                }
              }
            } else {
              if (endPhpDirectiveNode.endPosition.line - 1 === editorPostion.line) {
                if (endPhpDirectiveNode.endPosition.char - 1 >= editorPostion.character) {
                  flags.push(true);
                }
              } else {
                flags.push(true);
              }
            }
          }
        }
      }
    }

    // Case:
    //   - @if (|)
    //   - @elseif (|)
    //   - @unless (|)
    //   - @isset (|)
    //   - @empty (|)
    //   - @unless (|)
    //   - @isset(|)
    //   - @empty(|)
    //   - @switch(|)
    //   - @for (|)
    //   - @foreach (|)
    //   - @forelse (|)
    //   - @while (|)
    //   - @continue(|)
    //   - @break(|)
    //   - @checked(|)
    //   - @selected(|)
    //   - @disabled(|)
    //   - @readonly(|)
    //   - @required(|)
    if (node instanceof DirectiveNode) {
      if (
        node.directiveName === 'if' ||
        node.directiveName === 'elseif' ||
        node.directiveName === 'unless' ||
        node.directiveName === 'isset' ||
        node.directiveName === 'empty' ||
        node.directiveName === 'switch' ||
        node.directiveName === 'for' ||
        node.directiveName === 'foreach' ||
        node.directiveName === 'forelse' ||
        node.directiveName === 'while' ||
        node.directiveName === 'continue' ||
        node.directiveName === 'break' ||
        node.directiveName === 'checked' ||
        node.directiveName === 'selected' ||
        node.directiveName === 'disabled' ||
        node.directiveName === 'readonly' ||
        node.directiveName === 'required'
      ) {
        if (node.directiveParametersPosition) {
          if (node.directiveParametersPosition.start && node.directiveParametersPosition.end) {
            if (node.directiveParametersPosition.start.line - 1 === editorPostion.line) {
              if (node.directiveParametersPosition.end.line - 1 === editorPostion.line) {
                if (
                  node.directiveParametersPosition.start.char - 1 <= editorPostion.character &&
                  node.directiveParametersPosition.end.char - 1 >= editorPostion.character
                ) {
                  flags.push(true);
                }
              } else {
                if (node.directiveParametersPosition.start.char - 1 <= editorPostion.character) {
                  flags.push(true);
                }
              }
            } else {
              if (node.directiveParametersPosition.end.line - 1 === editorPostion.line) {
                if (node.directiveParametersPosition.end.char - 1 >= editorPostion.character) {
                  flags.push(true);
                }
              } else {
                flags.push(true);
              }
            }
          }
        }
      }
    }

    // Case:
    if (node instanceof BladeComponentNode) {
      if (node.hasParameters) {
        for (const parameter of node.parameters) {
          if (parameter.isExpression) {
            if (parameter.valuePosition) {
              if (parameter.valuePosition.start && parameter.valuePosition.end) {
                if (parameter.valuePosition.start.line - 1 === editorPostion.line) {
                  if (parameter.valuePosition.end.line - 1 === editorPostion.line) {
                    if (
                      parameter.valuePosition.start.char - 1 <= editorPostion.character &&
                      parameter.valuePosition.end.char - 1 >= editorPostion.character
                    ) {
                      flags.push(true);
                    }
                  } else {
                    if (parameter.valuePosition.start.char - 1 <= editorPostion.character) {
                      flags.push(true);
                    }
                  }
                } else {
                  if (parameter.valuePosition.end.line - 1 === editorPostion.line) {
                    if (parameter.valuePosition.end.char - 1 >= editorPostion.character) {
                      flags.push(true);
                    }
                  } else {
                    flags.push(true);
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (flags.includes(true)) {
    return true;
  } else {
    return false;
  }
}

export function canCompletionFromContextWord(word: string) {
  if (word.startsWith('"') || (word.startsWith("'") && word.startsWith('>')) || word.startsWith('-')) {
    return false;
  }

  return true;
}
