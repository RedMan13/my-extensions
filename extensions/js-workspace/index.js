import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/twilight';
import 'brace/theme/dawn';
import { vm, gui, BlockType } from '../../util/scratch-types';
const { Thread, RenderedTarget, jsexecute: { scopedEval, globalState } } = Object.assign({}, vm.exports, vm.exports.i_will_not_ask_for_help_when_these_break());
import { compile } from './compile';
import './dialog-styles.css';
import { js_beautify } from "js-beautify";
import { fixForServ00Rules } from "../../util/extension-sublimate";
import AddIcon from "./icon-add.svg";
import './serialization';

// get the font height for ace, important because we need to convert workspace units to ace units
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.font = "15px/normal 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace";
const measures = ctx.measureText('aim');
const fontHeight = measures.fontBoundingBoxAscent + measures.fontBoundingBoxDescent;
const fontWidth = measures.width / 3; // assume constant width

window.fatalErrors = [];
/** @type {ace.Editor} */
let editor = null;
let wrapper;
function onThemeChange(dark) {
    if (!editor) return;
    if (dark)
        editor.setTheme('ace/theme/twilight');
    else
        editor.setTheme('ace/theme/dawn');
}
const observer = new MutationObserver(mutations => 
    mutations.forEach(mutation => {
        if (mutation.type === 'attributes') onThemeChange(mutation.target.getAttribute('theme') === 'dark')
    }));
observer.observe(document.body, { attributes: true });

