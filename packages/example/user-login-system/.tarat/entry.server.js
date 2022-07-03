import React from 'react';
import { useTarat } from 'tarat-connect';
import { state, cache, model, computed, combineLatest, inputComputeInServer } from 'tarat-core';
import { randomFillSync } from 'crypto';

const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

const POOL_SIZE_MULTIPLIER = 128;
let pool, poolOffset;

let fillPool = bytes => {
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
    randomFillSync(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    randomFillSync(pool);
    poolOffset = 0;
  }

  poolOffset += bytes;
};
let nanoid = (size = 21) => {
  fillPool(size -= 0);
  let id = '';

  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += urlAlphabet[pool[i] & 63];
  }

  return id;
};

function login() {
  const name = state();
  name._hook.name = 'name';
  const password = state();
  password._hook.name = 'password';
  const inputName = state();
  inputName._hook.name = 'inputName';
  const inputPassword = state();
  inputPassword._hook.name = 'inputPassword';
  const repeatPassword = state();
  repeatPassword._hook.name = 'repeatPassword';
  const signAndAutoLogin = state(false);
  signAndAutoLogin._hook.name = 'signAndAutoLogin';
  /* 6 */

  const cookieId = cache('userDataKey', {
    from: 'cookie'
  }); // just run in server because by it depends 'cookie'

  cookieId._hook.name = 'cookieId';
  const userDataByInput = model('user', prev => {
    if (name() && password()) {
      return {
        where: {
          name: name(),
          // maybe be unique?
          password: password()
        }
      };
    }
  });
  userDataByInput._hook.name = 'userDataByInput';
  const sessionStore = model('sessionStore', () => {
    const cid = cookieId(); // client: ps, server: no?

    if (cid) {
      return {
        where: {
          fromIndex: cid
        }
      };
    }
  }, {
    ignoreClientEnable: true
  });
  sessionStore._hook.name = 'sessionStore';
  /* 9 */

  const userIdInSession = computed(() => {
    const ss = sessionStore();
    console.log('ss: ', ss);

    if (ss && ss.length > 0) {
      return {
        name: ss[0].name,
        password: ss[0].password
      };
    }
  });
  userIdInSession._hook.name = 'userIdInSession';
  const userDataByCookie = model('user', prev => {
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
  userDataByCookie._hook.name = 'userDataByCookie';
  const userData = computed(() => {
    const u1 = userDataByCookie();
    console.log('u1: ', u1);

    if (u1?.length > 0) {
      return u1[0];
    }

    const u2 = userDataByInput();
    console.log('u2: ', u2);

    if (u2?.length > 0) {
      return u2[0];
    }
  });
  userData._hook.name = 'userData';
  const alreadyLogin = computed(() => {
    const ud = userData();
    console.log('userData: ', ud);
    return !!ud;
  });
  alreadyLogin._hook.name = 'alreadyLogin';
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
      return 'invalid password';
    }

    if (repeatPassword() && repeatPassword() !== password()) {
      return 'input same password twice';
    }

    if (name() === '') {
      return 'must input name';
    }

    if (password() === '') {
      return 'must input password';
    }

    return '';
  });
  errorTip1._hook.name = 'errorTip1';
  const errorTip2 = state('');
  errorTip2._hook.name = 'errorTip2';
  const errorTip = combineLatest([errorTip1, errorTip2]);
  const sign = inputComputeInServer(async () => {
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const r = await userDataByInput.exist({
      name: inputNameVal,
      password: inputPasswordVal
    });

    if (!r) {
      userDataByInput(draft => {
        draft.push({
          name: inputNameVal,
          password: inputPasswordVal
        });
      });

      if (signAndAutoLogin()) {
        login(inputNameVal, inputPasswordVal);
      }
    } else {
      errorTip2(() => 'user already exist');
    }
  });
  sign._hook.name = 'sign';
  const login = inputComputeInServer(async () => {
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const valid = await userDataByInput.exist({
      name: inputNameVal,
      password: inputPasswordVal
    }); // query DB

    if (valid) {
      name(() => inputNameVal);
      password(() => inputPasswordVal);
      const nid = nanoid();
      sessionStore(draft => {
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
  });
  login._hook.name = 'login';
  const logout = inputComputeInServer(() => {
    name(() => null);
    password(() => null);
    const cid = cookieId();
    console.log('logout cid: ', cid);
    cookieId(() => '');
    sessionStore(arr => {
      console.log('[userIdInSession] arr: ', arr);
      const i = arr.findIndex(o => o.fromIndex === cid);
      console.log('[userIdInSession] logout i: ', i);

      if (i >= 0) {
        arr.splice(i, 1);
      }
    });
  });
  logout._hook.name = 'logout';
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
    logout
  };
}

var s = ".login {\n  border: 1px solid #eee;\n  width: 600px;\n  padding: 20px;\n}\n.title {\n  font-size: 20px;\n  text-align: center;\n}\n.row {\n  padding: 10px 40px;\n}\n.row > input {\n  box-sizing: border-box;\n  border-radius: 4px;\n  padding: 10px;\n  width: 100%;\n  outline: 0;\n  border: 1px solid #999;\n  font-size: 18px;\n}\n.footer {\n  padding: 10px 40px;\n  display: flex;\n  justify-content: space-between;\n}\n.footer > div {\n  display: flex;\n  align-items: center;\n}\n.footer input {\n  width: 20px;\n  height: 20px;\n}\n.footer button {\n  padding: 4px;\n  margin: 0 10px;\n  font-size: 20px;\n}\n";

var classnames$1 = {exports: {}};

/*!
  Copyright (c) 2018 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/

(function (module) {
  /* global define */
  (function () {

    var hasOwn = {}.hasOwnProperty;

    function classNames() {
      var classes = [];

      for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (!arg) continue;
        var argType = typeof arg;

        if (argType === 'string' || argType === 'number') {
          classes.push(arg);
        } else if (Array.isArray(arg)) {
          if (arg.length) {
            var inner = classNames.apply(null, arg);

            if (inner) {
              classes.push(inner);
            }
          }
        } else if (argType === 'object') {
          if (arg.toString === Object.prototype.toString) {
            for (var key in arg) {
              if (hasOwn.call(arg, key) && arg[key]) {
                classes.push(key);
              }
            }
          } else {
            classes.push(arg.toString());
          }
        }
      }

      return classes.join(' ');
    }

    if (module.exports) {
      classNames.default = classNames;
      module.exports = classNames;
    } else {
      window.classNames = classNames;
    }
  })();
})(classnames$1);

