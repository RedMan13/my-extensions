import { registerFrom } from '../../util/extension-base';

const info = registerFrom(`
    # Compile Rings:
        V types {
            Number,
            String,
            Boolean,
            Unknown,
            Number/NaN
        }
        set uses yields
        inject [!] as [v types] :: reporter
        inject [!]
`, {
    SetUsesYields: [
        generator => {
            generator.yields = true;
            return { kind: 'stack' };
        },
        () => {}
    ],
    InjectAs: [
        (generator, block) => ({
            kind: 'input',
            type: block.fields.$2.value,
            code: generator.descendInputOfBlock(block, '$1')
        }),
        (node, compiler, { TypedInput, TYPE_UNKNOWN, TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, TYPE_NUMBER_NAN }) => {
            let type;
            switch (node.type) {
            case 'String': type = TYPE_STRING;
            case 'Number': type = TYPE_NUMBER; break;
            case 'Number/NaN': type = TYPE_NUMBER_NAN; break;
            case 'Boolean': type = TYPE_BOOLEAN; break;
            default: type = TYPE_UNKNOWN; break
            }
            if (node.code.kind !== 'constant') return new TypedInput('(()=>{throw "Compile blocks can only use constant values"})()', type);
            return new TypedInput(node.code.value || '', type);
        }
    ],
    Inject: [
        (generator, block) => ({
            kind: 'stack',
            code: generator.descendInputOfBlock(block, '$1')
        }),
        (node, compiler) => {
            if (node.code.kind !== 'constant') return compiler.source += 'throw "Compile blocks can only use constant values"';
            compiler.source += node.code.value || '';
        }
    ],
}, {})