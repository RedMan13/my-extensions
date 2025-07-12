import { Base64Binary } from '../../util/b64-binnary';
import { vm } from '../../util/scratch-types';

export class Buffer extends Uint8ClampedArray {
    static id = 'gsaBufferType';
    static byteColors = [
        '#fff',
        '#ddd'
    ];
    static locationColors = [
        '#eee',
        '#ccc'
    ];
    /**
     * Create a new Buffer from some type of data
     * @param {string} type 
     * @param {string|{ length: number, data: number[] }|number[]} value 
     * @returns {Buffer}
     */
    static fromDataType(type, value) {
        switch (type) {
        case 'hex': {
            const bytes = [...value]
                .filter(c => '0123456789ABCDEFabcdef'.includes(c))
                .reduce((c,v,i) => ((i % 2) ? c.at(-1).push(v) : c.push([v]), c), [])
                .map(c => parseInt(c.join(''), 16));
            return new Buffer(bytes.length, bytes);
        }
        case 'binary': {
            const bytes = [...value]
                .filter(c => '01'.includes(c))
                .reduce((c,v,i) => (!(i % 8) ? c.at(-1).push(v) : c.push([v]), c), [])
                .map(c => parseInt(c.join(''), 2));
            return new Buffer(bytes.length, bytes);
        }
        case 'base64': {
            const bytes = Base64Binary.decode(value);
            return new Buffer(bytes.length, bytes);
        }
        case 'base64-url': {
            const bytes = Base64Binary.decode(value, null, true);
            return new Buffer(bytes.length, bytes);
        }
        case 'buffer':
            return new Buffer(value.length, value);
        case 'data-uri':
        case 'URL':
            return fetch(value)
                .then(res => res.bytes())
                .then(arr => new Buffer(arr.length, arr));
        default:
        case 'JSON-text':
        case 'JSON':
            try {
                const res = typeof value === 'string' ? JSON.parse(value) : value;
                switch (typeof res) {
                case 'string':
                    return Buffer.fromDataType('utf-8', res);
                case 'object':
                    if (!res.length) return new Buffer(0, []);
                    return new Buffer(res.length, res?.data ?? res);
                case 'boolean':
                case 'number':
                default: return new Buffer(0, []);
                }
                break;
            } catch (err) {}
            // treat the input as a string if JSON parse fails
        case 'utf-8':
        case 'utf-16be':
        case 'utf-16le':
        case 'ascii':
        case 'ibm866':
        case 'iso-8859-1':
        case 'iso-8859-2':
        case 'iso-8859-3':
        case 'iso-8859-4':
        case 'iso-8859-5':
        case 'iso-8859-6':
        case 'iso-8859-7':
        case 'iso-8859-8':
        case 'iso-8859-8-i':
        case 'iso-8859-9':
        case 'iso-8859-10':
        case 'iso-8859-11':
        case 'iso-8859-13':
        case 'iso-8859-14':
        case 'iso-8859-15':
        case 'iso-8859-16':
        case 'koi8-r':
        case 'koi8-u':
        case 'macintosh':
        case 'windows-1250':
        case 'windows-1251':
        case 'windows-1252':
        case 'windows-1253':
        case 'windows-1254':
        case 'windows-1255':
        case 'windows-1256':
        case 'windows-1257':
        case 'windows-1258':
        case 'x-mac-cyrillic':
        case 'gbk':
        case 'gb18030':
        case 'hz-gb-2312':
        case 'big5':
        case 'euc-jp':
        case 'iso-2022-jp':
        case 'shift-jis':
        case 'euc-kr':
        case 'x-user-defined':
        case 'iso-2022-cn': {
            const encoder = new TextEncoder(type);
            if (encoder.encoding !== type)
                throw new Error(`This browser only allows ${encoder.encoding} text strings`);
            const bytes = encoder.encode(value);
            return new Buffer(bytes.length, bytes);
        }
        }
    }

