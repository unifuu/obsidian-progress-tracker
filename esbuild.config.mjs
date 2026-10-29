import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["plugin-entry.js"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  outfile: "main.js",
});