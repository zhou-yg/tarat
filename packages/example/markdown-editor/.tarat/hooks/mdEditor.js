var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var mdEditor_exports = {};
__export(mdEditor_exports, {
  default: () => mdEditor
});
module.exports = __toCommonJS(mdEditor_exports);
var import_tarat_core = require("tarat-core");
var import_mdEditor_deps = __toESM(require("./mdEditor.deps.js"));
Object.assign(mdEditor, {
  __deps__: import_mdEditor_deps.default.mdEditor
});
function mdEditor(q = {}) {
  const currentId = (0, import_tarat_core.state)(q.id);
  const inputMD = (0, import_tarat_core.state)("");
  const posts = (0, import_tarat_core.model)("markdown", () => {
    const cid = currentId();
    if (cid) {
      return {
        where: {
          id: cid
        }
      };
    }
  });
  const postedMD = (0, import_tarat_core.computed)(() => {
    var _a;
    return (_a = posts()[0]) == null ? void 0 : _a.content;
  });
  const displayMD = (0, import_tarat_core.combineLatest)([inputMD, postedMD]);
  const save = (0, import_tarat_core.inputComputeInServer)(() => __async(this, null, function* () {
    const cid = currentId();
    if (cid) {
      if (posts()[0]) {
        posts((arr) => {
          arr[0].content = inputMD();
        });
      }
    } else {
      const r = yield posts.create({
        content: inputMD()
      });
      currentId(() => r.id);
    }
  }));
  (0, import_tarat_core.after)(() => {
  }, [posts]);
  return {
    displayMD,
    postedMD,
    inputMD,
    save
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
