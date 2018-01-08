/** @babel */

import { CompositeDisposable } from 'atom';

const TERMINAL_TAB_URI = 'atom-terminal-tab://';
let TerminalView;

export default class TerminalTabService {

  constructor() {
    this.nextId = 0; // This will be populated on demand later
    this.terminals = [];
    this.disposables = new CompositeDisposable();

    this.disposables.add(atom.workspace.addOpener((uri) => {
      return this.terminals[uri];
    }));
  }

  dispose() {
    this.disposables.dispose();
    this.terminals.forEach((term) => { term.dispose() });
  }

  openTerminal(options) {
    // Load the view module on demand
    if (!TerminalView) {
      TerminalView = require('./terminal-view');
    }

    let terminalUri = `${TERMINAL_TAB_URI}${this.nextId++}`;
    this.terminals[terminalUri] = new TerminalView(options);
    return atom.workspace.open(terminalUri);
  }
}
