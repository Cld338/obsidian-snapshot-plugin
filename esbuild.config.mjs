import esbuild from "esbuild";

const isProd = process.argv[2] === "production";

const options = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  minify: isProd,
  sourcemap: !isProd,
  target: "es6",
  platform: "browser",
  outdir: "dist",
  external: ["obsidian"], // obsidian을 외부 모듈로 지정
};

if (isProd) {
  // 프로덕션 빌드
  esbuild.build(options).catch(() => process.exit(1));
} else {
  // 개발 모드: watch 모드 사용
  esbuild.context(options).then(ctx => {
    ctx.watch(); // 파일이 변경될 때마다 다시 빌드
  }).catch(() => process.exit(1));
}
