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
exports.SYSTEM_RESOURCES = void 0;
const icons_1 = require("../utils/icons");
const resources_1 = require("../utils/resources");
let System = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _index_decorators;
    let _system_decorators;
    let _details_decorators;
    let _icons_decorators;
    return _a = class System extends resources_1.JsonResources {
            constructor() {
                super({
                    name: "Systems",
                    description: "Everything about systems",
                    externalDocs: {
                        description: "View on bcked.com",
                        url: "https://bcked.com/systems",
                    },
                });
                __runInitializers(this, _instanceExtraInitializers);
            }
            async index(ids) {
                return {
                    $id: "/systems",
                    systems: ids.map((id) => ({
                        $ref: `/systems/${id}`,
                    })),
                };
            }
            async system(id) {
                return {
                    $id: `/systems/${id}`,
                    details: {
                        $ref: `/systems/${id}/details`,
                    },
                    icons: {
                        $ref: `/systems/${id}/icons`,
                    },
                };
            }
            async details(id, details) {
                return {
                    $id: `/systems/${id}/details`,
                    name: details?.name,
                    // TODO reference to asset
                    native: details?.native,
                    explorer: details?.explorer,
                    listed: details?.listed,
                    updated: details?.updated,
                };
            }
            async icons(id) {
                return (0, icons_1.icons)("systems", id);
            }
        },
        (() => {
            _index_decorators = [resources_1.JsonResources.register({
                    path: "/systems",
                    summary: "Retrieve a list of systems",
                    description: "Get a list of system IDs and references",
                    type: "Systems",
                    // TODO write schema
                    schema: {},
                })];
            _system_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}",
                    summary: "Get a system",
                    description: "Get an system by its ID",
                    type: "System",
                    // TODO write schema
                    schema: {},
                })];
            _details_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/details",
                    summary: "Get details of a system",
                    description: "Get details of a system by its ID",
                    type: "SystemDetails",
                    // TODO write schema
                    schema: {},
                })];
            _icons_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/icons",
                    summary: "Get icons of a system",
                    description: "Get icons of a system by its ID",
                    type: "SystemIcons",
                    // TODO write schema
                    schema: {},
                })];
            __esDecorate(_a, null, _index_decorators, { kind: "method", name: "index", static: false, private: false, access: { has: obj => "index" in obj, get: obj => obj.index } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _system_decorators, { kind: "method", name: "system", static: false, private: false, access: { has: obj => "system" in obj, get: obj => obj.system } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _details_decorators, { kind: "method", name: "details", static: false, private: false, access: { has: obj => "details" in obj, get: obj => obj.details } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _icons_decorators, { kind: "method", name: "icons", static: false, private: false, access: { has: obj => "icons" in obj, get: obj => obj.icons } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
exports.SYSTEM_RESOURCES = new System();
//# sourceMappingURL=systems.js.map