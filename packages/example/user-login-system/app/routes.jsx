import React from "react";
import { Routes, Route } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server.js";

import Index from "/Users/yunge/Documents/tarat/packages/example/user-login-system/app/pages/index.jsx";
import UserIndex from "/Users/yunge/Documents/tarat/packages/example/user-login-system/app/pages/user/index.jsx";
import UserSetting from "/Users/yunge/Documents/tarat/packages/example/user-login-system/app/pages/user/setting.jsx";

export default function App({ location }) {
  return (
    <StaticRouter>
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="index" element={<Index />}></Route>
        <Route path="user" element={<UserIndex />}>
          <Route path="index" element={<UserIndex />}></Route>
          <Route path="setting" element={<UserSetting />}></Route>
        </Route>
      </Routes>
    </StaticRouter>
  );
}