var classnames = classnames$1.exports;

const LoginFrame = () => {
  const loginHook = useTarat(login);
  const cls = classnames(s.row, {
    show: !!loginHook?.errorTip()
  });
  const alreadyLogin = loginHook.alreadyLogin();
  return /*#__PURE__*/React.createElement("div", {
    className: s.login
  }, /*#__PURE__*/React.createElement("div", {
    className: s.title
  }, "Welcome"), alreadyLogin ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: s.row
  }, "\u8D26\u53F7\uFF1A", loginHook.userData().name), /*#__PURE__*/React.createElement("div", {
    className: s.row
  }, "\u5BC6\u7801\uFF1A", loginHook.userData().password), /*#__PURE__*/React.createElement("div", {
    className: s.footer
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => loginHook.logout()
  }, "Logout")), /*#__PURE__*/React.createElement("div", null))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: s.row
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "username",
    onInput: e => {
      loginHook.inputName(() => e.target.value);
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: s.row
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "password",
    onInput: e => {
      loginHook.inputPassword(() => e.target.value);
    }
  })), loginHook?.errorTip() ? /*#__PURE__*/React.createElement("div", {
    className: cls
  }, loginHook?.errorTip()) : '', /*#__PURE__*/React.createElement("div", {
    className: s.footer
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => loginHook.sign()
  }, "Sign"), "sign and auto login ", /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: loginHook.signAndAutoLogin(),
    onChange: e => {
      loginHook.signAndAutoLogin(() => e.target.checked);
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => loginHook.login()
  }, "Login")))), /*#__PURE__*/React.createElement("pre", null, /*#__PURE__*/React.createElement("code", null, "alreadyLogin(): ", String(loginHook.alreadyLogin()), " ", /*#__PURE__*/React.createElement("br", null), "signAndAutoLogin(): ", String(loginHook.signAndAutoLogin()), " ", /*#__PURE__*/React.createElement("br", null), "errorTip: ", String(loginHook.errorTip()), " ", /*#__PURE__*/React.createElement("br", null))));
};

var Index = (() => {
  return /*#__PURE__*/React.createElement(LoginFrame, null);
});

var entry_server = ((pageName, dc) => {
  return pageName === 'index' ? /*#__PURE__*/React.createElement(Index, null) : '';
});

export { entry_server as default };
