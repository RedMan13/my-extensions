import { castDynamic, castAutomatic } from "../../util/json-type-casting";
import { getAtIn, setAtIn } from "../../util/object-path-keying";
import { fixForServ00Rules } from "../../util/extension-sublimate";

if (!Scratch.extensions.unsandboxed)
    throw new Error("can not load out side unsandboxed mode");

const { vm } = Scratch;
const { runtime } = vm;

const extensionId = "gsaHTTPRequests";

// the funny class to make event blocks look better
class Events {
    constructor() {
        this.events = {};
        this.blocks = {};
    }

    /**
     * adds a event name listner for a block
     * @param {string} name name of the event
     * @param {string} [block] a block to run when trigered
     */
    add(name, block) {
        if (block) {
            if (!this.blocks[name]) this.blocks[name] = [];
            this.blocks[name].push(block);
        }
    }

    /**
     * activate an event
     * @param {string} name name of the event
     */
    activate(name) {
        this.events[name] = true;
        if (this.blocks[name]) {
            for (const block of this.blocks[name]) {
                runtime.startHats(block);
            }
        }
    }
}
const createBlockId = (block) => `${extensionId}_${block}`;

/* ------- BLOCKS -------- */
const { BlockType, Cast, ArgumentType } = Scratch;

class WebRequests {
    static get defaultRequest() {
        const defaultRequest = {
            events: new Events(),
            get mimeType() {
                return this.options.headers["Content-Type"];
            },
            set mimeType(value) {
                if (
                    this.options.headers["Content-Type"] === "multipart/form-data" &&
                    value !== "multipart/form-data"
                ) {
                    this.options.body = "";
                }
                this.options.headers["Content-Type"] = value;
            },
            set method(val) {
                this.options.method = val;
                // remove body on get requests
                if (val === "GET") {
                    delete this.options.body;
                }
            },
            get method() {
                return this.options.method;
            },
            options: {
                headers: {
                    "Content-Type": "text/plain",
                },
                method: "GET",
            },
            set body(val) {
                if (this.method === "GET") return;
                if (
                    val instanceof FormData &&
                    !(this.options.body instanceof FormData)
                ) {
                    this.options.body = val;
                    this.options.headers["Content-Type"] = "multipart/form-data";
                }
                if (
                    !(val instanceof FormData) &&
                    this.options.body instanceof FormData
                ) {
                    this.options.body = "";
                    this.options.headers["Content-Type"] = "text/plain";
                }
                this.options.body = val;
            },
            get body() {
                return this.options.body;
            },
            end: false,
            fail: false,
            success: false,
        };

        defaultRequest.events.add("reqSuccess", createBlockId("onResponse"));
        defaultRequest.events.add("reqFail", createBlockId("onFail"));

        return defaultRequest;
    }
    static get defaultResponse() {
        const defaultResponse = {
            text: "",
            status: "",
            statusText: "",
            headers: new Headers(),
            error: "",
            url: "",
        };

        return defaultResponse;
    }

