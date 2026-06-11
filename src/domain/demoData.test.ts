import { demoLiterature, demoProject, demoSpace } from './demoData';

describe('demo data', () => {
  it('loads a scientific discovery space with a useful private literature library', () => {
    expect(demoSpace.id).toBe('zju-qiushi-robot-lab');
    expect(demoProject.spaceId).toBe(demoSpace.id);
    expect(demoSpace.name).toBe('浙江大学自动化反应发现空间');
    expect(demoLiterature).toHaveLength(6);
    expect(demoLiterature.every((item) => item.evidenceTags.length > 0)).toBe(true);
  });

  it('keeps demo literature tied to automated chemistry reaction design', () => {
    const titles = demoLiterature.map((item) => item.title).join(' ');
    expect(titles).toMatch(/反应|催化剂|溶剂|收率/);
  });
});
