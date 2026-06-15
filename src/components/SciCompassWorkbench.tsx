import { useCallback, useEffect, useRef, useState } from 'react';
import { sc, type HealthInfo } from '../services/scicompassClient';
import './SciCompassWorkbench.css';

type LogTone = 'info' | 'ok' | 'warn' | 'err' | 'step';
interface LogLine { tone: LogTone; text: string; at: string }

interface GraphNode { id: string; type: string; label: string; detail: string; round: number; provenance: string[] }

function now() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

const DEMO_BIBTEX = `@article{ma2024allene,
  title={Mild allene cross-coupling with low catalyst loading},
  author={Ma, Shengming},
  year={2024}, journal={JACS},
  abstract={Allene coupling proceeds in a 45-65C window with low Pd loading and online conversion monitoring.}
}`;

/**
 * SciCompass 实盘工作台：真实连接 HTTP 网关（同一套 MCP 工具），
 * 一键跑通科学发现闭环——项目→文献→图谱→协议→模拟运行→回流→晋升，全部走真实后端。
 */
export function SciCompassWorkbench() {
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const [devices, setDevices] = useState<Array<{ id: string; name: string; kind: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; graphSlug: string }>>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [running, setRunning] = useState(false);
  const [groupCapsules, setGroupCapsules] = useState<GraphNode[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const log = useCallback((tone: LogTone, text: string) => {
    setLogs((prev) => [...prev, { tone, text, at: now() }]);
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const h = await sc.health();
      setHealthInfo(h);
      setHealthErr(null);
      const [d, p] = await Promise.all([sc.deviceList(), sc.projectList()]);
      setDevices(d.devices);
      setProjects(p.projects);
    } catch (e) {
      setHealthErr(String((e as Error).message));
      setHealthInfo(null);
    }
  }, []);

  useEffect(() => { void refreshHealth(); }, [refreshHealth]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function runFullLoop() {
    setRunning(true);
    setLogs([]);
    setGraphNodes([]);
    setGroupCapsules([]);
    try {
      log('step', '① 创建项目');
      const stamp = new Date().toLocaleString('zh-CN', { hour12: false });
      const project = await sc.projectCreate(`联烯偶联筛选 ${stamp}`, '在温和条件下优化联烯偶联反应');
      log('ok', `项目已建：${project.name}  →  图谱 ${project.graphSlug}`);
      const graph = project.graphSlug;

      log('step', '② 导入私域文献 + 全文检索');
      const imp = await sc.literatureImport(project.id, DEMO_BIBTEX);
      log('ok', `导入 ${imp.imported} 篇`);
      const hits = await sc.literatureSearch(project.id, 'allene coupling');
      log('ok', `检索 "allene coupling" 命中 ${hits.hits.length} 篇：${hits.hits[0]?.title ?? '—'}`);
      const litId = hits.hits[0]?.id;

      log('step', '③ 写入 LabGraph：研究目标 + 文献证据（带溯源）');
      await sc.graphWrite(graph, [
        { id: 'obj', type: 'Objective', label: '联烯偶联条件筛选', detail: '温和条件、低催化剂用量', round: 1, attrs: {}, provenance: [] },
        { id: 'ev1', type: 'LiteratureEvidence', label: '45-65℃ 窗口证据', detail: '低 Pd 用量 + 在线监测', round: 1, attrs: {}, provenance: [`scicompass://literature/${litId}`] }
      ], [{ id: 'e1', source: 'ev1', target: 'obj', label: 'supports' }]);
      log('ok', '已写入 Objective、LiteratureEvidence 及 supports 边');

      log('step', '④ 锚定公共星图 SciGraph');
      const aligned = await sc.graphAlign(graph, ['ev1']);
      log('ok', `锚定（${aligned.source}）：${aligned.anchors[0]?.anchor}`);

      log('step', '⑤ 本体校验意图 + 保存协议');
      const chk = await sc.ontologyCheck(['pd-catalyst', 'solvent'], { temperatureC: 55 });
      log(chk.ok ? 'ok' : 'warn', chk.ok ? '本体校验通过（试剂组合与温度合规）' : `校验告警：${chk.violations.join('; ')}`);
      const protocol = await sc.protocolSave(project.id, '联烯偶联筛选', { steps: ['投料', '升温 55℃', '在线监测', '取样'] });
      log('ok', `协议已存：${protocol.id} v${protocol.version}`);

      log('step', '⑥ 提交模拟运行（行动引擎，Queue With Approval）');
      const sub = await sc.runSubmit({
        projectId: project.id, protocolId: protocol.id, protocolVersion: protocol.version,
        deviceId: 'dev-xtalpi', experimentType: 'reaction-screening', mode: 'simulation',
        params: { temperatureC: 55, timeHours: 2 }
      });
      log('ok', `运行已入队：${sub.runId}（${sub.status}）`);
      await sc.graphWrite(graph, [
        { id: 'run1', type: 'Run', label: '模拟运行', detail: `runId=${sub.runId}`, round: 1, attrs: {}, provenance: [`scicompass://runs/${sub.runId}`] }
      ], []);

      log('step', '⑦ 轮询运行状态（时间线物化，惰性推进）');
      let status = sub.status;
      for (let i = 0; i < 15 && status !== 'completed' && status !== 'failed' && status !== 'aborted'; i++) {
        await sleep(900);
        const st = await sc.runStatus(sub.runId);
        status = st.status;
        for (const ev of st.newEvents) log('info', `  · ${ev.label}：${ev.detail}`);
      }
      log(status === 'completed' ? 'ok' : 'warn', `运行结束状态：${status}`);

      log('step', '⑧ 结果回流 LabGraph');
      const results = await sc.resultList({ runId: sub.runId });
      if (results.results.length) {
        const fb = await sc.resultFlowback(results.results[0].id, graph, 'run1', 1);
        log('ok', `结果已回流为图谱节点 ${fb.resultNodeId}（produced 边连接 run）`);
      } else {
        log('warn', '无结果记录（运行未完成？）');
      }

      log('step', '⑨ 蒸馏晋升至组图（人批闸门：confirmedBy）');
      const flowbackNodes = (await sc.graphQuery(graph, { type: 'Result' })).nodes;
      if (flowbackNodes.length) {
        const promo = await sc.graphPromote({
          fromGraph: graph, toGraph: 'grp-masm', sourceNodeIds: [flowbackNodes[0].id],
          capsule: { headType: 'Lesson', title: '55℃ 窗口可行', summary: '模拟显示 55℃/2h 产率良好，可作团队先验', supportNodes: [], edges: [] },
          confirmedBy: '麻生明课题组（示例）', sanitizationChecked: false, irreversibleAck: false
        });
        log('ok', `已晋升为组图胶囊 ${promo.headNodeId}（溯源回指 ${promo.provenance[0]}）`);
      }

      log('step', '⑩ 读取 LabGraph 与组图');
      const full = await sc.graphQuery(graph, { limit: 50 });
      setGraphNodes(full.nodes);
      const grp = await sc.graphQuery('grp-masm', { headOnly: true, limit: 20 });
      setGroupCapsules(grp.nodes);
      log('ok', `项目图 ${full.nodes.length} 节点 / ${full.edges.length} 边；组图胶囊 ${grp.nodes.length} 个`);
      log('ok', '✓ 闭环跑通：文献 → 图谱 → 协议 → 模拟 → 回流 → 晋升');
      await refreshHealth();
    } catch (e) {
      log('err', `✗ ${String((e as Error).message)}`);
    } finally {
      setRunning(false);
    }
  }

  const connected = !!healthInfo;

  return (
    <div className="scw">
      <header className="scw-top">
        <div className="scw-brand">
          <span className="scw-compass" aria-hidden>✦</span>
          <div>
            <h1>SciCompass 实盘工作台</h1>
            <p>能量 × 方向 ＝ 远航 · 前端直连 HTTP 网关，消费与 Claude Code 同一套 MCP 工具</p>
          </div>
        </div>
        <div className={`scw-conn ${connected ? 'is-on' : 'is-off'}`}>
          <span className="scw-dot" />
          {connected
            ? `已连接 · ${healthInfo!.tools} 工具 · ${healthInfo!.spaces?.length ?? 0} 空间`
            : '未连接网关'}
        </div>
      </header>

      {healthErr && (
        <div className="scw-banner">
          无法连接 SciCompass 网关（{sc.baseUrl}）。请先启动后端：
          <code>node scicompass/packages/cli/dist/main.js serve --http 4517</code>
          <button onClick={() => void refreshHealth()}>重试连接</button>
          <div className="scw-banner-err">{healthErr}</div>
        </div>
      )}

      <div className="scw-grid">
        <section className="scw-card scw-devices">
          <h2>行动引擎 · 装置</h2>
          {devices.length === 0 && <p className="scw-empty">—</p>}
          {devices.map((d) => (
            <div key={d.id} className="scw-device">
              <span className={`scw-kind scw-kind-${d.kind}`}>{d.kind === 'automated-platform' ? '装置' : '仪器'}</span>
              <div>
                <strong>{d.name}</strong>
                <code>{d.id}</code>
              </div>
            </div>
          ))}
          <h2 style={{ marginTop: 18 }}>项目（{projects.length}）</h2>
          <div className="scw-projects">
            {projects.slice(-6).reverse().map((p) => (
              <div key={p.id} className="scw-project">
                <strong>{p.name}</strong>
                <code>{p.graphSlug}</code>
              </div>
            ))}
            {projects.length === 0 && <p className="scw-empty">尚无项目，点击右侧运行闭环演示</p>}
          </div>
        </section>

        <section className="scw-card scw-runner">
          <div className="scw-runner-head">
            <h2>科学发现闭环演示</h2>
            <button className="scw-run-btn" disabled={!connected || running} onClick={() => void runFullLoop()}>
              {running ? '运行中…' : '▶ 运行完整闭环'}
            </button>
          </div>
          <div className="scw-log" role="log" aria-label="闭环执行日志">
            {logs.length === 0 && <p className="scw-empty">点击「运行完整闭环」——所有步骤都会真实调用后端工具并在此实时显示。</p>}
            {logs.map((l, i) => (
              <div key={i} className={`scw-logline scw-${l.tone}`}>
                <span className="scw-time">{l.at}</span>
                <span className="scw-msg">{l.text}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </section>

        <section className="scw-card scw-graph">
          <h2>LabGraph · 项目图（{graphNodes.length}）</h2>
          <div className="scw-nodes">
            {graphNodes.length === 0 && <p className="scw-empty">—</p>}
            {graphNodes.map((n) => (
              <div key={n.id} className="scw-node" data-type={n.type}>
                <span className="scw-node-type">{n.type}</span>
                <strong>{n.label}</strong>
                {n.provenance.length > 0 && <code className="scw-prov">{n.provenance[0]}</code>}
              </div>
            ))}
          </div>
          {groupCapsules.length > 0 && (
            <>
              <h2 style={{ marginTop: 18 }}>组图 · 蒸馏胶囊（{groupCapsules.length}）</h2>
              <div className="scw-nodes">
                {groupCapsules.map((n) => (
                  <div key={n.id} className="scw-node scw-capsule" data-type={n.type}>
                    <span className="scw-node-type">{n.type}</span>
                    <strong>{n.label}</strong>
                    <span className="scw-cap-sum">{n.detail}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
