import { ExtensionContext, OutputChannel, commands } from 'coc.nvim';

export async function register(context: ExtensionContext, outputChannel: OutputChannel) {
  context.subscriptions.push(
    commands.registerCommand('laravel.showOutput', () => {
      if (outputChannel) {
        outputChannel.show();
      }
    })
  );
}
