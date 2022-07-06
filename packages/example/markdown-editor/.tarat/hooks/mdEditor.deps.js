var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var mdEditor_deps_exports = {};
__export(mdEditor_deps_exports, {
  default: () => mdEditor_deps_default
});
module.exports = __toCommonJS(mdEditor_deps_exports);
var mdEditor_deps_default = {
  mdEditor: [
    ["h", 2, [0]],
    ["h", 3, [2]],
    ["h", 4, [0, 2, 1], [2, 0]]
  ]
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
