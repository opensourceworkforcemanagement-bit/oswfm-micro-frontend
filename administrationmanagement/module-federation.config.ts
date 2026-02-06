const deps = require('./package.json').dependencies;

export const mfConfig = {
  name: "administrationmanagement",
  filename: "remoteEntry.js",
  exposes: {
    "./administrationmanagement": "./src/pages/AbacPermissionManagement",
  },
  shared: {
    react: { singleton: true, requiredVersion: deps.react, eager: true },
    'react-dom': { singleton: true, requiredVersion: deps['react-dom'], eager: true },
    'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'], eager: true },
  },
};
