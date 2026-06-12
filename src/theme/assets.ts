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
  /** 侧栏标识与应用图标：外星科研智核抽象 IP。 */
  logo: assetUrl('ip/sciwork-ip-alien-core-icon-v1.png'),
  /** AI 科学助手消息头像（外星科研智核轻人格化版本）。 */
  assistantAvatar: assetUrl('ip/sciwork-ip-alien-core-avatar-v1.png'),
  /** 外星科研智核工作台主视觉，可用于启动页或主题皮肤。 */
  workbenchVisual: assetUrl('ip/sciwork-ip-alien-core-workbench-v1.png'),
  /** 左栏深蓝知识图谱纹理。 */
  sidebarTexture: assetUrl('patterns/sidebar-graph.svg'),
  /** 中栏与右栏的纸面纹理（透明底，平铺）。 */
  paperTexture: assetUrl('patterns/paper-texture.svg')
} as const;
