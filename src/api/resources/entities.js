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
exports.ENTITY_RESOURCES = void 0;
const icons_1 = require("../utils/icons");
const resources_1 = require("../utils/resources");
let Entity = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _index_decorators;
    let _entity_decorators;
    let _details_decorators;
    let _icons_decorators;
    let _assets_decorators;
    return _a = class Entity extends resources_1.JsonResources {
            constructor() {
                super({
                    name: "Entities",
                    description: "Everything about entities",
                    externalDocs: {
                        description: "View on bcked.com",
                        url: "https://bcked.com/entities",
                    },
                });
                __runInitializers(this, _instanceExtraInitializers);
            }
            async index(ids) {
                return {
                    $id: "/entities",
                    entities: ids.map((id) => ({
                        $ref: `/entities/${id}`,
                    })),
                };
            }
            async entity(id) {
                return {
                    $id: `/entities/${id}`,
                    details: {
                        $ref: `/entities/${id}/details`,
                    },
                    icons: {
                        $ref: `/entities/${id}/icons`,
                    },
                    assets: {
                        $ref: `/entities/${id}/assets`,
                    },
                };
            }
            async details(id, details) {
                return {
                    $id: `/entities/${id}/details`,
                    name: details.name,
                    identifier: details.identifier,
                    reference: details.reference,
                    tags: details.tags,
                    listed: details.listed,
                    updated: details.updated,
                };
            }
            async icons(id) {
                return (0, icons_1.icons)("entities", id);
            }
            async assets(id, assetIds) {
                return {
                    $id: `/entities/${id}/assets`,
                    assets: assetIds.map((assetId) => ({
                        $ref: `/assets/${assetId}`,
                    })),
                };
            }
        },
        (() => {
            _index_decorators = [resources_1.JsonResources.register({
                    path: "/entities",
                    summary: "Retrieve a list of entities",
                    description: "Get a list of entity IDs and references",
                    type: "Entities",
                    // TODO write schema
                    schema: {},
                })];
            _entity_decorators = [resources_1.JsonResources.register({
                    path: "/entities/{id}",
                    summary: "Get a entity",
                    description: "Get an entity by its ID",
                    type: "Entity",
                    // TODO write schema
                    schema: {},
                })];
            _details_decorators = [resources_1.JsonResources.register({
                    path: "/entities/{id}/details",
                    summary: "Get details of a entity",
                    description: "Get details of a entity by its ID",
                    type: "EntityDetails",
                    // TODO write schema
                    schema: {},
                })];
            _icons_decorators = [resources_1.JsonResources.register({
                    path: "/entities/{id}/icons",
                    summary: "Get icons of a entity",
                    description: "Get icons of a entity by its ID",
                    type: "EntityIcons",
                    // TODO write schema
                    schema: {},
                })];
            _assets_decorators = [resources_1.JsonResources.register({
                    path: "/entities/{id}/assets",
                    summary: "Get assets of a entity",
                    description: "Get assets of a entity by its ID",
                    type: "EntityAssets",
                    // TODO write schema
                    schema: {},
                })];
            __esDecorate(_a, null, _index_decorators, { kind: "method", name: "index", static: false, private: false, access: { has: obj => "index" in obj, get: obj => obj.index } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _entity_decorators, { kind: "method", name: "entity", static: false, private: false, access: { has: obj => "entity" in obj, get: obj => obj.entity } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _details_decorators, { kind: "method", name: "details", static: false, private: false, access: { has: obj => "details" in obj, get: obj => obj.details } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _icons_decorators, { kind: "method", name: "icons", static: false, private: false, access: { has: obj => "icons" in obj, get: obj => obj.icons } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _assets_decorators, { kind: "method", name: "assets", static: false, private: false, access: { has: obj => "assets" in obj, get: obj => obj.assets } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
exports.ENTITY_RESOURCES = new Entity();
//# sourceMappingURL=entities.js.map