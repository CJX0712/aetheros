// stylelint.config.mjs
// 只启两条自建/内置规则，避免引入未经版本核实的第三方 config 包。
//   aos/token-layer            —— 组件层直引 primitive token 即失败
//   custom-property-pattern    —— 自定义属性必须带 --aos- 前缀
export default {
  plugins: ['./stylelint/plugins/aos-token-layer.mjs'],
  rules: {
    'aos/token-layer': true,
    'custom-property-pattern': '^aos-[a-z0-9]+(-[a-z0-9]+)*$',
  },
  ignoreFiles: ['**/dist/**', '**/node_modules/**'],
};
