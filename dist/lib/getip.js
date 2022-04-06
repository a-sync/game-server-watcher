"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
async function getIP(hostname) {
    let obj = await dns_1.default.promises.lookup(hostname)
        .catch((e) => {
        console.error('getIP', e.message || e);
    });
    return obj === null || obj === void 0 ? void 0 : obj.address;
}
exports.default = getIP;
