import { js_beautify } from "js-beautify";
import { fixForServ00Rules } from "../../util/extension-sublimate";

const { BlockType, ArgumentType } = Scratch;
Scratch.extensions.register({
    id: 'gsaJsBeautify',
    name: 'JS Beautifier',
    color1: '#aaa',
    blocks: [
        {
            opcode: 'beautify',
            BlockType: BlockType.REPORTER,
            text: 'beautify [script]',
            arguments: {
                script: {
                    type: ArgumentType.STRING,
                    default: 'if(confirm("skbidi?"))console.log("guh")'
                }
            }
        }
    ],
    getInfo() { fixForServ00Rules(); return this; },
    beautify({ script }) {
        return js_beautify(script, {
            indent_with_tabs: true,
            eol: '\n',
            space_after_named_function: true,
            space_after_anon_function: false,
        });
    }
});