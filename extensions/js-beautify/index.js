import { js_beautify } from "js-beautify";
import { fixForServ00Rules } from "../../util/extension-sublimate";

const { BlockType, ArgumentType } = Scratch;
const options = {
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
}
const optionTypes = {
    indent_size: { type: ArgumentType.NUMBER },
    indent_char: { type: ArgumentType.STRING },
    indent_with_tabs: { type: ArgumentType.BOOLEAN },
    eol: { type: ArgumentType.STRING },
    end_with_newline: { type: ArgumentType.BOOLEAN },
    indent_level: { type: ArgumentType.NUMBER },
    preserve_newlines: { type: ArgumentType.BOOLEAN },
    max_preserve_newlines: { type: ArgumentType.NUMBER },
    space_in_paren: { type: ArgumentType.BOOLEAN },
    space_in_empty_paren: { type: ArgumentType.BOOLEAN },
    jslint_happy: { type: ArgumentType.BOOLEAN },
    space_after_anon_function: { type: ArgumentType.BOOLEAN },
    space_after_named_function: { type: ArgumentType.BOOLEAN },
    brace_style: { type: ArgumentType.STRING, menu: 'braceStyles' },
    unindent_chained_methods: { type: ArgumentType.BOOLEAN },
    break_chained_methods: { type: ArgumentType.BOOLEAN },
    keep_array_indentation: { type: ArgumentType.BOOLEAN },
    unescape_strings: { type: ArgumentType.BOOLEAN },
    wrap_line_length: { type: ArgumentType.NUMBER },
    e4x: { type: ArgumentType.BOOLEAN },
    comma_first: { type: ArgumentType.BOOLEAN },
    operator_position: { type: ArgumentType.STRING, menu: 'operatorStyles' },
    indent_empty_lines: { type: ArgumentType.BOOLEAN },
}
ScratchBlocks.Extensions.register('options-mutator', function() {
    const menu = this.inputs[0]?.fieldRow?.[0];
    if (!menu) return console.warn('ornawr couldnt find the menu11');
    menu.setValidator(val => {
        const blockInfo = JSON.parse(this.blockInfoText);
        blockInfo.arguments.value = optionTypes[val];
        blockInfo.arguments.value.defaultValue = options[val];
        this.blockInfoText = JSON.stringify(blockInfo);
        this.needsBlockInfoUpdate = true;
        this.domToMutation(this.mutationToDom());
        this.initSvg();
        return val;
    });
});
Scratch.extensions.register({
    id: 'gsaJsBeautify',
    name: 'JS Beautifier',
    color1: '#AAAAAA',
    blocks: [
        {
            opcode: 'setOption',
            blockType: BlockType.COMMAND,
            isDynamic: true,
            text: 'set [option] to [value]',
            arguments: {
                option: { type: ArgumentType.STRING, menu: 'options' },
                value: optionTypes['indent_size']
            },
            extensions: ['options-mutator']
        },
        {
            opcode: 'beautify',
            blockType: BlockType.REPORTER,
            text: 'beautify [script]',
            arguments: {
                script: {
                    type: ArgumentType.STRING,
                    defaultValue: 'if(confirm("skbidi?"))console.log("guh")'
                }
            }
        }
    ],
    menus: {
        options: [
            ['indent size', 'indent_size'],
            ['indent char', 'indent_char'],
            ['use tab indentation', 'indent_with_tabs'],
            ['end of line character', 'eol'],
            ['finish with line break', 'end_with_newline'],
            ['initial indent level', 'indent_level'],
            ['keep line breaks', 'preserve_newlines'],
            ['max kept line breaks', 'max_preserve_newlines'],
            ['space out parenthesis', 'space_in_paren'],
            ['space out empty parenthesis', 'space_in_empty_paren'],
            ['appeal to jslint', 'jslint_happy'],
            ['space out nameless functions', 'space_after_anon_function'],
            ['space out nameled functions', 'space_after_named_function'],
            ['curly brace style rule', 'brace_style'],
            ['remove indentation on method chains', 'unindent_chained_methods'],
            ['put method chains on new line', 'break_chained_methods'],
            ['keep array indentation', 'keep_array_indentation'],
            ['decode escape characters', 'unescape_strings'],
            ['max line length', 'wrap_line_length'],
            ['dont modify JSX syntax', 'e4x'],
            ['start lines with commas', 'comma_first'],
            ['operator indentation style', 'operator_position'],
            ['indent on empty lines', 'indent_empty_lines'],
        ],
        operatorStyles: {
            acceptReporters: true,
            values: [
                ['end lines with symbols', 'before-newline'],
                ['start lines with symbols', 'after-newline'],
                ['do nothing to position', 'preserve-newline']
            ]
        },
        braceStyles: {
            acceptReporters: true,
            values: [
                ['braces in statement lines', 'collapse'],
                ['all braces on new lines', 'expand'],
                ['ending braces on new line', 'end-expand'],
                ['braces in statement lines & dont break inline', 'collapse,preserve-inline'],
                ['all braces on new lines & dont break inline', 'expand,preserve-inline'],
                ['ending braces on new line & dont break inline', 'end-expand,preserve-inline'],
                ['dont do anything', 'none']
            ]
        }
    },
    getInfo() { fixForServ00Rules(); return this; },
    options,
    setOption({ option, value }) { this.options[option] = value; },
    beautify({ script }) {
        return js_beautify(script, this.options);
    }
});