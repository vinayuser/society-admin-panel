import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="AuthLayout h-100 w-100">
      <div className="outerBackgroundDiv">
        <div className="Background">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
