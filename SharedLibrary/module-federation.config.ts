export const mfConfig = {
  name: "SharedLibrary",
  filename: "remoteEntry.js",
  exposes: {
    "./ErrorDialog": "./src/components/ErrorDialog",
    "./services": "./src/services/index.ts",
  },
  dts: {
    generateTypes: { compileInChildProcess: true },
    consumeTypes: false,
  },
  shared: {
    react: { singleton: true, requiredVersion: "^18.3.1", eager: false },
    'react-dom': { singleton: true, requiredVersion: "^18.3.1", eager: false },
    'react/jsx-runtime': { singleton: true, requiredVersion: "^18.3.1", eager: false },
    'react/jsx-dev-runtime': { singleton: true, requiredVersion: "^18.3.1", eager: false },
  },
};
