import { themeAssets } from './assets';

describe('theme assets', () => {
  it('resolves the Qiushi Intelligence Core IP for branding and the assistant avatar', () => {
    expect(themeAssets.logo).toMatch(/ip\/sciwork-ip-alien-core-icon-v1\.png$/);
    expect(themeAssets.assistantAvatar).toMatch(/ip\/sciwork-ip-alien-core-avatar-v1\.png$/);
    expect(themeAssets.workbenchVisual).toMatch(/ip\/sciwork-ip-alien-core-workbench-v1\.png$/);
  });

  it('resolves the sidebar graph texture and the paper texture', () => {
    expect(themeAssets.sidebarTexture).toMatch(/patterns\/sidebar-graph\.svg$/);
    expect(themeAssets.paperTexture).toMatch(/patterns\/paper-texture\.svg$/);
  });
});
