import typescript from "rollup-plugin-typescript2"

export default {
  input: "./src/index.ts",
  output: [{
    format: "cjs",
    file: "./dist/index.cjs",
    externalLiveBindings: false
  }, {
    format: "es",
    file: "./dist/index.js",
    externalLiveBindings: false
  }],
  external: ["@lezer/common", "@lezer/highlight", "@lezer/lr"],
  plugins: [
    typescript({
      check: false,
      tsconfigOverride: {
        compilerOptions: {
          lib: ["es5", "es6"],
          sourceMap: true,
          target: "es6",
          strict: false,
          declaration: true
        }
      },
      include: ["src/*.ts"]
    })
  ]
}
