import { Buffer } from './buffer';
import { registerFrom } from '../../util/extension-base';

function asBuffer(type) {
    return `(yield* (function*() {
        let val = ${type.asUnknown()};
        if (!(val instanceof Buffer)) val = Buffer.fromDataType('JSON-text', val);
        if (val instanceof Promise) return yield* waitPromise(val);
        return val;
    })())`
}
const info = registerFrom(`
# Buffer:
    new buffer (10) :: reporter no-monitor
    length of [! $helloDemo] :: reporter
    V encodingDecode {
        utf-8,
        ascii,
        hex,
        binary,
        base64,
        base64-url,
        buffer,
        URL,
        data-uri
        JSON,
        JSON-text
        utf-16be,
        utf-16le,
        ibm866,
        iso-8859-1,
        iso-8859-2,
        iso-8859-3,
        iso-8859-4,
        iso-8859-5,
        iso-8859-6,
        iso-8859-7,
        iso-8859-8,
        iso-8859-8-i,
        iso-8859-9,
        iso-8859-10,
        iso-8859-11,
        iso-8859-13,
        iso-8859-14,
        iso-8859-15,
        iso-8859-16,
        koi8-r,
        koi8-u,
        macintosh,
        windows-1250,
        windows-1251,
        windows-1252,
        windows-1253,
        windows-1254,
        windows-1255,
        windows-1256,
        windows-1257,
        windows-1258,
        x-mac-cyrillic,
        gbk,
        gb18030,
        hz-gb-2312,
        big5,
        euc-jp,
        iso-2022-jp,
        shift-jis,
        euc-kr,
        x-user-defined,
        iso-2022-cn
    }
    V encodingEncode {
        utf-8,
        ascii,
        hex,
        binary,
        base64,
        base64-url,
        buffer,
        URL,
        data-uri
        JSON,
        JSON-text
    }
    V list {}
    buffer from (v encodingEncode) [! Hello World] :: reporter
    get (v encodingDecode) of [! $helloDemo] :: reporter
    //
    buffer from list [v list] :: reporter no-monitor
    set list [v list] to [! $helloDemo]
    //
    V byteType {
        Int8,
        UInt8,
        Int16BE,
        UInt16BE,
        Int24BE,
        UInt24BE,
        Int32BE,
        UInt32BE,
        Int16LE,
        UInt16LE,
        Int24LE,
        UInt24LE,
        Int32LE,
        UInt32LE
    }
    slice from (0) (5) in [! $helloDemo] :: reporter
    read at (0) as [v byteType] in [! $helloDemo] :: reporter
    write (10) at (0) as [v byteType] in [!]
    //
    copy from [! $helloDemo] to (0) in [!]
    copy from (0) (5) in [! $helloDemo] to (0) in [!]
    //
    copy from [! $helloDemo] to (0) in list [v list]
    copy from (0) (5) in [! $helloDemo] to (0) in list [v list]
    //
    copy from list [v list] to (0) in [!]
    copy from (0) (5) in list [v list] to (0) in [!]
`, {
    NewBuffer: [
        (generator, block) => ({
            kind: 'input',
            length: generator.descendInputOfBlock(block, '$1')
        }),
        (node, compiler, { TypedInput, TYPE_UNKNOWN }) => {
            const length = compiler.descendInput(node.length).asNumber();
            return new TypedInput(`new Buffer(${length}, [])`, TYPE_UNKNOWN)
        }
    ],
    LengthOf: [
        (generator, block) => ({
            kind: 'input',
            buffer: generator.descendInputOfBlock(block, '$1')
        }),
        (node, compiler, { TypedInput, TYPE_NUMBER }) => {
            const buffer = asBuffer(compiler.descendInput(node.buffer));
            return new TypedInput(`${buffer}.length`, TYPE_NUMBER);
        }
    ],
    BufferFrom: [
        (generator, block) => ({
            kind: 'input',
            type: generator.descendInputOfBlock(block, '$1'),
            value: generator.descendInputOfBlock(block, '$2')
        }),
        (node, compiler, { TypedInput, TYPE_UNKNOWN }) => {
            const type = compiler.descendInput(node.type).asString();
            const value = compiler.descendInput(node.value).asUnknown();
            return new TypedInput(`(yield* (function*() {
                const val = Buffer.fromDataType(${type}, ${value});
                if (val instanceof Promise) return yield* waitPromise(val);
                return val;
            })())`, TYPE_UNKNOWN)
        }
    ],
    GetOf: [
        (generator, block) => ({
            kind: 'input',
            type: generator.descendInputOfBlock(block, '$1'),
            buffer: generator.descendInputOfBlock(block, '$2')
        }),
        (node, compiler, { TypedInput, TYPE_UNKNOWN, TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, TYPE_NUMBER_NAN }) => {
            const type = compiler.descendInput(node.type).asString();
            const buffer = compiler.descendInput(node.buffer);
            switch (type) {
            case TYPE_STRING:
                return new TypedInput(`Buffer.fromDataType('JSON-text', ${buffer.asString()}).toDataType(${type})`, TYPE_UNKNOWN)
            case TYPE_NUMBER:
            case TYPE_NUMBER_NAN:
            case TYPE_BOOLEAN:
                return new TypedInput(`new Buffer(0, []).toDataType(${type})`, TYPE_UNKNOWN);
            default:
                return new TypedInput(`${asBuffer(buffer)}.toDataType(${type})`, TYPE_UNKNOWN);
            }
        }
    ],
    BufferFromList: [
        (generator, block) => ({
            kind: 'input',
            list: generator.descendVariable(block, '$1', 'list')
        }),
        (node, compiler, { TypedInput, TYPE_UNKNOWN }) => {
            const list = compiler.referenceVariable(node.list);
            return new TypedInput(`new Buffer(${list}.value.length, ${list}.value)`, TYPE_UNKNOWN)
        }
    ],
    SetListTo: [
        (generator, block) => ({
            kind: 'stack',
            list: generator.descendVariable(block, '$1', 'list'),
            buffer: generator.descendInputOfBlock(block, '$2')
        }),
        (node, compiler) => {
            const list = compiler.referenceVariable(node.list);
            const buffer = compiler.descendInput(node.buffer);
            compiler.source +=`${list}.value = [...${asBuffer(buffer)}]; ${list}._monitorUpToDate = false;\n`;
        }
    ],
    SliceFromIn: [
        (generator, block) => ({
            kind: 'input',
            start: generator.descendInputOfBlock(block, '$1'),
            end: generator.descendInputOfBlock(block, '$2'),
            buffer: generator.descendInputOfBlock(block, '$3')
        }),
        (node, compiler, { TypedInput, TYPE_UNKNOWN }) => {
            const start = compiler.descendInput(node.start).asNumber();
            const end = compiler.descendInput(node.end).asNumber();
            const buffer = asBuffer(compiler.descendInput(node.buffer));
            
            return new TypedInput(`${buffer}.slice(${start}, ${end})`, TYPE_UNKNOWN);
        }
    ],
    ReadAtAsIn: [
        (generator, block) => ({
            kind: 'input',
            address: generator.descendInputOfBlock(block, '$1'),
            type: block.fields.$2.value,
            buffer: generator.descendInputOfBlock(block, '$3')
        }),
        (node, compiler, { TypedInput, TYPE_NUMBER }) => {
            const address = compiler.descendInput(node.address).asNumber();
            const buffer = asBuffer(compiler.descendInput(node.buffer));
            switch (node.type) {
            case 'Int8':
                return new TypedInput(`${buffer}.readInt8(${address})`, TYPE_NUMBER);
            case 'UInt8':
                return new TypedInput(`${buffer}.readUInt8(${address})`, TYPE_NUMBER);
            case 'Int16BE':
                return new TypedInput(`${buffer}.readInt16BE(${address})`, TYPE_NUMBER);
            case 'UInt16BE':
                return new TypedInput(`${buffer}.readUInt16BE(${address})`, TYPE_NUMBER);
            case 'Int24BE':
                return new TypedInput(`${buffer}.readInt24BE(${address})`, TYPE_NUMBER);
            case 'UInt24BE':
                return new TypedInput(`${buffer}.readUInt24BE(${address})`, TYPE_NUMBER);
            default:
            case 'Int32BE':
                return new TypedInput(`${buffer}.readInt32BE(${address})`, TYPE_NUMBER);
            case 'UInt32BE':
                return new TypedInput(`${buffer}.readUInt32BE(${address})`, TYPE_NUMBER);
            case 'Int16LE':
                return new TypedInput(`${buffer}.readInt16LE(${address})`, TYPE_NUMBER);
            case 'UInt16LE':
                return new TypedInput(`${buffer}.readUInt16LE(${address})`, TYPE_NUMBER);
            case 'Int24LE':
                return new TypedInput(`${buffer}.readInt16LE(${address})`, TYPE_NUMBER);
            case 'UInt24LE':
                return new TypedInput(`${buffer}.readUInt16LE(${address})`, TYPE_NUMBER);
            case 'Int32LE':
                return new TypedInput(`${buffer}.readInt32LE(${address})`, TYPE_NUMBER);
            case 'UInt32LE':
                return new TypedInput(`${buffer}.readUInt32LE(${address})`, TYPE_NUMBER);
            }
        }
    ],
    WriteAtAsIn: [
        (generator, block) => ({
            kind: 'stack',
            value: generator.descendInputOfBlock(block, '$1'),
            address: generator.descendInputOfBlock(block, '$2'),
            type: block.fields.$3.value,
            buffer: generator.descendInputOfBlock(block, '$4')
        }),
        (node, compiler) => {
            const value = compiler.descendInput(node.value).asNumber()
            const address = compiler.descendInput(node.address).asNumber();
            const buffer = asBuffer(compiler.descendInput(node.buffer));
            switch (node.type) {
            case 'Int8':
                compiler.source +=`${buffer}.writeInt8(${address}, ${value});`;
            case 'UInt8':
                compiler.source +=`${buffer}.writeUInt8(${address}, ${value});`;
            case 'Int16BE':
                compiler.source +=`${buffer}.writeInt16BE(${address}, ${value});`;
            case 'UInt16BE':
                compiler.source +=`${buffer}.writeUInt16BE(${address}, ${value});`;
            case 'Int24BE':
                compiler.source +=`${buffer}.writeInt24BE(${address}, ${value});`;
            case 'UInt24BE':
                compiler.source +=`${buffer}.writeUInt24BE(${address}, ${value});`;
            default:
            case 'Int32BE':
                compiler.source +=`${buffer}.writeInt32BE(${address}, ${value});`;
            case 'UInt32BE':
                compiler.source +=`${buffer}.writeUInt32BE(${address}, ${value});`;
            case 'Int16LE':
                compiler.source +=`${buffer}.writeInt16LE(${address}, ${value});`;
            case 'UInt16LE':
                compiler.source +=`${buffer}.writeUInt16LE(${address}, ${value});`;
            case 'Int24LE':
                compiler.source +=`${buffer}.writeInt16LE(${address}, ${value});`;
            case 'UInt24LE':
                compiler.source +=`${buffer}.writeUInt16LE(${address}, ${value});`;
            case 'Int32LE':
                compiler.source +=`${buffer}.writeInt32LE(${address}, ${value});`;
            case 'UInt32LE':
                compiler.source +=`${buffer}.writeUInt32LE(${address}, ${value});`;
            }
        }
    ],
    CopyFromToIn: [
        (generator, block) => ({
            kind: 'stack',
            source: generator.descendInputOfBlock(block, '$1'),
            address: generator.descendInputOfBlock(block, '$2'),
            target: generator.descendInputOfBlock(block, '$3')
        }),
        (node, compiler) => {
            const source = asBuffer(compiler.descendInput(node.source));
            const address = compiler.descendInput(node.address).asNumber();
            const target = asBuffer(compiler.descendInput(node.target));

            compiler.source +=`${target}.copy(${source}, ${address});\n`;
        }
    ],
    CopyFromInToIn: [
        (generator, block) => ({
            kind: 'stack',
            start: generator.descendInputOfBlock(block, '$1'),
            end: generator.descendInputOfBlock(block, '$2'),
            source: generator.descendInputOfBlock(block, '$3'),
            address: generator.descendInputOfBlock(block, '$4'),
            target: generator.descendInputOfBlock(block, '$5')
        }),
        (node, compiler) => {
            const start = compiler.descendInput(node.start).asNumber();
            const end = compiler.descendInput(node.end).asNumber();
            const source = asBuffer(compiler.descendInput(node.source));
            const address = compiler.descendInput(node.address).asNumber();
            const target = asBuffer(compiler.descendInput(node.target));

            compiler.source +=`${target}.copy(${source}, ${address}, ${start}, ${end});\n`;
        }
    ],
    CopyFromToInList: [
        (generator, block) => ({
            kind: 'stack',
            source: generator.descendInputOfBlock(block, '$1'),
            address: generator.descendInputOfBlock(block, '$2'),
            target: generator.descendVariable(block, '$3', 'list')
        }),
        (node, compiler) => {
            const source = asBuffer(compiler.descendInput(node.source));
            const address = compiler.descendInput(node.address).asNumber();
            const target = compiler.referenceVariable(node.target);
            const sourceVar = compiler.localVariables.next();
            const addressVar = compiler.localVariables.next();

            compiler.source +=`var ${sourceVar} = ${source};\n`;
            compiler.source +=`var ${addressVar} = ${address};\n`;
            compiler.source +=`for (let i = 0; i < ${sourceVar}.length; i++) {\n`;
            compiler.source +=`    ${target}.value[i + ${addressVar}] = ${sourceVar}[i];\n`;
        }
    ],
    CopyFromInToInList: [
        (generator, block) => ({
            kind: 'stack',
            start: generator.descendInputOfBlock(block, '$1'),
            end: generator.descendInputOfBlock(block, '$2'),
            source: generator.descendInputOfBlock(block, '$3'),
            address: generator.descendInputOfBlock(block, '$4'),
            target: generator.descendVariable(block, '$5', 'list')
        }),
        (node, compiler) => {
            const start = compiler.descendInput(node.start).asNumber();
            const end = compiler.descendInput(node.end).asNumber();
            const source = asBuffer(compiler.descendInput(node.source));
            const address = compiler.descendInput(node.address).asNumber();
            const target = compiler.referenceVariable(node.target);
            const sourceVar = compiler.localVariables.next();
            const addressVar = compiler.localVariables.next();
            const startVar = compiler.localVariables.next();
            const endVar = compiler.localVariables.next();
            const lengthVar = compiler.localVariables.next();

            compiler.source +=`var ${sourceVar} = ${source};\n`;
            compiler.source +=`var ${addressVar} = ${address};\n`;
            compiler.source +=`var ${startVar} = ${start};\n`;
            compiler.source +=`var ${endVar} = ${end};\n`;
            compiler.source +=`if (${endVar} < ${startVar}) {
                const temp = ${startVar};
                ${startVar} = ${endVar};
                ${endVar} = temp;
            }`
            compiler.source +=`var ${lengthVar} = ${endVar} - ${startVar};\n`
            compiler.source +=`for (let i = 0; i < ${lengthVar}; i++) {\n`;
            compiler.source +=`    ${target}.value[i + ${addressVar}] = ${sourceVar}[i + ${startVar}];\n`;
        }
    ],
    CopyFromListToIn: [
        (generator, block) => ({
            kind: 'stack',
            source: generator.descendVariable(block, '$1', 'list'),
            address: generator.descendInputOfBlock(block, '$2'),
            target: generator.descendInputOfBlock(block, '$3')
        }),
        (node, compiler) => {
            const source = compiler.referenceVariable(node.source);
            const address = compiler.descendInput(node.address).asNumber();
            const target = asBuffer(compiler.descendInput(node.target));

            compiler.source +=`${target}.copy(${source}.value, ${address});\n`;
        }
    ],
    CopyFromInListToIn: [
        (generator, block) => ({
            kind: 'stack',
            start: generator.descendInputOfBlock(block, '$1'),
            end: generator.descendInputOfBlock(block, '$2'),
            source: generator.descendVariable(block, '$3', 'list'),
            address: generator.descendInputOfBlock(block, '$4'),
            target: generator.descendInputOfBlock(block, '$5')
        }),
        (node, compiler) => {
            const start = compiler.descendInput(node.start).asNumber();
            const end = compiler.descendInput(node.end).asNumber();
            const source = compiler.referenceVariable(node.source);
            const address = compiler.descendInput(node.address).asNumber();
            const target = asBuffer(compiler.descendInput(node.target));

            compiler.source +=`${target}.copy(${source}.value, ${address}, ${start}, ${end});\n`;
        }
    ]
}, {
    helloDemo: Buffer.fromDataType('utf-8', 'Hello World').toDataType('JSON-text')
})[0];
info.menus.list.variableType = 'list';