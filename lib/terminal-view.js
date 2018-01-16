/** @babel */
/** @jsx etch.dom */

import { CompositeDisposable } from 'atom';
import ResizeObserver from 'resize-observer-polyfill';
import Terminal from 'xterm';
import etch from 'etch';
import path from 'path';
import { spawn as spawnPty } from 'node-pty-prebuilt';

Terminal.loadAddon('fit');

export default class TerminalView {

  constructor(options) {
    this.options = {
      shell: process.env.SHELL,
      location: 'bottom',
      title: 'Terminal',
      iconName: 'terminal',
      args: []
    }

    if (options) {
      this.options = Object.assign(this.options, options);
    }

    this.disposables = new CompositeDisposable();
    etch.initialize(this);
    this._openTerminal(options);
    this._handleEvents();
  }

  serialize() {
    return {
      deserializer: 'TerminalView'
    };
  }

  destroy() {

    // Stop Observing Resize Events
    this._resizeObserver.disconnect();

    // Kill the Pseudoterminal (pty) Process
    if (this.pty) this.pty.kill();

    // Destroy the Terminal Instance
    if (this.terminal) this.terminal.destroy();

    // Detach from the DOM
    etch.destroy(this);

    // Dispose of Disposables
    this.disposables.dispose();

  }

  _handleEvents() {

    // Transfer Focus to Terminal
    this.element.addEventListener('focus', () => this.terminal.focus());

    // Observe Resize Events
    this._resizeObserver = new ResizeObserver(this._didResize.bind(this));
    this._resizeObserver.observe(this.element);

    // Process Terminal Input Events
    this.terminal.on('data', (data) => {
      return this.pty.write(data);
    });

    // Process Terminal Output Events
    this.pty.on('data', (data) => {
      return this.terminal.write(data);
    });

    // Process Terminal Exit Events
    this.pty.on('exit', () => {
      // TODO: Raise an event, also make exiting conditional
      let pane = atom.workspace.paneForItem(this);
      if (pane) pane.destroyItem(this);
    });

    // Observe Configuration Changes
    this.disposables.add(
      atom.config.observe('terminal-tab-service.matchTheme', this.applyThemeStyles.bind(this))
    );
  }

  //
  // Resizes the terminal instance to fit its parent container. Once the new
  // dimensions are established, the calculated columns and rows are passed to
  // the pseudoterminal (pty) to remain consistent.
  //
  _didResize() {

    // Resize Terminal to Container
    this.terminal.fit();

    // Update Pseudoterminal Process w/New Dimensions
    this.pty.resize(this.terminal.cols, this.terminal.rows);
  }

  render() {
    return (
      <terminal-view attributes={{tabindex: 0}} />
    );
  }

  update() {
    return etch.update(this);
  }

  _openTerminal(options) {
    this.pty = this._openPseudoterminal(options);
    this.terminal = new Terminal();
    this.terminal.open(this.element, true);
    this.applyThemeStyles();
  }

  _openPseudoterminal(options) {
    const projectPaths = atom.project.getPaths();
    let workingDirectory = process.env.HOME;

    if (projectPaths.length > 0) {
      workingDirectory = projectPaths[0];
    }

    return spawnPty(this.options.shell, this.options.args, {
      name: 'xterm-color',
      cwd: path.resolve(workingDirectory),
      env: process.env
    });
  }

  //
  // Clears the contents of the terminal buffer. This is a simple proxy to the
  // `clear()` function on the Xterm instance.
  //
  clear() {
    this.terminal.clear();
  }

  //
  // Copies the current selection to the Atom clipboard.
  //
  copySelection() {
    let selectedText = this.terminal.getSelection();
    atom.clipboard.write(selectedText);
  }

  //
  // Pastes the contents of the Atom clipboard to the terminal (via the
  // pseudoterminal).
  //
  pasteFromClipboard() {
    let text = atom.clipboard.read();
    this.pty.write(text);
  }

  getDefaultLocation() {
    return this.options.location;
  }

  getIconName() {
    return this.options.iconName;
  }

  getTitle() {
    return this.options.title;
  }

  getProcess() {
    return this.pty;
  }

  applyThemeStyles() {

    // Bail out if the user has not requested to match the theme styles
    if (!atom.config.get('terminal-tab-service.matchTheme')) {
      this.element.classList.remove('themed');
      return;
    }

    this.element.classList.add('themed');

    var styleOverrides = '';
    if (typeof atom.config.settings.editor !== 'undefined') {
      if (typeof atom.config.settings.editor.fontSize !== 'undefined')
        styleOverrides += 'font-size: ' + atom.config.settings.editor.fontSize + 'px; ';
      if (typeof atom.config.settings.editor.fontFamily !== 'undefined')
        styleOverrides += 'font-family: ' + atom.config.settings.editor.fontFamily + '; ';
      if (typeof atom.config.settings.editor.lineHeight !== 'undefined')
        styleOverrides += 'line-height: ' + atom.config.settings.editor.lineHeight + '; ';
    }
    const termEls = document.getElementsByClassName('terminal xterm');
    window.setTimeout(() => {
      for (let i in termEls) {
        const termEl = termEls[i];
        if (typeof termEl === 'object') termEl.setAttribute('style', styleOverrides);
      }
    });
  }

}
