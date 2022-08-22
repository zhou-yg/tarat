import {
  state,
  cache,
  model,
  computed,
  combineLatest,
  inputCompute,
  inputComputeInServer,
  writePrisma,
} from "tarat-core";
import { nanoid } from "nanoid";

export const DEFAULT_AVATAR = "/default-user-icon.jpeg";

export default function login() {
  const avatar = state(DEFAULT_AVATAR);
  const password = state();
  const name = state();

  const enableEdit = state(false);

  const inputAvatar = state();
  const inputName = state();
  const inputPassword = state();
  const repeatPassword = state();

  const userDataByInput = model("user", (prev) => {
    if (name() && password()) {
      return {
        where: {
          name: name(), // maybe be unique?
          password: password(),
        },
        select: {
          id: true,
          name: true,
        },
      };
    }
  });
  const writeUserData = writePrisma(userDataByInput, () => ({
    name: name(),
    password: password(),
    avatar: avatar(),
  }));

  const signAndAutoLogin = state(false);

  const cookieId = cache("userDataKey", { from: "cookie" }); // just run in server because by it depends 'cookie'

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
  const writeSessionStore = writePrisma(sessionStore);

  const userDataByCookie = model("user", (prev) => {
    const ss = sessionStore();
    console.log("[userDataByCookie] ss: ", ss);
    if (ss && ss.length > 0) {
      return {
        where: {
          id: ss[0].userId,
        },
      };
    }
  });
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

  /* 12 */
  const alreadyLogin = computed(() => {
    const ud = userData();
    return !!ud;
  });

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

  const errorTip2 = state("");

  const errorTip = combineLatest([errorTip1, errorTip2]);

  const sign = inputComputeInServer(function* () {
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const r = yield userDataByInput.exist({
      name: inputNameVal,
      password: inputPasswordVal,
    });
    if (!r) {
      yield writeUserData.create();

      if (signAndAutoLogin()) {
        yield login(inputNameVal, inputPasswordVal);
      }
    } else {
      errorTip2(() => "user already exist");
    }
  });

  /* 16 */
  const login = inputComputeInServer(function* () {
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const existUser = yield userDataByInput.exist({
      name: inputNameVal,
      password: inputPasswordVal,
    }); // query DB
    if (existUser) {
      name(() => inputNameVal);
      password(() => inputPasswordVal);

      const nid = nanoid();

      yield writeSessionStore.create({
        userId: existUser.id,
        fromIndex: nid,
      });

      cookieId(() => nid);
    } else {
      errorTip2(() => `invalid password with "${inputNameVal}"`);
    }
  });

  const logout = inputComputeInServer(function* () {
    const cid = cookieId();
    cookieId(() => "");

    name(() => null);
    password(() => null);

    const ss = sessionStore().find((o) => o.fromIndex === cid);
    if (ss) {
      yield writeSessionStore.remove(ss.id);
    }
  });

  const openEdit = inputCompute(() => {
    const ud = userData();
    inputAvatar(() => ud.avatar);
    inputName(() => ud.name);
    inputPassword(() => ud.password);
    enableEdit(() => true);
  });
  const closeEdit = inputCompute(() => {
    inputAvatar(() => "");
    inputName(() => "");
    inputPassword(() => "");
    enableEdit(() => false);
  });

  const updateInfo = inputComputeInServer(function* () {
    // name(() => inputName());
    // password(() => inputPassword());
    // avatar(() => inputAvatar());
    yield writeUserData.update(userData().id, {
      name: inputName(),
      password: inputPassword(),
      avatar: inputAvatar(),
    });
  });

  return {
    alreadyLogin,
    enableEdit,
    openEdit,
    closeEdit,
    name,
    password,
    avatar,
    inputAvatar,
    inputName,
    inputPassword,
    repeatPassword,
    signAndAutoLogin,
    userData,
    errorTip,
    sign,
    login,
    logout,
    updateInfo,
  };
}

/**. auto generated by tarat */
const autoParser = {
  login: {
    names: [
      [0, "avatar"],
      [1, "password"],
      [2, "name"],
      [3, "enableEdit"],
      [4, "inputAvatar"],
      [5, "inputName"],
      [6, "inputPassword"],
      [7, "repeatPassword"],
      [8, "userDataByInput"],
      [9, "writeUserData"],
      [10, "signAndAutoLogin"],
      [11, "cookieId"],
      [12, "sessionStore"],
      [13, "writeSessionStore"],
      [14, "userDataByCookie"],
      [15, "userData"],
      [16, "alreadyLogin"],
      [17, "errorTip1"],
      [18, "errorTip2"],
      [19, "sign"],
      [20, "login2"],
      [21, "logout"],
      [22, "openEdit"],
      [23, "closeEdit"],
      [24, "updateInfo"],
    ],
    deps: [
      ["h", 8, [2, 1]],
      ["h", 9, [8, 2, 1, 0], [8, 2, 1, 0]],
      ["h", 12, [11]],
      ["h", 13, [12], [12]],
      ["h", 14, [12]],
      ["h", 15, [14, 8]],
      ["h", 16, [15]],
      ["h", 17, [2, 1, 15, 7]],
      ["h", 19, [5, 6, 9, 10], [8, 20, 18]],
      ["h", 20, [5, 6], [8, 2, 1, 13, 11, 18]],
      ["h", 21, [11, 12], [11, 2, 1, 13]],
      ["h", 22, [15], [4, 5, 6, 3]],
      ["h", 23, [], [4, 5, 6, 3]],
      ["h", 24, [15, 5, 6, 4], [9]],
    ],
  },
};
Object.assign(login, {
  __deps__: autoParser.login.deps,
  __names__: autoParser.login.names,
  __name__: "login",
});
/** auto generated by tarat .*/