    /**
     * no need to install runtime as it comes with Scratch var
     */
    constructor() {
        this.clearAll();
        this.showingExtra = false;

        Scratch.vm.runtime.on("RUNTIME_DISPOSED", () => {
            this.clearAll();
        });
    }
    getInfo() {
        fixForServ00Rules();
        return {
            id: extensionId,
            // eslint-disable-next-line extension/should-translate
            name: "HTTP",
            color1: "#307eff",
            color2: "#2c5eb0",
            blocks: [
                {
                    opcode: "clearAll",
                    blockType: BlockType.COMMAND,
                    text: Scratch.translate("clear current data"),
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: Scratch.translate("Response"),
                },
                {
                    opcode: "resData",
                    blockType: BlockType.REPORTER,
                    text: Scratch.translate("response"),
                },
                {
                    opcode: "error",
                    blockType: BlockType.REPORTER,
                    text: Scratch.translate("error"),
                },
                {
                    opcode: "status",
                    blockType: BlockType.REPORTER,
                    text: Scratch.translate("status"),
                },
                {
                    opcode: "statusText",
                    blockType: BlockType.REPORTER,
                    text: Scratch.translate("status text"),
                },
                "---",
                {
                    opcode: "getHeaderJSON",
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    text: Scratch.translate("headers as json"),
                },
                {
                    opcode: "getHeaderValue",
                    blockType: BlockType.REPORTER,
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: "name",
                        },
                    },
                    text: Scratch.translate("[name] from header"),
                },
                "---",
                {
                    opcode: "requestComplete",
                    blockType: BlockType.BOOLEAN,
                    text: Scratch.translate("site responded?"),
                },
                {
                    opcode: "requestFail",
                    blockType: BlockType.BOOLEAN,
                    text: Scratch.translate("request failed?"),
                },
                {
                    opcode: "requestSuccess",
                    blockType: BlockType.BOOLEAN,
                    text: Scratch.translate("request succeeded?"),
                },
                "---",
                {
                    opcode: "onResponse",
                    blockType: BlockType.EVENT,
                    isEdgeActivated: false,
                    text: Scratch.translate("when a site responds"),
                },
                {
                    opcode: "onFail",
                    blockType: BlockType.EVENT,
                    isEdgeActivated: false,
                    text: Scratch.translate("when a request fails"),
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: Scratch.translate("Request"),
                },
                {
                    opcode: "setMimeType",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        type: {
                            type: ArgumentType.STRING,
                            menu: "mimeType",
                            defaultValue: this.request.mimeType,
                        },
                    },
                    text: Scratch.translate("set content type to [type]"),
                },
                {
                    opcode: "setRequestmethod",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        method: {
                            type: ArgumentType.STRING,
                            menu: "method",
                            defaultValue: this.request.method,
                        },
                    },
                    text: Scratch.translate("set request method to [method]"),
                },
                {
                    opcode: "setHeaderData",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: "Content-Type",
                        },
                        value: {
                            type: ArgumentType.STRING,
                            defaultValue: this.request.mimeType,
                        },
                    },
                    text: Scratch.translate("in header set [name] to [value]"),
                },
                {
                    opcode: "setHeaderJSON",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        json: {
                            type: ArgumentType.STRING,
                            defaultValue: `{"Content-Type": "${this.request.mimeType}"}`,
                        },
                    },
                    text: Scratch.translate("set headers to json [json]"),
                },
                {
                    opcode: "setBody",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        text: {
                            type: ArgumentType.STRING,
                            default: "Apple!",
                        },
                    },
                    text: Scratch.translate("set request body to [text]"),
                },
                "---",
                {
                    opcode: "setBodyToForm",
                    blockType: BlockType.COMMAND,
                    text: Scratch.translate("set request body to multipart form"),
                },
                {
                    opcode: "getFormProperty",
                    blockType: BlockType.REPORTER,
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: "name",
                        },
                    },
                    text: Scratch.translate("[name] in multipart form"),
                },
                {
                    opcode: "setFormProperty",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: "name",
                        },
                        value: {
                            type: ArgumentType.STRING,
                            defaultValue: "value",
                        },
                    },
                    text: Scratch.translate("set [name] to [value] in multipart form"),
                },
                {
                    opcode: "deleteFormProperty",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: "name",
                        },
                    },
                    text: Scratch.translate("delete [name] from multipart form"),
                },
                "---",
                {
                    opcode: "sendRequest",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        url: {
                            type: ArgumentType.STRING,
                            defaultValue: "https://extensions.turbowarp.org/hello.txt",
                        },
                    },
                    text: Scratch.translate("send request to [url]"),
                },
                {
                    func: "showExtra",
                    blockType: BlockType.BUTTON,
                    text: Scratch.translate("Show Extra"),
                    hideFromPalette: this.showingExtra,
                },
                {
                    func: "hideExtra",
                    blockType: BlockType.BUTTON,
                    text: Scratch.translate("Hide Extra"),
                    hideFromPalette: !this.showingExtra,
                },
                {
                    opcode: "setUnkownProperty",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        path: {
                            type: ArgumentType.STRING,
                            defaultValue: "path.to.item",
                        },
                        value: {
                            type: ArgumentType.STRING,
                            defaultValue: "data",
                        },
                    },
                    text: Scratch.translate("set [path] to [value] in request options"),
                    hideFromPalette: !this.showingExtra,
                },
                {
                    opcode: "setUnkownPropertyType",
                    blockType: BlockType.COMMAND,
                    arguments: {
                        path: {
                            type: ArgumentType.STRING,
                            defaultValue: "path.to.item",
                        },
                        type: {
                            type: ArgumentType.STRING,
                            menu: "jsTypes",
                        },
                    },
                    text: Scratch.translate(
                        "set [path] to type [type] in request options"
                    ),
                    hideFromPalette: !this.showingExtra,
                },
                {
                    opcode: "getUnkownProperty",
                    blockType: BlockType.REPORTER,
                    arguments: {
                        path: {
                            type: ArgumentType.STRING,
                            defaultValue: "path.to.item",
                        },
                    },
                    text: Scratch.translate("[path] in request options"),
                    hideFromPalette: !this.showingExtra,
                },
                {
                    opcode: "getUnkownPropertyType",
                    blockType: BlockType.REPORTER,
                    arguments: {
                        path: {
                            type: ArgumentType.STRING,
                            defaultValue: "path.to.item",
                        },
                    },
                    text: Scratch.translate("type of [path] in request options"),
                    hideFromPalette: !this.showingExtra,
                },
            ],
            menus: {
                jsTypes: {
                    items: ["string", "number", "boolean", "object"],
                },
                method: {
                    items: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
                    acceptReporters: true,
                },
                mimeType: {
                    items: [
                        "application/json",
                        "application/x-www-form-urlencoded",
                        "application/javascript",
                        "application/ogg",
                        "application/pdf",
                        "application/ld+json",
                        "application/xml",
                        "application/zip",
                        "audio/mpeg",
                        "image/gif",
                        "image/jpeg",
                        "image/png",
                        "image/tiff",
                        "image/x-icon",
                        "image/svg+xml",
                        "text/css",
                        "text/csv",
                        "text/html",
                        "text/plain",
                        "text/xml",
                        "video/mpeg",
                        "video/mp4",
                        "video/x-ms-wmv",
                        "video/x-msvideo",
                        "video/x-flv",
                        "video/webm",
                    ],
                    acceptReporters: true,
                },
            },
        };
    }

    /* ------ RESETING ------- */

    clearAll() {
        this.request = WebRequests.defaultRequest;
        this.response = WebRequests.defaultResponse;
    }

    /* ------- DATA READING -------- */

    resData() {
        return this.response.text;
    }

    error() {
        return this.response.error;
    }

    status() {
        return this.response.status;
    }

    requestComplete() {
        return this.request.end;
    }

    requestFail() {
        return this.request.fail;
    }

    requestSuccess() {
        return this.request.success;
    }

    statusText() {
        return this.response.statusText;
    }

    getHeaderValue(args) {
        const name = Cast.toString(args.name);
        return this.response.get(name);
    }

    getHeaderJSON() {
        const object = {};
        for (const entry of this.response.headers.entries()) {
            object[entry[0]] = entry[1];
        }
        return JSON.stringify(object);
    }

    /* -------- CONTROL --------- */

    setMimeType(args) {
        const type = Cast.toString(args.type);
        this.request.mimeType = type;
    }

    setRequestmethod(args) {
        const method = Cast.toString(args.method);
        this.request.method = method;
    }

    setHeaderData(args) {
        const key = Cast.toString(args.name);
        const value = Cast.toString(args.value);
        this.request.options.headers[key] = value;
    }

    setHeaderJSON(args) {
        const json = Cast.toString(args.json);
        let object;
        // ignore invalid data
        try {
            object = JSON.parse(json);
        } catch {
            return;
        }
        if (typeof object !== "object") return;
        this.request.options.headers = object;
    }

    setBody(args) {
        const body = Cast.toString(args.text);
        this.request.body = body;
    }

    setBodyToForm() {
        this.request.body = new FormData();
    }

    getFormProperty(args) {
        if (!(this.request.options.body instanceof FormData)) return;
        const name = Cast.toString(args.name);
        return this.request.body.get(name);
    }

    setFormProperty(args) {
        if (!(this.request.options.body instanceof FormData)) return;
        const name = Cast.toString(args.name);
        const value = Cast.toString(args.value);
        this.request.body.set(name, value);
    }

    deleteFormProperty(args) {
        if (!(this.request.options.body instanceof FormData)) return;
        const name = Cast.toString(args.name);
        this.request.body.delete(name);
    }

    async sendRequest(args) {
        const url = Cast.toString(args.url);
        const options = this.request.options;

        this.clearAll();

        this.response.url = url;
        try {
            const res = await Scratch.fetch(url, options);
            // @ts-ignore
            this.response.status = res.status;
            this.response.headers = res.headers;
            this.response.statusText = res.statusText;
            if (res.ok) {
                this.request.success = true;
                this.request.events.activate("reqSuccess");
            } else {
                this.request.fail = true;
                this.request.events.activate("reqFail");
            }
            this.request.end = true;
            if (res.headers.get("Content-Type") === "multipart/form-data") {
                const form = await res.formData();
                const json = {};
                for (const [key, value] of form.entries()) {
                    json[key] = value;
                }
                this.response.text = JSON.stringify(json);
                return;
            }
            const body = await res.text();
            this.response.text = body;
        } catch (err) {
            this.response.error = String(err);
            console.warn("request failed with error", err);
            this.request.fail = true;
            this.request.end = true;
            this.request.events.activate("reqFail");
        }
    }

    /* extra stuff for when its missing something */

    showExtra() {
        this.showingExtra = true;
        vm.extensionManager.refreshBlocks();
    }

    hideExtra() {
        this.showingExtra = false;
        vm.extensionManager.refreshBlocks();
    }

    setUnkownProperty(args) {
        const name = Cast.toString(args.path);
        const text = Cast.toString(args.value);

        const value = castAutomatic(text);
        setAtIn(this.request.options, name, value);
    }

    setUnkownPropertyType(args) {
        const name = Cast.toString(args.path);
        const type = Cast.toString(args.type);

        const oldValue = getAtIn(this.request.options, name);
        const newValue = castDynamic(oldValue, type);
        setAtIn(this.request.options, name, newValue);
    }

    getUnkownProperty(args) {
        const name = Cast.toString(args.path);

        return getAtIn(this.request.options, name);
    }

    getUnkownPropertyType(args) {
        const name = Cast.toString(args.path);
        const value = getAtIn(this.request.options, name);

        return typeof value;
    }
}

Scratch.extensions.register(new WebRequests());