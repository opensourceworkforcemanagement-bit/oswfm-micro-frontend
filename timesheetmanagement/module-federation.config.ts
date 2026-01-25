const deps = require('./package.json').dependencies;

export const mfConfig = {
  name: "timesheetmanagement",
  filename: "remoteEntry.js",
  exposes: {
    "./App": "./src/App",
    "./WorkCodeManagement": "./src/pages/WorkCodeManagement",
    "./TimesheetManagement": "./src/pages/TimesheetManagement",
  },
  shared: {
    react: { singleton: true, requiredVersion: deps.react, eager: true },
    'react-dom': { singleton: true, requiredVersion: deps['react-dom'], eager: true },
  },
};
