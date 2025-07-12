import { understandParse, Parser } from "./toolbox";
import { extensions, BlockType, ArgumentType, vm } from "./scratch-types";

export function registerFrom(str, functions, variables = {}) {
    const parser = new Parser(str);
    const parses = parser.parse();
    if (typeof parses === 'string') throw new Error(parser);
    const toolbox = understandParse(parses);
    const infos = [];
    for (const item of toolbox) {
        if (!item.name) throw new Error('Toolbox definition string must only have categories in head');
        const vars = Object.assign({}, toolbox.vars, item.content.vars, variables);
        const id = 'gsa' + item.name.replace(/[^a-z]+/gi, '');
        const lists = Object.fromEntries(Object.entries(vars)
            .filter(([key,value]) => Array.isArray(value))
            .map(([key,value]) => [key, { items() { return vars[key].map(v => [v,v]) } }]));
        const blocks = [];
        const compiler = { ir: {}, js: {} };
        for (const idx in item.content) {
            if (idx === 'vars') continue;
            const block = item.content[idx];
            if (typeof block.label === 'string') {
                if (!block.label) {
                    blocks.push('---');
                    continue;
                }
                if (block.onClick) {
                    blocks.push({
                        blockType: BlockType.BUTTON,
                        text: block.label,
                        opcode: block.onClick
                    });
                    continue;
                }
                blocks.push({
                    blockType: BlockType.LABEL,
                    text: block.label
                });
                continue;
            }
            const blockInfo = {
                opcode: '',
                blockType: BlockType.COMMAND,
                text: [''],
                arguments: {},
                branchCount: 0
            }
            let argId = 1;
            for (const idx in block.slice(0, -1)) {
                const arg = block[idx];
                if (typeof arg === 'string') {
                    blockInfo.text[blockInfo.text.length -1] += arg;
                    blockInfo.opcode += arg
                        .split(/[^a-z]+/gi)
                        .map(word => word[0]?.toUpperCase?.() + word.slice(1))
                        .join('');
                    continue;
                }
                const argument = {
                    name: '$' + argId++,
                    defaultValue: arg.default?.startsWith?.('$') 
                        ? vars[arg.default.slice(1)] 
                        : arg.default
                };
                switch (arg.type) {
                case 'writeable':
                    argument.type = ArgumentType.STRING;
                    argument.menu = arg.list;
                    // lists[arg.list].isTypeable = true;
                    lists[arg.list].acceptReporters = true;
                    break;
                case 'degrees':
                    argument.type = ArgumentType.ANGLE;
                case 'number':
                    argument.type = ArgumentType.NUMBER;
                    break;
                case 'list':
                    argument.type = ArgumentType.STRING;
                    argument.menu = arg.list;
                    break;
                case 'unknown':
                    argument.type = ArgumentType.STRING;
                    argument.exemptFromNormalization = true;
                    break;
                case 'string':
                    argument.type = ArgumentType.STRING;
                    break;
                case 'boolean':
                    argument.type = ArgumentType.BOOLEAN;
                    break;
                case 'stack':
                    block.branchCount++;
                    blockInfo.text.push('');
                    break;
                case 'icon':
                    argument.type = ArgumentType.IMAGE;
                    argument.dataURI = vars[arg.icon];
                    break;
                }
                blockInfo.arguments[argument.name] = argument;
                blockInfo.text[blockInfo.text.length -1] += `[${argument.name}]`;
            }
            for (const opt of block.at(-1)) {
                switch (opt) {
                case 'number':
                case 'string':
                case 'reporter':
                    blockInfo.blockType = BlockType.REPORTER;
                    break;
                case 'boolean':
                    blockInfo.blockType = BlockType.BOOLEAN;
                    break;
                case 'hat-frame':
                    blockInfo.blockType = BlockType.HAT;
                    break;
                case 'hat-event':
                    blockInfo.blockType = BlockType.EVENT;
                    break;
                case 'end':
                    blockInfo.isTerminal = true;
                    break;
                case 'no-monitor':
                    blockInfo.disableMonitor = true;
                    break;
                case 'monitor':
                    blockInfo.disableMonitor = false;
                    break;
                }
            }
            blocks.push(blockInfo);
            if (Array.isArray(functions[blockInfo.opcode])) {
                compiler.ir[blockInfo.opcode] = functions[blockInfo.opcode][0];
                compiler.js[blockInfo.opcode] = functions[blockInfo.opcode][1];
            } else
                vars[blockInfo.opcode] = functions[blockInfo.opcode]; 
        }
        const info = {
            id,
            name: item.name,
            blocks,
            menus: lists
        };

        infos.push(info);
        vars.getInfo = () => info;
        extensions.register(vars);
        vm.runtime.registerCompiledExtensionBlocks(info.id, compiler);
    }
    return infos;
}