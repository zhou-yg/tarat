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
var login_exports = {};
__export(login_exports, {
  default: () => login
});
module.exports = __toCommonJS(login_exports);
var import_tarat_core = require("tarat-core");
var import_login_deps = __toESM(require("./login.deps.js"));
var import_nanoid = __toESM(require("nanoid"));
Object.assign(login, {
  __deps__: import_login_deps.default.login
});
function login() {
  const name = (0, import_tarat_core.state)();
  name._hook && (name._hook.name = "name");
  const password = (0, import_tarat_core.state)();
  password._hook && (password._hook.name = "password");
  const inputName = (0, import_tarat_core.state)();
  inputName._hook && (inputName._hook.name = "inputName");
  const inputPassword = (0, import_tarat_core.state)();
  inputPassword._hook && (inputPassword._hook.name = "inputPassword");
  const repeatPassword = (0, import_tarat_core.state)();
  repeatPassword._hook && (repeatPassword._hook.name = "repeatPassword");
  const signAndAutoLogin = (0, import_tarat_core.state)(false);
  signAndAutoLogin._hook && (signAndAutoLogin._hook.name = "signAndAutoLogin");
  const cookieId = (0, import_tarat_core.cache)("userDataKey", { from: "cookie" });
  cookieId._hook && (cookieId._hook.name = "cookieId");
  const userDataByInput = (0, import_tarat_core.model)("user", (prev) => {
    if (name() && password()) {
      return {
        where: {
          name: name(),
          password: password()
        }
      };
    }
  });
  userDataByInput._hook && (userDataByInput._hook.name = "userDataByInput");
  const sessionStore = (0, import_tarat_core.model)("sessionStore", (prev) => {
    const cid = cookieId();
    if (cid) {
      return {
        where: {
          fromIndex: cid
        }
      };
    }
  }, { ignoreClientEnable: true });
  sessionStore._hook && (sessionStore._hook.name = "sessionStore");
  const userIdInSession = (0, import_tarat_core.computed)(() => {
    const ss = sessionStore();
    console.log("ss: ", ss);
    if (ss && ss.length > 0) {
      return {
        name: ss[0].name,
        password: ss[0].password
      };
    }
  });
  userIdInSession._hook && (userIdInSession._hook.name = "userIdInSession");
  const userDataByCookie = (0, import_tarat_core.model)("user", (prev) => {
    const u = userIdInSession();
    if (u) {
      return {
        where: {
          name: u.name,
          password: u.password
        }
      };
    }
  });
  userDataByCookie._hook && (userDataByCookie._hook.name = "userDataByCookie");
  const userData = (0, import_tarat_core.computed)(() => {
    const u1 = userDataByCookie();
    console.log("u1: ", u1);
    if ((u1 == null ? void 0 : u1.length) > 0) {
      return u1[0];
    }
    const u2 = userDataByInput();
    console.log("u2: ", u2);
    if ((u2 == null ? void 0 : u2.length) > 0) {
      return u2[0];
    }
  });
  userData._hook && (userData._hook.name = "userData");
  const alreadyLogin = (0, import_tarat_core.computed)(() => {
    const ud = userData();
    console.log("userData: ", ud);
    return !!ud;
  });
  alreadyLogin._hook && (alreadyLogin._hook.name = "alreadyLogin");
  const errorTip1 = (0, import_tarat_core.computed)(() => __async(this, null, function* () {
    if (name() && password() && !userData()) {
      return "invalid password";
    }
    if (repeatPassword() && repeatPassword() !== password()) {
      return "input same password twice";
    }
    if (name() === "") {
      return "must input name";
    }
    if (password() === "") {
      return "must input password";
    }
    return "";
  }));
  errorTip1._hook && (errorTip1._hook.name = "errorTip1");
  const errorTip2 = (0, import_tarat_core.state)("");
  errorTip2._hook && (errorTip2._hook.name = "errorTip2");
  const errorTip = (0, import_tarat_core.combineLatest)([errorTip1, errorTip2]);
  const sign = (0, import_tarat_core.inputComputeInServer)(() => __async(this, null, function* () {
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const r = yield userDataByInput.exist({ name: inputNameVal, password: inputPasswordVal });
    if (!r) {
      userDataByInput((draft) => {
        draft.push({
          name: inputNameVal,
          password: inputPasswordVal
        });
      });
      if (signAndAutoLogin()) {
        login2(inputNameVal, inputPasswordVal);
      }
    } else {
      errorTip2(() => "user already exist");
    }
  }));
  sign._hook && (sign._hook.name = "sign");
  const login2 = (0, import_tarat_core.inputComputeInServer)(() => __async(this, null, function* () {
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const valid = yield userDataByInput.exist({ name: inputNameVal, password: inputPasswordVal });
    if (valid) {
      name(() => inputNameVal);
      password(() => inputPasswordVal);
      const nid = (0, import_nanoid.default)();
      sessionStore((draft) => {
        draft.push({
          name: inputNameVal,
          password: inputPasswordVal,
          fromIndex: nid
        });
      });
      cookieId(() => nid);
    } else {
      errorTip2(() => `invalid password with "${inputNameVal}"`);
    }
  }));
  login2._hook && (login2._hook.name = "login");
  const logout = (0, import_tarat_core.inputComputeInServer)(() => {
    name(() => null);
    password(() => null);
    const cid = cookieId();
    console.log("logout cid: ", cid);
    cookieId(() => "");
    sessionStore((arr) => {
      console.log("[userIdInSession] arr: ", arr);
      const i = arr.findIndex((o) => o.fromIndex === cid);
      console.log("[userIdInSession] logout i: ", i);
      if (i >= 0) {
        arr.splice(i, 1);
      }
    });
  });
  logout._hook && (logout._hook.name = "logout");
  return {
    alreadyLogin,
    name,
    password,
    inputName,
    inputPassword,
    repeatPassword,
    signAndAutoLogin,
    userData,
    errorTip,
    sign,
    login: login2,
    logout
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