    constructor(size = 0, bytes = []) {
        super(size);
        this.customId = Buffer.id;
        for (let i = 0; i < bytes.length; i++)
            this[i] = bytes[i];
    }
    /**
     * Convert this buffer to some data type
     * @param {string} type 
     * @returns {string|{ length: number, data: number[] }}
     */
    toDataType(type) {
        switch (type) {
        case 'hex':
            return this.toString();
        case 'binary':
            return [...this.bytes]
                .map(byte => byte
                    .toString(2)
                    .toUpperCase()
                    .padStart(2, '0'))
                .join('');
        case 'base64':
            return Base64Binary.encode(this);
        case 'base64-url':
            return Base64Binary.encode(this, true);
        case 'buffer':
            return this;
        case 'data-uri':
            const b64 = this.toDataType('base64-url');
            return `data:application/octet-stream;base64,${b64}`;
        case 'URL':
            const blob = new Blob([this]);
            return URL.createObjectURL(blob);
        case 'JSON-text':
            return JSON.stringify(serialize(this));
        default:
        case 'JSON':
            return serialize(this);
        case 'utf-8':
        case 'utf-16be':
        case 'utf-16le':
        case 'ascii':
        case 'ibm866':
        case 'iso-8859-1':
        case 'iso-8859-2':
        case 'iso-8859-3':
        case 'iso-8859-4':
        case 'iso-8859-5':
        case 'iso-8859-6':
        case 'iso-8859-7':
        case 'iso-8859-8':
        case 'iso-8859-8-i':
        case 'iso-8859-9':
        case 'iso-8859-10':
        case 'iso-8859-11':
        case 'iso-8859-13':
        case 'iso-8859-14':
        case 'iso-8859-15':
        case 'iso-8859-16':
        case 'koi8-r':
        case 'koi8-u':
        case 'macintosh':
        case 'windows-1250':
        case 'windows-1251':
        case 'windows-1252':
        case 'windows-1253':
        case 'windows-1254':
        case 'windows-1255':
        case 'windows-1256':
        case 'windows-1257':
        case 'windows-1258':
        case 'x-mac-cyrillic':
        case 'gbk':
        case 'gb18030':
        case 'hz-gb-2312':
        case 'big5':
        case 'euc-jp':
        case 'iso-2022-jp':
        case 'shift-jis':
        case 'euc-kr':
        case 'x-user-defined':
        case 'iso-2022-cn':
            const decoder = new TextDecoder(type);
            return decoder.decode(this);
        }
    }
    toString() {
        let str = '';
        for (let i = 0; i < this.length; i++)
            str += this[i].toString(16).padStart(2, '0');
        return str;
    }
    readInt8(at) {
        return (this[at] & 0b01111111) * ((this[at] & 0b10000000) ? -1 : 1);
    }
    readUInt8(at) {
        return this[at];
    }
    readInt16LE(at) {
        const r = this[at];
        const l = this[at +1];
        return ((l << 8) | r) * ((l & 0b10000000) ? -1 : 1);
    }
    readInt16BE(at) {
        const l = this[at];
        const r = this[at +1];
        return ((l << 8) | r) * ((l & 0b10000000) ? -1 : 1);
    }
    readUInt16LE(at) {
        const r = this[at];
        const l = this[at +1];
        return (l << 8) | r;
    }
    readUInt16BE(at) {
        const l = this[at];
        const r = this[at +1];
        return (l << 8) | r;
    }
    readInt24LE(at) {
        const r = this[at];
        const m = this[at +1];
        const l = this[at +2];
        return ((l << 16) | (m << 8) | r) * ((l & 0b10000000) ? -1 : 1);
    }
    readInt24BE(at) {
        const l = this[at];
        const m = this[at +1];
        const r = this[at +2];
        return ((l << 16) | (m << 8) | r) * ((l & 0b10000000) ? -1 : 1);
    }
    readUInt24LE(at) {
        const r = this[at];
        const m = this[at +1];
        const l = this[at +2];
        return (l << 16) | (m << 8) | r;
    }
    readUInt24BE(at) {
        const l = this[at];
        const m = this[at +1];
        const r = this[at +2];
        return (l << 16) | (m << 8) | r;
    }
    readInt32LE(at) {
        const r = this[at];
        const rm = this[at +1];
        const lm = this[at +2]
        const l = this[at +3];
        return ((l << 24) | (lm << 16) | (rm << 8) | r) * ((l & 0b10000000) ? -1 : 1);
    }
    readInt32BE(at) {
        const l = this[at];
        const lm = this[at +1];
        const rm = this[at +2]
        const r = this[at +3];
        return ((l << 24) | (lm << 16) | (rm << 8) | r) * ((l & 0b10000000) ? -1 : 1);
    }
    readUInt32LE(at) {
        const r = this[at];
        const rm = this[at +1];
        const lm = this[at +2]
        const l = this[at +3];
        // as mentioned later, js will treat this last bit as a sign, but we dont want that here
        // so explicitly cut out that bit and add it back later
        return (((l & 0b01111111) << 24) | (lm << 16) | (rm << 8) | r) + ((l & 0b10000000) ? 0x80000000 : 0);
    }
    readUInt32BE(at) {
        const l = this[at];
        const lm = this[at +1];
        const rm = this[at +2]
        const r = this[at +3];
        return (((l & 0b01111111) << 24) | (lm << 16) | (rm << 8) | r) + ((l & 0b10000000) ? 0x80000000 : 0);
    }
    writeInt8(at, value) {
        this[at] = (value & 0b01111111) | (value < 0) ? 0b10000000 : 0;
    }
    writeUInt8(at, value) {
        this[at] = value & 0xFF;
    }
    writeInt16LE(at, value) {
        this[at] = value & 0x00FF;
        this[at +1] = ((value & 0b0111111100000000) >> 8) | (value < 0) ? 0b10000000 : 0;
    }
    writeInt16BE(at, value) {
        this[at] = ((value & 0b0111111100000000) >> 8) | (value < 0) ? 0b10000000 : 0;
        this[at +1] = value & 0x00FF;
    }
    writeUInt16LE(at, value) {
        this[at] = value & 0x00FF;
        this[at +1] = (value & 0xFF00) >> 8;
    }
    writeUInt16BE(at, value) {
        this[at] = (value & 0xFF00) >> 8;
        this[at +1] = value & 0x00FF;
    }
    writeInt24LE(at, value) {
        this[at] = value & 0x0000FF;
        this[at +1] = (value & 0x00FF00) >> 8;
        this[at +2] = ((value & 0b011111110000000000000000) >> 16) | (value < 0) ? 0b10000000 : 0;
    }
    writeInt24BE(at, value) {
        this[at] = ((value & 0b011111110000000000000000) >> 16) | (value < 0) ? 0b10000000 : 0;
        this[at +1] = (value & 0x00FF00) >> 8;
        this[at +2] = value & 0x0000FF;
    }
    writeUInt24LE(at, value) {
        this[at] = value & 0x0000FF;
        this[at +1] = (value & 0x00FF00) >> 8;
        this[at +2] = (value & 0xFF0000) >> 8;
    }
    writeUInt24BE(at, value) {
        this[at] = (value & 0xFF0000) >> 8;
        this[at +1] = (value & 0x00FF00) >> 8;
        this[at +2] = value & 0x0000FF;
    }
    writeInt32LE(at, value) {
        this[at] = value & 0x000000FF;
        this[at +1] = (value & 0x0000FF00) >> 8;
        this[at +2] = (value & 0x00FF0000) >> 16;
        this[at +3] = (value & 0xFF000000) >> 24;
    }
    writeInt32BE(at, value) {
        this[at] = (value & 0xFF000000) >> 24;
        this[at +1] = (value & 0x00FF0000) >> 16;
        this[at +2] = (value & 0x0000FF00) >> 8;
        this[at +3] = value & 0x000000FF;
    }
    writeUInt32LE(at, value) {
        this[at] = value & 0x000000FF;
        this[at +1] = (value & 0x0000FF00) >> 8;
        this[at +2] = (value & 0x00FF0000) >> 16;
        // js will unset the last bit if this isnt negative, even if the number is much larger
        // than [-2147483648, 2147483647] range, so since we dont care about negatives set that bit back
        this[at +3] = ((value & 0xFF000000) >> 24) | (value > 0x7FFFFFFF ? 0b10000000 : 0);
    }
    writeUInt32BE(at, value) {
        this[at] = ((value & 0xFF000000) >> 24) | (value > 0x7FFFFFFF ? 0b10000000 : 0);
        this[at +1] = (value & 0x00FF0000) >> 16;
        this[at +2] = (value & 0x0000FF00) >> 8;
        this[at +3] = value & 0x000000FF;
    }
    copy(source, to, start, end) {
        start ||= 0;
        end ||= source.length;
        if (end < start) {
            const temp = start;
            start = end;
            end = temp;
        }
        const length = end - start;
        if ((length + to) > this.length) 
            throw new RangeError('The requested copy is to large to fit inside this buffer');
        for (let i = 0; i < length; i++)
            this[i + to] = source[start + i];
    }

