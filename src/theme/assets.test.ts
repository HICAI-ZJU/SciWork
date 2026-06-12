import { themeAssets } from './assets';

describe('theme assets', () => {
  it('resolves the Qiushi Intelligence Core v2 IP for branding and the assistant avatar', () => {
    expect(themeAssets.logo).toMatch(/ip\/sciwork-ip-qiushi-core-v2-icon\.png$/);
    expect(themeAssets.assistantAvatar).toMatch(/ip\/sciwork-ip-qiushi-core-v2-avatar\.png$/);
    expect(themeAssets.workbenchVisual).toMatch(/ip\/sciwork-ip-qiushi-core-v2-workbench\.png$/);
  });

  it('resolves the sidebar graph texture and the paper texture', () => {
    expect(themeAssets.sidebarTexture).toMatch(/patterns\/sidebar-graph\.svg$/);
    expect(themeAssets.paperTexture).toMatch(/patterns\/paper-texture\.svg$/);
  });
});
