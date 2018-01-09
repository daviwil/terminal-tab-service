/** @babel */

import { CompositeDisposable } from 'atom';
import TerminalTabService from './terminal-tab-service';

export default {

  disposables: null,
  terminalTabService: new TerminalTabService(),

  config: {
    matchTheme: {
      title: 'Match Theme',
      description: 'Attempt to match the current UI and Syntax themes.',
      type: 'boolean',
      default: true
    }
  },

  activate() {
    this.disposables = new CompositeDisposable();

    this.disposables.add(atom.commands.add('terminal-view', {
      'terminal:copy': this.handleCopy.bind(this),
      'terminal:paste': this.handlePaste.bind(this),
      'terminal:clear': this.handleClear.bind(this)
    }));
  },

  deserializeTerminalView() {
    // return this.terminalTabService._createTerminal();
  },

  deactivate() {
    this.disposables.dispose();
  },

  handleOpen() {
    this.terminalTabService.openTerminal();
  },

  handleCopy() {
    let activeTerminalView = atom.workspace.getActivePaneItem();
    activeTerminalView.copySelection();
  },

  handlePaste() {
    let activeTerminalView = atom.workspace.getActivePaneItem();
    activeTerminalView.pasteFromClipboard();
  },

  handleClear() {
    let activeTerminalView = atom.workspace.getActivePaneItem();
    activeTerminalView.clear();
  },

  provideTerminalTabService() {
    return this.terminalTabService;
  }
};
