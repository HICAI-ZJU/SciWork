import {
  APP_DISPLAY_NAME,
  APP_ICON_ASSET_PATH,
  APP_USER_MODEL_ID,
  APP_WINDOW_TITLE
} from '../../electron/appIdentity';

describe('Electron app identity', () => {
  it('uses SciWork as the desktop app identity instead of the Electron default', () => {
    expect(APP_DISPLAY_NAME).toBe('SciWork');
    expect(APP_WINDOW_TITLE).toBe('SciWork');
    expect(APP_USER_MODEL_ID).toBe('edu.zju.sciwork.desktop');
  });

  it('uses the Qiushi Intelligence Core v2 as the desktop icon', () => {
    expect(APP_ICON_ASSET_PATH).toBe('../assets/ip/sciwork-ip-qiushi-core-v2-icon.png');
  });
});
