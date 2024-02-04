"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDEX_RESOURCES = void 0;
const resources_1 = require("../utils/resources");
let Index = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _index_decorators;
    return _a = class Index extends resources_1.JsonResources {
            constructor() {
                super(undefined, {
                    openapi: "3.1.0",
                    info: {
                        title: "bcked API",
                        // TODO Multiline description.
                        description: "Free API for all data on bcked.com",
                        termsOfService: "https://github.com/bcked/bcked-adapters/blob/main/LEGAL_NOTICE.md",
                        contact: {
                            name: "API Support",
                            url: "https://github.com/bcked/bcked-adapters/issues",
                            email: "contact@bcked.com",
                        },
                        license: {
                            name: "GPL-3.0 license",
                            url: "https://github.com/bcked/bcked-adapters/blob/main/LICENSE",
                        },
                        // TODO maybe use the current commit hash here
                        version: "1.0.0",
                    },
                    servers: [
                        {
                            url: "https://api.bcked.com",
                        },
                    ],
                    paths: {},
                    components: {},
                    tags: [],
                });
                __runInitializers(this, _instanceExtraInitializers);
            }
            async index() {
                return {
                    $id: "/",
                    // assets: {
                    //     $ref: `/assets`,
                    // },
                    entities: {
                        $ref: `/entities`,
                    },
                    systems: {
                        $ref: `/systems`,
                    },
                };
            }
        },
        (() => {
            _index_decorators = [resources_1.JsonResources.register({
                    path: "/",
                    summary: "Retrieve a list of all resources",
                    description: "Get a list of all resource references",
                    type: "Resources",
                    // TODO write schema
                    schema: {},
                })];
            __esDecorate(_a, null, _index_decorators, { kind: "method", name: "index", static: false, private: false, access: { has: obj => "index" in obj, get: obj => obj.index } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
exports.INDEX_RESOURCES = new Index();
//# sourceMappingURL=index.js.map