import { themeAssets } from './assets';

describe('theme assets', () => {
  it('resolves the senior professor IP avatar for branding and the assistant avatar', () => {
    expect(themeAssets.logo).toMatch(/characters\/sciwork-character-senior-professor-bighead-zju-ai-v2\.png$/);
    expect(themeAssets.assistantAvatar).toMatch(
      /characters\/sciwork-character-senior-professor-bighead-zju-ai-v2\.png$/
    );
  });

  it('resolves the sidebar graph texture and the paper texture', () => {
    expect(themeAssets.sidebarTexture).toMatch(/patterns\/sidebar-graph\.svg$/);
    expect(themeAssets.paperTexture).toMatch(/patterns\/paper-texture\.svg$/);
  });
});