function tick() {
    // while we are here, make sure that the rest of the editor is set up
    document.querySelector('.blocklyScrollbarVertical.blocklyMainWorkspaceScrollbar')?.remove?.();
    document.querySelector('.blocklyScrollbarHorizontal.blocklyMainWorkspaceScrollbar')?.remove?.();
    const workspace = document.querySelector('.blocklySvg')
    if (workspace && workspace.style.display !== 'none') {
        workspace.style.display = 'none';
        wrapper = <div style="width: 100%; height: 100%; position: absolute;"></div>;
        workspace.parentElement.appendChild(wrapper);
        if (editor) editor.destroy();
        queueMicrotask(() => {
            editor = ace.edit(wrapper);
            editor.setOptions({
                fontSize: "15px",
                showPrintMargin: false,
                highlightActiveLine: true,
                useWorker: false,
            });
            editor.session.setMode('ace/mode/javascript');
            editor.on('change', () => vm.editingTarget.extensionStorage.sourceCode = editor.getValue())
            onThemeChange(document.body.getAttribute('theme') === 'dark');
            if (!vm.editingTarget) return;
            editor.setValue(vm.editingTarget.extensionStorage.sourceCode || '');
        });
    }
    const flyout = document.querySelector('.blocklyFlyout');
    const categories = document.querySelector('.blocklyToolboxDiv');
    const injection = document.querySelector('.injectionDiv');
    requestAnimationFrame(tick);
    if (!flyout || !categories || !injection || !wrapper || !editor) return;
    const flyoutBox = flyout.getBoundingClientRect();
    const categoryBox = categories.getBoundingClientRect();
    const scopeBox = injection.getBoundingClientRect();
    const rightMost = Math.max(flyoutBox.right, categoryBox.right);
    const pos = rightMost - scopeBox.left;
    wrapper.style.left = `${pos}px`;
    wrapper.style.width = `${scopeBox.width - pos}px`;
    editor.resize();
}; tick();
let resultX;
let resultY;
let inEditor = false;
let dragging = false;
window.onmousemove = e => {
    if (!editor) return;
    if (!e.target.classList.contains('ace_content')) {
        resultX = NaN;
        resultY = NaN;
        inEditor = false;
        return;
    }
    if (!dragging) return;
    resultX = e.offsetX / fontWidth;
    resultY = e.offsetY / fontHeight;
    inEditor = true;
    editor.moveCursorTo(resultY, resultX);
}
vm.on('workspaceUpdate', () => {
    if (!editor) return;
    editor.setValue(vm.editingTarget.extensionStorage.sourceCode || '');
    editor.getSession().setAnnotations(getTargetAnnotations());
});
vm.on('BLOCK_DRAG_UPDATE', () => {
    dragging = true;
});
vm.on('BLOCK_DRAG_END', (blocks, topBlockId) => {
    dragging = false;
    const thread = new Thread(topBlockId);
    thread.target = vm.editingTarget;
    thread.blockContainer = vm.runtime.monitorBlocks;
    thread.stackClick = true;
    const func = compile(thread).startingFunction.toString();
    let start = func.indexOf('try {') +5;
    let end = func.lastIndexOf('} catch (err) {c');
    const adendums = func.slice(func.indexOf('runtime.getTargetForStage();') +28, func.match(/return function\* gen[0-9]+ \(\) {/).index);
    let text = adendums + '\n' + func.slice(start, end).trim();
    if (options.beuatifyBlocks)
        text = js_beautify(text, options.beuatify);
    editor.insert(text);
});
const oldShareBlocksToTarget = vm.shareBlocksToTarget;
vm.shareBlocksToTarget = async function(blocks, targetId, optFromTargetId) {
    await oldShareBlocksToTarget.call(this, blocks, targetId, optFromTargetId);
    const target = this.runtime.getTargetById(targetId);
    editor.moveCursorTo(Infinity, 0);
    editor.insert('\n');
    const thread = new Thread(target.blocks.getScripts()[0]);
    thread.target = target;
    thread.blockContainer = target.blocks;
    thread.stackClick = true;
    const func = compile(thread).startingFunction.toString();
    let start = func.indexOf('runtime.getTargetForStage();') +28;
    let end = func.lastIndexOf('} catch (err) {c');
    let text = func.slice(start, end).replace('try {', '').replace(/return function\* gen[0-9]+ \(\) {/, '').trim();
    if (options.beuatifyBlocks)
        text = js_beautify(text, options.beuatify);
    editor.insert(text);
    target.blocks.deleteBlock(target.blocks.getScripts()[0], false);
}
Thread.prototype.on = function(name, func) {
    this.hats ??= {};
    this.hats[name] ??= [];
    this.hats[name].push(func);
}
Thread.prototype.off = function(name, func) {
    const idx = this.hats?.[name]?.findIndex?.(f => f === func);
    this.hats?.[name]?.splice?.(idx, 1);
}
const oldGreenFlag = Object.getPrototypeOf(vm.runtime).greenFlag;
Object.getPrototypeOf(vm.runtime).greenFlag = function() {
    fatalErrors = [];
    vm.emitWorkspaceUpdate();
    oldGreenFlag.call(this);
}
Object.getPrototypeOf(vm.runtime).startHats = function(hat, fields, target) {
    for (const thread of this.threads) {
        if (target && thread.target.id !== target.id) continue;
        if (!thread.hats?.[hat]) continue;
        for (const func of thread.hats[hat]) {
            const hatThread = new Thread('-');
            hatThread.target = thread.target;
            hatThread.blockContainer = thread.blocks;
            hatThread.pushStack(thread.topBlock);
            hatThread.generator = func({ ...fields });
            hatThread.isCompiled = true;
            this.threads.push(hatThread);
        }
    }
}
RenderedTarget.prototype.onGreenFlag = function() {
    this.clearEffects();
    const thread = new Thread('-');
    thread.target = this;
    thread.blockContainer = this.blocks;
    thread.pushStack(thread.topBlock);
    thread.generator = scopedEval(`function* ${this.sprite.name.replaceAll(/[^a-z0-9$_]+/g, '').replaceAll(/$[0-9]*/g, '')}(thread) {
            const _parseFirefoxStack = stack => stack.split('\\n')
                .map(line => {
                    const at = line.indexOf('@');
                    const secondCol = line.lastIndexOf(':');
                    const firstCol = line.lastIndexOf(':', secondCol -1);
                    const endLine = line.length;
                    const name = line.slice(0, at);
                    let url = line.slice(at +1, firstCol);
                    let evalType = null;
                    let origin = [
                        Number(line.slice(firstCol +1, secondCol)),
                        Number(line.slice(secondCol +1, endLine))
                    ];
                    let evalOrigin = null;
                    /** @type {RegExpMatchArray} */
                    let match;
                    if ((match = url.match(/^ line ([0-9]+) > /))) {
                        url = line.slice(at, match.index);
                        evalOrigin = origin;
                        evalType = line.slice(match.index + match[0].length, firstCol);
                        origin = [Number(match[1]), NaN];
                    }
            
                    return {
                        name,
                        url,
                        evalOrigin,
                        evalType,
                        origin
                    };
                });
            const _parseChromeStack = stack => stack.split('\\n').slice(1)
                .map(line => {
                    // we have no use for the human readable fluff
                    line = line.slice(7);
                    const firstOpenParen = line.indexOf('(');
                    const secondOpenParen = line.indexOf('(', firstOpenParen +1);
                    const firstCloseParen = line.indexOf(')');
                    const secondCloseParen = line.indexOf(')', firstCloseParen +1);
                    let fourthCol = line.lastIndexOf(':');
                    let thirdCol = line.lastIndexOf(':', (fourthCol || line.length) -1);
                    let secondCol = _lastIndexNaN(line, ':', (thirdCol || line.length) -1);
                    let firstCol = _lastIndexNaN(line, ':', (secondCol || line.length) -1);
                    if (secondOpenParen === -1) {
                        secondCol = fourthCol;
                        firstCol = thirdCol;
                        fourthCol = NaN;
                        thirdCol = NaN;
                    }
                    const name = line.slice(0, firstOpenParen -1);
                    const origin = [
                        Number(line.slice(firstCol +1, secondCol)),
                        Number(line.slice(secondCol +1, thirdCol || firstCloseParen))
                    ];
                    let url = line.slice(firstOpenParen +1, firstCol);
                    let evalType = null;
                    let evalOrigin = null;
                    if (secondOpenParen !== -1) {
                        url = line.slice(secondOpenParen +1, firstCol);
                        evalType = 'anonymous';
                        evalOrigin = [
                            Number(line.slice(thirdCol +1, fourthCol)),
                            Number(line.slice(fourthCol +1, secondCloseParen))
                        ];
                    }
            
                    return {
                        name,
                        url,
                        evalOrigin,
                        evalType,
                        origin
                    };
                });
            const parseStack = (stack, url, line, column) => {
                if (!stack) {
                    return [{
                        name: '<inaccessible>',
                        url,
                        origin: [line, column]
                    }];
                }
                // firefox has a *completely* different style rule compared to chrome
                if (stack.split('\\n', 2)[0].includes('@')) return _parseFirefoxStack(stack);
                return _parseChromeStack(stack);
            };
            const rootError = new Error();
            const rootStack = parseStack(rootError.stack, rootError.fileName, rootError.lineNumber, rootError.columnNumber);
            try {
                ${this.extensionStorage.sourceCode}
            } catch (err) {
                const stack = parseStack(err.stack, err.fileName, err.lineNumber, err.columnNumber);
                if (!Array.isArray(window.fatalErrors)) window.fatalErrors = [];
                const error = {
                    message: String(err),
                    stack: stack,
                    root: rootStack,
                    error: err,
                    targetId: thread.target.id
                };
                window.fatalErrors.push(error);
                console.log(err);
                vm.emit('notifyError', error);
            }
        }
    `)(thread);
    thread.isCompiled = true;
    // step by one so hats can register before the start hat is fired
    this.runtime.sequencer.stepThread(thread);
    this.runtime.threads.push(thread);
}

function getTargetAnnotations(targetId) {
    targetId ??= vm.editingTarget.id;
    return fatalErrors
        .filter(error => error.targetId === targetId)
        .map(error => ({
            row: (error.stack[(error.stack.length - error.root.length)].origin[0] - error.root[0].origin[0]) -3,
            column: error.stack[(error.stack.length - error.root.length)].origin[1],
            text: error.message,
            type: 'error'
        }));
}
vm.on('notifyError', error => {
    vm.stopAll();
    vm.setEditingTarget(error.targetId);
    const annotations = getTargetAnnotations();
    editor.moveCursorTo(annotations[0].row, annotations[0].column);
    editor.session.setAnnotations(annotations);
});
gui.getBlockly().then(Blockly => {
    const oldCreateBlock = Blockly.Flyout.prototype.createBlock;
    Blockly.Flyout.prototype.createBlock = function(oldBlock) {
        const newBlock = oldCreateBlock.call(this, oldBlock);
        newBlock.id = oldBlock.id;
        return newBlock;
    };
    Blockly.BlockDragger.prototype.maybeDeleteBlock_ = function() { return true; }
});

window.options = {
    beuatify: {
        indent_size: 4,
        indent_char: ' ',
        indent_with_tabs: true,
        eol: '\n',
        end_with_newline: false,
        indent_level: 0,
        preserve_newlines: true,
        max_preserve_newlines: 0,
        space_in_paren: false,
        space_in_empty_paren: false,
        jslint_happy: false,
        space_after_anon_function: false,
        space_after_named_function: false,
        brace_style: 'collapse',
        unindent_chained_methods: false,
        break_chained_methods: true,
        keep_array_indentation: false,
        unescape_strings: false,
        wrap_line_length: 0,
        e4x: false,
        comma_first: false,
        operator_position: 'after-newline',
        indent_empty_lines: false,
        // templating: ['auto'] // no good way to do this without external reliance
    },
    beuatifyScripts: true,
    beuatifyBlocks: true
}
if (localStorage.getItem('js-workspaces:options')) {
    const opts = JSON.parse(localStorage.getItem('js-workspaces:options'))
    Object.assign(options, opts);
}

// dummy mostly, just here for ease and to exist according to the vm
Scratch.extensions.register({
    getInfo() {
        fixForServ00Rules();
        return {
            color1: '#252526',
            name: 'Internal Functions',
            id: 'gsaJsWorkspace',
            blocks: [
                {
                    blockType: BlockType.BUTTON,
                    opcode: 'openSettings',
                    text: 'Open settings'
                },
            ]
        }
    },
    openSettings() {
        /** @type {HTMLDialogElement} */
        const settingsBox = <dialog class="settings-dialog" theme={document.body.getAttribute('theme')}>
            <div class="dialog-banner">
                <span>{"Editor Settings"}</span>
                <button on:click={() => settingsBox.close()} class="dialog-cancel">
                    <img src={AddIcon}></img>
                </button>
            </div>
        </dialog>;
        /** @type {HTMLFormElements} */
        const form = <form method="dialog" class="dialog-body">
            <div class="option-header">{"Beuatifier Configuration"}<div></div></div>
            <div class="option-wrapper">
                <input type="checkbox" name="indent_with_tabs" checked={options.beuatify.indent_with_tabs}/>
                {"Indent with tabs"}
            </div>
            <div class="option-wrapper">
                {"Indentation size"}
                <input type="number" name="indent_size" placeholder="4" value={options.beuatify.indent_size}/>
            </div>
            <div class="option-wrapper">
                {"Indentation character(s)"}
                <input type="text" list="indent-characters" name="indent_char" placeholder="\\x20" value={JSON.stringify(options.beuatify.indent_char).slice(1,-1).replaceAll(' ', '\\x20')}/>
                <datalist id="indent-characters">
                    <option value="\\x20">Space</option>
                </datalist>
            </div>
            <div class="option-wrapper">
                {"End of line string"}
                <input type="text" list="eol-characters" name="eol" placeholder="\\n" value={JSON.stringify(options.beuatify.eol).slice(1,-1).replaceAll(' ', '\\x20')}/>
                <datalist id="eol-characters">
                    <option value="\\x20">{"Space"}</option>
                    <option value="\\n">{"Newline"}</option>
                    <option value="\\r\\n">{"Carage return + Newline"}</option>
                </datalist>
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="end_with_newline" checked={options.beuatify.end_with_newline}/>
                {"End file with newline"}
            </div>
            <div class="option-wrapper">
                {"Initial indentation level"}
                <input type="number" name="indent_level" placeholder="0"  value={options.beuatify.indent_level}/>
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="preserve_newlines" checked={options.beuatify.preserve_newlines}/>
                {"Preserve existing newlines"}
            </div>
            <div class="option-wrapper">
                {"Maximum number of newlines to preserve"}
                <input type="number" name="max_preserve_newlines" placeholder="0" value={options.beuatify.max_preserve_newlines}/>
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="space_in_paren" checked={options.beuatify.space_in_paren}/>
                {"Insert spaces between none-touching parentheses"}
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="space_in_empty_paren" checked={options.beuatify.space_in_empty_paren}/>
                {"Insert spaces between touching parantheses"}
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="jslint_happy" checked={options.beuatify.jslint_happy}/>
                {"Validate for default JSLint"}
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="space_after_anon_function" checked={options.beuatify.space_after_anon_function}/>
                {"Insert spaces between nameless function's parentheses"}
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="space_after_named_function" checked={options.beuatify.space_after_named_function}/>
                {"Insert spaces between named function's parentheses"}
            </div>
            <div class="option-wrapper">
                <select name="brace_style" value={options.beuatify.brace_style}>
                    <option value="collapse" selected>{"Put opening braces with parent line"}</option>
                    <option value="expand">{"Put opening braces after parent line"}</option>
                    <option value="end-expand">{"Put opening and closing braces after parent line"}</option>
                    <option value="collapse,preserve-inline">{"Put opening and closing braces after parent line, but do not alter inline blocks"}</option>
                    <option value="expand,preserve-inline">{"Put opening and closing braces after parent line, but do not alter inline blocks"}</option>
                    <option value="end-expand,preserve-inline">{"Put opening and closing braces after parent line, but do not alter inline blocks"}</option>
                    <option value="none">{"Make no changes"}</option>
                </select>
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="unindent_chained_methods" checked={options.beuatify.unindent_chained_methods}/>
                {"Remove indendation for chained methods"}
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="break_chained_methods" checked={options.beuatify.break_chained_methods}/>
                {"Put each method in a method chain on new lines"}
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="keep_array_indentation" checked={options.beuatify.keep_array_indentation}/>
                {"Keep the indentation of arrays"}
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="unescape_strings" checked={options.beuatify.unescape_strings}/>
                {"Remove string escapements"}
            </div>
            <div class="option-wrapper">
                {"When to wrap lines (0 is never)"}
                <input type="number" name="wrap_line_length" placeholder="0" checked={options.beuatify.wrap_line_length}/>
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="e4x" checked={options.beuatify.e4x}/>
                {"If React/ECMAScript for XML should be expected"}
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="comma_first" checked={options.beuatify.comma_first}/>
                {"If commas should be at the start of lines"}
            </div>
            <div class="option-wrapper">
                <select name="operator_position" value={options.beuatify.operator_position}>
                    <option value="before-newline">{"Put operator symbols at the end of lines, when breaking"}</option>
                    <option value="after-newline" selected>{"Put operator symbols at the start of lines, when breaking"}</option>
                    <option value="preserve-newline">{"Preserve the source operator order"}</option>
                </select>
            </div>
            <div class="option-wrapper">
                <input type="checkbox" name="indent_empty_lines" checked={options.beuatify.indent_empty_lines}/>
                {"Add indentation symbols to empty lines"}
            </div>
            <div class="option-header">{"Text Insertion Rules"}<div></div></div>
            <div class="option-wrapper">
                <input name="beuatifyScripts" type="checkbox" checked={options.beuatifyScripts}/>
                {"If the entire project should be beuatified when converted"}
            </div>
            <div class="option-wrapper">
                <input name="beuatifyBlocks" type="checkbox" checked={options.beuatifyBlocks}/>
                {"Should individual blocks be beautified"}
            </div>
            <br/>
            <input type="submit" value="Apply"/>
        </form>;
        settingsBox.appendChild(form);
        document.body.appendChild(settingsBox);
        settingsBox.showModal();
        settingsBox.addEventListener("close", event => {
            if (settingsBox.returnValue !== 'Apply') return;
            const formData = new FormData(form);
            options.beuatify.indent_size = formData.get('indent_size');
            options.beuatify.indent_char = JSON.parse(`"${formData.get('indent_char').replaceAll('\\x', '\\u00')}"`);
            options.beuatify.indent_with_tabs = formData.get('indent_with_tabs') === 'on';
            options.beuatify.eol = JSON.parse(`"${formData.get('eol').replaceAll('\\x', '\\u00')}"`);
            options.beuatify.end_with_newline = formData.get('end_with_newline') === 'on';
            options.beuatify.indent_level = formData.get('indent_level');
            options.beuatify.preserve_newlines = formData.get('preserve_newlines') === 'on';
            options.beuatify.max_preserve_newlines = formData.get('max_preserve_newlines');
            options.beuatify.space_in_paren = formData.get('space_in_paren') === 'on';
            options.beuatify.space_in_empty_paren = formData.get('space_in_empty_paren') === 'on';
            options.beuatify.jslint_happy = formData.get('jslint_happy') === 'on';
            options.beuatify.space_after_anon_function = formData.get('space_after_anon_function') === 'on';
            options.beuatify.space_after_named_function = formData.get('space_after_named_function') === 'on';
            options.beuatify.brace_style = formData.get('brace_style');
            options.beuatify.unindent_chained_methods = formData.get('unindent_chained_methods') === 'on';
            options.beuatify.break_chained_methods = formData.get('break_chained_methods') === 'on';
            options.beuatify.keep_array_indentation = formData.get('keep_array_indentation') === 'on';
            options.beuatify.unescape_strings = formData.get('unescape_strings') === 'on';
            options.beuatify.wrap_line_length = formData.get('wrap_line_length');
            options.beuatify.e4x = formData.get('e4x') === 'on';
            options.beuatify.comma_first = formData.get('comma_first') === 'on';
            options.beuatify.operator_position = formData.get('operator_position');
            options.beuatify.indent_empty_lines = formData.get('indent_empty_lines') === 'on';
            options.beuatifyBlocks = formData.get('beuatifyBlocks') === 'on';
            options.beuatifyScripts = formData.get('beuatifyScripts') === 'on';
            localStorage.setItem('js-workspaces:options', JSON.stringify(options))
            settingsBox.remove();
        });
    }
});