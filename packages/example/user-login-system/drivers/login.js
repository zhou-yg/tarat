import {
  state,
  cache,
  model,
  computed,
  combineLatest,
  inputCompute,
  inputComputeInServer,
} from "tarat-core";
import { nanoid } from "nanoid";

export default function login() {
  const password = state();
  password._hook && (password._hook.name = "password");

  const name = state();
  name._hook && (name._hook.name = "name");

  const inputName = state();
  inputName._hook && (inputName._hook.name = "inputName");
  const inputPassword = state();
  inputPassword._hook && (inputPassword._hook.name = "inputPassword");
  const repeatPassword = state();
  repeatPassword._hook && (repeatPassword._hook.name = "repeatPassword");

  const signAndAutoLogin = state(false);
  signAndAutoLogin._hook && (signAndAutoLogin._hook.name = "signAndAutoLogin");

  /* 6 */
  const cookieId = cache("userDataKey", { from: "cookie" }); // just run in server because by it depends 'cookie'
  cookieId._hook && (cookieId._hook.name = "cookieId");
  /* 7 */
  const userDataByInput = model("user", (prev) => {
    if (name() && password()) {
      return {
        where: {
          name: name(), // maybe be unique?
          password: password(),
        },
      };
    }
  });
  userDataByInput._hook && (userDataByInput._hook.name = "userDataByInput");

  const sessionStore = model(
    "sessionStore",
    (prev) => {
      const cid = cookieId();
      // client: ps, server: no?
      if (cid) {
        return {
          where: {
            fromIndex: cid,
          },
        };
      }
    },
    { ignoreClientEnable: true }
  );
  sessionStore._hook && (sessionStore._hook.name = "sessionStore");

  /* 9 */
  const userIdInSession = computed(() => {
    const ss = sessionStore();
    if (ss && ss.length > 0) {
      return {
        name: ss[0].name,
        password: ss[0].password,
      };
    }
  });
  userIdInSession._hook && (userIdInSession._hook.name = "userIdInSession");

  const userDataByCookie = model("user", (prev) => {
    const u = userIdInSession();
    if (u) {
      return {
        where: {
          name: u.name,
          password: u.password,
        },
      };
    }
  });
  userDataByCookie._hook && (userDataByCookie._hook.name = "userDataByCookie");

  /* 11 */
  const userData = computed(() => {
    const u1 = userDataByCookie();
    if (u1?.length > 0) {
      return u1[0];
    }
    const u2 = userDataByInput();
    if (u2?.length > 0) {
      return u2[0];
    }
  });
  userData._hook && (userData._hook.name = "userData");

  /* 12 */
  const alreadyLogin = computed(() => {
    const ud = userData();
    return !!ud;
  });
  alreadyLogin._hook && (alreadyLogin._hook.name = "alreadyLogin");

  /**
   * login:
   * 1.invalid password
   * 2.check repeat password (should handled by UI)
   * 3.user not exist
   *
   * sign:
   * 1.user already exist
   *
   * common:
   * 1.http error
   */
  const errorTip1 = computed(async () => {
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
  });
  errorTip1._hook && (errorTip1._hook.name = "errorTip1");

  const errorTip2 = state("");
  errorTip2._hook && (errorTip2._hook.name = "errorTip2");

  const errorTip = combineLatest([errorTip1, errorTip2]);

  const sign = inputComputeInServer(async () => {
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const r = await userDataByInput.exist({
      name: inputNameVal,
      password: inputPasswordVal,
    });
    if (!r) {
      userDataByInput((draft) => {
        draft.push({
          name: inputNameVal,
          password: inputPasswordVal,
        });
      });
      if (signAndAutoLogin()) {
        login(inputNameVal, inputPasswordVal);
      }
    } else {
      errorTip2(() => "user already exist");
    }
  });
  sign._hook && (sign._hook.name = "sign");

  /* 16 */
  const login = inputComputeInServer(async () => {
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const valid = await userDataByInput.exist({
      name: inputNameVal,
      password: inputPasswordVal,
    }); // query DB
    if (valid) {
      name(() => inputNameVal);
      password(() => inputPasswordVal);

      const nid = nanoid();

      sessionStore((draft) => {
        draft.push({
          name: inputNameVal,
          password: inputPasswordVal,
          fromIndex: nid,
        });
      });

      cookieId(() => nid);
    } else {
      errorTip2(() => `invalid password with "${inputNameVal}"`);
    }
  });
  login._hook && (login._hook.name = "login");

  const logout = inputComputeInServer(() => {
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
    login,
    logout,
  };
}

/**. auto generated by tarat */
const autoParser = {
  login: {
    names: [
      [0, "password"],
      [1, "name"],
      [2, "inputName"],
      [3, "inputPassword"],
      [4, "repeatPassword"],
      [5, "signAndAutoLogin"],
      [6, "cookieId"],
      [7, "userDataByInput"],
      [8, "sessionStore"],
      [9, "userIdInSession"],
      [10, "userDataByCookie"],
      [11, "userData"],
      [12, "alreadyLogin"],
      [13, "errorTip1"],
      [14, "errorTip2"],
      [15, "sign"],
      [16, "login2"],
      [17, "logout"],
    ],
    deps: [
      ["h", 7, [1, 0]],
      ["h", 8, [6]],
      ["h", 9, [8]],
      ["h", 10, [9]],
      ["h", 11, [10, 7]],
      ["h", 12, [11]],
      ["h", 13, [1, 0, 11, 4]],
      ["h", 15, [2, 3, 5], [7, 16, 14]],
      ["h", 16, [2, 3], [7, 1, 0, 8, 6, 14]],
      ["h", 17, [6], [1, 0, 6, 8]],
    ],
  },
};
Object.assign(login, {
  __deps__: autoParser.login.deps,
  __names__: autoParser.login.names,
  __name__: "login",
});
/** auto generated by tarat .*/
