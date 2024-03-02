"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceProxy = void 0;
class InstanceProxy {
    constructor(classes) {
        this.classes = classes;
        this._instances = {};
    }
    get instances() {
        return Object.keys(this.classes).map((name) => this.getInstance(name));
    }
    getInstance(selector) {
        const ProxyClass = this.classes[selector];
        if (!ProxyClass) {
            throw new Error(`No proxy implementation for: ${selector}.`);
        }
        if (ProxyClass.name in this._instances)
            return this._instances[ProxyClass.name];
        const instance = new ProxyClass();
        this._instances[ProxyClass.name] = instance;
        return instance;
    }
}
exports.InstanceProxy = InstanceProxy;
//# sourceMappingURL=instance_proxy.js.map