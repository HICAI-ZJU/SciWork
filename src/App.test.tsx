import { fireEvent, render, screen, within } from '@testing-library/react';
import { App } from './App';

describe('SciWork Desktop app', () => {
  it('renders the minimal Chinese desktop workbench shell', () => {
    render(<App />);

    const sidebar = screen.getByRole('navigation', { name: /项目与会话导航/ });
    const main = screen.getByRole('main', { name: /智能体会话/ });
    const context = screen.getByRole('complementary', { name: /任务进度与项目上下文/ });

    expect(sidebar).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(context).toBeInTheDocument();

    // 左栏：身份行（logo + 当前空间）+ 项目/会话两级导航
    expect(within(sidebar).getByText('SciWork')).toBeInTheDocument();
    expect(within(sidebar).getByText('浙江大学自动化反应发现空间')).toBeInTheDocument();
    expect(within(sidebar).getByRole('img', { name: /科学助手形象/ })).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: '项目' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: '会话' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /新建项目/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /新建会话/ })).toBeInTheDocument();
    expect(within(sidebar).getByText('私域文献库')).toBeInTheDocument();
    expect(within(sidebar).getByText(/mild-cross-coupling-demo\/reference/)).toBeInTheDocument();

    // 输入区：Claude/Codex 式工具条（工作目录 / 模型 / 执行授权）
    expect(screen.getByRole('textbox', { name: /给 SciWork 发送消息/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '工作区目录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '模型' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '执行授权' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /语音输入/ })).toBeInTheDocument();

    // 中栏头部与右栏知识资产
    expect(within(main).getByRole('heading', { name: '温和条件下偶联反应优化演示项目' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /SciWork/ }).length).toBeGreaterThanOrEqual(2);
    const assetPills = within(context).getByRole('group', { name: '知识资产状态' });
    expect(within(assetPills).getByText('SciGraph')).toBeInTheDocument();
    expect(within(assetPills).getByText('LabOntology')).toBeInTheDocument();
    expect(within(assetPills).getByText('Experimental Graph')).toBeInTheDocument();
    expect(within(context).getByText(/求是智能实验装置/)).toBeInTheDocument();
  });

  it('opens the slash skill palette from the app composer', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('textbox', { name: /给 SciWork 发送消息/ }), {
      target: { value: '/' }
    });

    const palette = screen.getByRole('listbox', { name: /科学技能包/ });
    expect(within(palette).getByText('/scigraph')).toBeInTheDocument();
    expect(within(palette).getByText('/report')).toBeInTheDocument();
    expect(within(palette).getByText('/protocol')).toBeInTheDocument();
    expect(within(palette).getByText('/labontology')).toBeInTheDocument();
    expect(within(palette).getByText('/simulate')).toBeInTheDocument();
    expect(within(palette).getByText('/graph')).toBeInTheDocument();
  });

  it('advances through the scientific workflow from the workbench composer', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /分析文献/ }));
    expect(await screen.findByText(/SciGraph 已对齐文献实体和证据链/)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /生成报告/ }));
    expect(await screen.findByRole('heading', { name: /研究总结报告/ })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /给 SciWork 发送消息/ }), {
      target: { value: '希望保持温和条件并缩短反应时间' }
    });
    fireEvent.click(await screen.findByRole('button', { name: /设计方案/ }));
    expect(await screen.findByText(/自动化温和偶联反应条件筛选/)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /LabOntology 校验/ }));
    expect(await screen.findByRole('heading', { name: /LabOntology 校验完成/ })).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /模拟执行/ }));
    expect(
      await screen.findByRole('heading', { name: /模拟执行完成并生成观测结果/ })
    ).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /回流 Experimental Graph/ }));
    expect(await screen.findByRole('heading', { name: /Experimental Graph 回流完成/ })).toBeInTheDocument();

    const context = screen.getByRole('complementary', { name: /任务进度与项目上下文/ });
    expect(within(context).getByRole('heading', { name: 'Experimental Graph 图谱' })).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /生成下一轮建议/ }));
    expect(await screen.findByRole('heading', { name: '下一轮实验建议' })).toBeInTheDocument();
    expect(screen.getByText('收窄溶剂候选范围')).toBeInTheDocument();
    expect(screen.getByText('测试更低催化剂用量')).toBeInTheDocument();
  });

  it('resets the workflow when a new session is created', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /分析文献/ }));
    expect(await screen.findByRole('button', { name: /生成报告/ })).toBeInTheDocument();
    expect(screen.getByText(/SciGraph 已对齐文献实体和证据链/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /新建会话/ }));

    expect(await screen.findByRole('button', { name: /分析文献/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /任务 3：新建科学任务/ })).toBeInTheDocument();
    expect(screen.queryByText(/SciGraph 已对齐文献实体和证据链/)).not.toBeInTheDocument();
  });

  it('resets the workflow when switching to another project', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /分析文献/ }));
    expect(await screen.findByRole('button', { name: /生成报告/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /连续流筛选与放大验证项目/ }));

    expect(await screen.findByRole('button', { name: /分析文献/ })).toBeInTheDocument();
    const main = screen.getByRole('main', { name: /智能体会话/ });
    expect(within(main).getByRole('heading', { name: '连续流筛选与放大验证项目' })).toBeInTheDocument();
  });

  it('does not skip workflow stages when the literature action is clicked twice rapidly', async () => {
    render(<App />);

    const analyzeButton = screen.getByRole('button', { name: /分析文献/ });
    fireEvent.click(analyzeButton);
    fireEvent.click(analyzeButton);

    expect(await screen.findByRole('button', { name: /生成报告/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /设计方案/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /研究总结报告/ })).not.toBeInTheDocument();
  });
});
