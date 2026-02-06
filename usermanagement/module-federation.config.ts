const deps = require('./package.json').dependencies;

export const mfConfig = {
  name: "usermanagement",
  filename: "remoteEntry.js",
  exposes: {
    "./App": "./src/App",
    "./UserManagement": "./src/pages/UserManagement",
    "./EmployeeManagement": "./src/pages/EmployeeManagement",
  },
  shared: {
    react: { singleton: true, requiredVersion: deps.react, eager: true },
    'react-dom': { singleton: true, requiredVersion: deps['react-dom'], eager: true },
    'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'], eager: true },
  },
};
