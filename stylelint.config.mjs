// stylelint.config.mjs
// 只启用内置规则，避免引入未经版本核实的第三方 config 包与脆弱的自定义插件。
//   custom-property-pattern —— 自定义属性必须带 --aos- 前缀
//
// 注：组件层直引 primitive token 的分层纪律（自建规则 aos/token-layer）在「尚无独立
// .css 文件、且本仓库样式全部内联于 packages/demo/index.html（已由 check-policy 管控）」
// 的现状下暂不需要。待引入独立 .css 组件层时，再加回该自建规则（stylelint 16 需用
// 新的 ESM 插件格式重新实现）。
export default {
  rules: {
    'custom-property-pattern': '^aos-[a-z0-9]+(-[a-z0-9]+)*$',
  },
  ignoreFiles: ['**/dist/**', '**/node_modules/**'],
};