    /* Custom Type Handling */

    toReporterContent() {
        const body = <tbody />;
        let end = null;
        for (let i = 0; (i < 0x1000 && i < this.length); i++) {
            if (!(i % 16))
                body.appendChild(end = <tr>
                    <th scope="row" style={`background-color: ${Buffer.locationColors[((i / 16) +1) % 2]}`}>
                        {i.toString(16).padStart(3, '0')}
                    </th>
                </tr>);
            if (i >= 0xFFF) {
                end.appendChild(<td style={`background-color: ${Buffer.byteColors[i % 2]}`}>…</td>);
            } else 
                end.appendChild(<td style={`background-color: ${Buffer.byteColors[i % 2]}`}>
                    {this[i].toString(16).padStart(2, '0').toUpperCase()}
                </td>);
        }
        return <table style="font-family: monospace;">
            <thead>
                <tr>
                    <th scope="col" style={`width: 1.8rem; background-color: ${Buffer.locationColors[0]}`}></th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[1]}`}>0</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[0]}`}>1</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[1]}`}>2</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[0]}`}>3</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[1]}`}>4</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[0]}`}>5</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[1]}`}>6</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[0]}`}>7</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[1]}`}>8</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[0]}`}>9</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[1]}`}>A</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[0]}`}>B</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[1]}`}>C</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[0]}`}>D</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[1]}`}>E</th>
                    <th scope="col" style={`width: 0.8rem; background-color: ${Buffer.locationColors[0]}`}>F</th>
                </tr>
            </thead>
            {body}
        </table>;
    }
    toMonitorContent() {
        const nodes = [];
        for (let i = 0; (i < 0x1000 && i < this.length); i++) {
            if (i >= 0xFFF) {
                nodes.push(<span style="display: inline-block; padding-right: 4px;">…</span>);
            } else {
                nodes.push(<span style="display: inline-block; padding-right: 4px;">
                    {this[i].toString(16).padStart(2, '0')}
                </span>);
            }
        }
        return <span style="font: monospace">{nodes}</span>
    }
    toListEditor() {
        return this.toString();
    }
    fromListEditor(str) {
        const bytes = str.split(' ').map(parseInt);
        // have to reserve new memory to expand the buffer :bfdi:
        return new Buffer(bytes.length, bytes);
    }
}
export function serialize(instance) {
    // custom type is an array, to ensure JSON serialize understands convert it to a literal array
    return {
        length: instance.length,
        data: [...instance]
            // we can compress the array mildly by removing trailing zeros
            .reduceRight((c,v) => (c.noSkip = c.noSkip || !!v) ? (c.val.unshift(v), c) : c, { noSkip: true, val: [] })
            .val
    };
}
export function deserialize(array) {
    return new Buffer(array.length, array.data);
}

vm.runtime.registerSerializer(Buffer.id, serialize, deserialize);

window.Buffer = Buffer;