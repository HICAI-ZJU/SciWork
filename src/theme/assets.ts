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
  /** 侧栏标识与应用图标：黑白发资深教授 IP 形象。 */
  logo: assetUrl('characters/sciwork-character-senior-professor-bighead-zju-ai-v2.png'),
  /** AI 科学助手消息头像（与标识同源的 IP 形象）。 */
  assistantAvatar: assetUrl('characters/sciwork-character-senior-professor-bighead-zju-ai-v2.png'),
  /** 左栏深蓝知识图谱纹理。 */
  sidebarTexture: assetUrl('patterns/sidebar-graph.svg'),
  /** 中栏与右栏的纸面纹理（透明底，平铺）。 */
  paperTexture: assetUrl('patterns/paper-texture.svg')
} as const;
