import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/main.ts', // 번들링할 진입점
  output: {
    dir: 'dist',
    format: 'cjs', // CommonJS 형식으로 출력 (옵시디언 플러그인이 cjs 형식으로 동작)
    sourcemap: true,
  },
  external: ['obsidian'], // 외부 모듈로 처리할 라이브러리
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
};
