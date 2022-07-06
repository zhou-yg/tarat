'use strict';

var React = require('react');
require('tarat-connect');
var taratCore = require('tarat-core');
var nanoid = require('nanoid');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var nanoid__default = /*#__PURE__*/_interopDefaultLegacy(nanoid);

var loginDeps = {
  login: [["h", 7, [0, 1]], ["h", 8, [6]], ["h", 9, [8]], ["h", 10, [9]], ["h", 11, [10, 7]], ["h", 12, [11]], ["h", 13, [0, 1, 11, 4]], ["h", 15, [2, 3, 5], [7, 16, 14]], ["h", 16, [2, 3], [7, 0, 1, 8, 6, 14]], ["h", 17, [6], [0, 1, 6, 8]]]
};

Object.assign(login, {
  __deps__: loginDeps.login
});
function login() {
  const name = taratCore.state();
  name._hook && (name._hook.name = 'name');
  const password = taratCore.state();
  password._hook && (password._hook.name = 'password');
  const inputName = taratCore.state();
  inputName._hook && (inputName._hook.name = 'inputName');
  const inputPassword = taratCore.state();
  inputPassword._hook && (inputPassword._hook.name = 'inputPassword');
  const repeatPassword = taratCore.state();
  repeatPassword._hook && (repeatPassword._hook.name = 'repeatPassword');
  const signAndAutoLogin = taratCore.state(false);
  signAndAutoLogin._hook && (signAndAutoLogin._hook.name = 'signAndAutoLogin');
  /* 6 */

  const cookieId = taratCore.cache('userDataKey', {
    from: 'cookie'
  }); // just run in server because by it depends 'cookie'

  cookieId._hook && (cookieId._hook.name = 'cookieId');
  /* 7 */

  const userDataByInput = taratCore.model('user', prev => {
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
  userDataByInput._hook && (userDataByInput._hook.name = 'userDataByInput');
  const sessionStore = taratCore.model('sessionStore', prev => {
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
  sessionStore._hook && (sessionStore._hook.name = 'sessionStore');
  /* 9 */

  const userIdInSession = taratCore.computed(() => {
    const ss = sessionStore();
    console.log('ss: ', ss);

    if (ss && ss.length > 0) {
      return {
        name: ss[0].name,
        password: ss[0].password
      };
    }
  });
  userIdInSession._hook && (userIdInSession._hook.name = 'userIdInSession');
  const userDataByCookie = taratCore.model('user', prev => {
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
  userDataByCookie._hook && (userDataByCookie._hook.name = 'userDataByCookie');
  /* 11 */

  const userData = taratCore.computed(() => {
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
  userData._hook && (userData._hook.name = 'userData');
  /* 12 */

  const alreadyLogin = taratCore.computed(() => {
    const ud = userData();
    console.log('userData: ', ud);
    return !!ud;
  });
  alreadyLogin._hook && (alreadyLogin._hook.name = 'alreadyLogin');
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

  const errorTip1 = taratCore.computed(async () => {
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
  errorTip1._hook && (errorTip1._hook.name = 'errorTip1');
  const errorTip2 = taratCore.state('');
  errorTip2._hook && (errorTip2._hook.name = 'errorTip2');
  const errorTip = taratCore.combineLatest([errorTip1, errorTip2]);
  const sign = taratCore.inputComputeInServer(async () => {
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
  sign._hook && (sign._hook.name = 'sign');
  /* 16 */

  const login = taratCore.inputComputeInServer(async () => {
    const inputNameVal = inputName();
    const inputPasswordVal = inputPassword();
    const valid = await userDataByInput.exist({
      name: inputNameVal,
      password: inputPasswordVal
    }); // query DB

    if (valid) {
      name(() => inputNameVal);
      password(() => inputPasswordVal);
      const nid = nanoid__default["default"]();
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
  login._hook && (login._hook.name = 'login');
  const logout = taratCore.inputComputeInServer(() => {
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
  logout._hook && (logout._hook.name = 'logout');
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

var classnames = {exports: {}};

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
})(classnames);

var entry_server = (doc => {
  return /*#__PURE__*/React__default["default"].createElement("div", {
    id: "server-side-render"
  }, doc);
});

module.exports = entry_server;
