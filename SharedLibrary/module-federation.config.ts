export const mfConfig = {
  name: "SharedLibrary",
  exposes: {
    "./ErrorDialog": "./src/components/ErrorDialog"
  },
  shared: ["react", "react-dom"],
};
