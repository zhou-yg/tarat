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

  const signAndAutoLogin = state(true);

  const userDataByInput = model("user", (prev) => {}, {
    immediate: false,
  });
  const writeUserData = writePrisma(userDataByInput, () => ({
    name: inputName(),
    password: inputPassword(),
    avatar: inputAvatar(),
  }));

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
  const userData = computed(() => {
    const u1 = userDataByCookie();
    if (u1?.length > 0) {
      return u1[0];
    }
  });

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
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const repeatPasswordVal = repeatPassword();

    if (repeatPasswordVal && repeatPasswordVal !== inputPasswordVal) {
      return "twice inputting passwords don't match";
    }
    if (inputNameVal === "") {
      return '"username" is required';
    }
    if (inputPasswordVal === "") {
      return '"password" is required';
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
        yield login();
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
      errorTip2(() => `invalid password with name "${inputNameVal}"`);
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
    closeEdit();
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

