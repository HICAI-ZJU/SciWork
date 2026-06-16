const base = import.meta.env.BASE_URL || './';

function assetUrl(path: string): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

/**
 * 视觉资产槽位。替换品牌或纹理时只改这里的文件路径，组件逻辑无需调整。
 * 文件位于 assets/（Vite publicDir），构建时原样拷贝。
 */
export const themeAssets = {
  /** 侧栏标识与应用图标：求是智核 v2 抽象 IP。 */
  logo: assetUrl('ip/sciwork-ip-qiushi-core-v2-icon.png'),
  /** AI 科学助手消息头像（求是智核 v2 清爽版本）。 */
  assistantAvatar: assetUrl('ip/sciwork-ip-qiushi-core-v2-avatar.png'),
  /** 求是智核 v2 工作台主视觉，可用于启动页或主题皮肤。 */
  workbenchVisual: assetUrl('ip/sciwork-ip-qiushi-core-v2-workbench.png'),
  /** 左栏深蓝知识图谱纹理。 */
  sidebarTexture: assetUrl('patterns/sidebar-graph.svg'),
  /** 中栏与右栏的纸面纹理（透明底，平铺）。 */
  paperTexture: assetUrl('patterns/paper-texture.svg'),
  /** 登录页随机轮换的背景：求是建筑、知识图谱、文献、仪器与机器人一体化主题。 */
  loginBackgrounds: [
    assetUrl('themes/sciwork-kg-integration-qiushi-light-03.png'),
    assetUrl('themes/sciwork-kg-integration-qiushi-light-02.png'),
    assetUrl('themes/sciwork-kg-integration-qiushi-dark-03.png'),
    assetUrl('themes/sciwork-theme-zju-ai-science-robot-kg-v6.png')
  ]
} as const;
