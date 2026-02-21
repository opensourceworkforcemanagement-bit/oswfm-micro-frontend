const deps = require('./package.json').dependencies;

export const mfConfig = {
  name: "timesheetmanagement",
  filename: "remoteEntry.js",
  remotes: {
    SharedLibrary: "SharedLibrary@http://localhost:3006/remoteEntry.js",
  },
  dts: { consumeTypes: false },
  exposes: {
    "./App": "./src/App",
    "./WorkCodeManagement": "./src/pages/WorkCodeManagement",
    "./TimesheetManagement": "./src/pages/TimesheetManagement",
    "./PayPeriodManagement": "./src/pages/PayPeriodManagement",
  },
  shared: {
    react: { singleton: true, requiredVersion: deps.react, eager: false },
    'react-dom': { singleton: true, requiredVersion: deps['react-dom'], eager: false },
    'react/jsx-runtime': { singleton: true, requiredVersion: deps.react, eager: false },
    'react/jsx-dev-runtime': { singleton: true, requiredVersion: deps.react, eager: false },
  },
};
