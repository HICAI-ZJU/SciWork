import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { SessionWorkspace } from './components/SessionWorkspace';
import { Sidebar } from './components/Sidebar';
import { SpaceHeader } from './components/SpaceHeader';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './auth/AuthContext';
import { sc } from './services/scicompassClient';
import { projectDirectory } from './domain/project';
import { themeAssets } from './theme/assets';
import type { Project, ScienceSession, ScientificSpace } from './domain/types';

type ShellStyle = CSSProperties & {
  '--sciwork-skin': string;
  '--sciwork-paper': string;
};

function createSession(projectId: string, sequence: number): ScienceSession {
  return {
    id: `session-${Date.now()}`,
    projectId,
    title: `任务 ${sequence}：新建科学任务`,
    objective: '基于当前项目目标继续推进文献-实验闭环。',
    status: 'active',
    updatedAt: '刚刚'
  };
}

// 门控：未登录显示登录页；登录后进入其所属空间的工作台外壳。
export function App() {
  const { status } = useAuth();
  if (status === 'anonymous') return <LoginPage />;
  return <AuthedApp />;
}

function AuthedApp() {
  const { spaceConfig } = useAuth();
  // 登录后空间身份来自后端 spaceConfig，适配为 UI 的 ScientificSpace。
  const space: ScientificSpace = {
    id: spaceConfig!.space,
    name: spaceConfig!.displayName,
    domain: spaceConfig!.domain ?? '',
    device: spaceConfig!.devices[0]?.name ?? '—',
    policy: 'Queue With Approval'
  };

  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<ScienceSession[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [activeSessionId, setActiveSessionId] = useState('');
  const [loading, setLoading] = useState(true);

  // 按空间从真实后端加载项目（callTool 已按当前 space 路由、物理隔离）。
  useEffect(() => {
    let alive = true;
    setLoading(true);
    sc.projectList()
      .then((r) => {
        if (!alive) return;
        const mapped: Project[] = r.projects.map((p: any) => ({
          id: p.id,
          spaceId: space.id,
          name: p.name,
          objective: p.objective ?? '',
          graphSlug: p.graphSlug
        }));
        setProjects(mapped);
        setActiveProjectId((cur) => cur || mapped[0]?.id || '');
      })
      .catch(() => { /* 网关未就绪：保持空列表，显示空态 */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [space.id]);

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const projectSessions = sessions.filter((session) => session.projectId === activeProjectId);
  const activeSession = projectSessions.find((session) => session.id === activeSessionId);

  async function handleCreateProject() {
    const sequence = String(projects.length + 1).padStart(2, '0');
    const created = await sc.projectCreate(`新建科研项目 ${sequence}`, '定义新的科学任务并开始探索。');
    const project: Project = {
      id: created.id,
      spaceId: space.id,
      name: created.name,
      objective: created.objective,
      graphSlug: created.graphSlug
    };
    setProjects((prev) => [...prev, project]);
    setActiveProjectId(project.id);
  }

  function handleCreateSession() {
    if (!activeProject) return;
    const session = createSession(activeProject.id, projectSessions.length + 1);
    setSessions((prev) => [...prev, session]);
    setActiveSessionId(session.id);
  }

  function handleSelectProject(projectId: string) {
    setActiveProjectId(projectId);
    const firstSession = sessions.find((session) => session.projectId === projectId);
    setActiveSessionId(firstSession?.id ?? '');
  }

  const workspacePath = activeProject
    ? (activeSession ? `${projectDirectory(activeProject)}/${activeSession.id}` : projectDirectory(activeProject))
    : '';

  const shellStyle: ShellStyle = {
    '--sciwork-skin': `url(${themeAssets.sidebarTexture})`,
    '--sciwork-paper': `url(${themeAssets.paperTexture})`
  };

  return (
    <>
      <SpaceHeader />
      <div className="desktop-app" style={shellStyle}>
        <Sidebar
          space={space}
          projects={projects}
          activeProjectId={activeProjectId}
          sessions={projectSessions}
          activeSessionId={activeSessionId}
          literatureCount={0}
          onCreateProject={handleCreateProject}
          onCreateSession={handleCreateSession}
          onSelectProject={handleSelectProject}
          onSelectSession={setActiveSessionId}
        />
        {activeProject ? (
          <SessionWorkspace
            key={`${activeProject.id}/${activeSession?.id ?? 'none'}`}
            project={activeProject}
            session={activeSession}
            space={space}
            literature={[]}
            workspacePath={workspacePath}
          />
        ) : (
          <main className="workbench-main" aria-label="智能体会话">
            <p style={{ margin: 'auto', color: '#7d8aa6', fontSize: 14 }}>
              {loading ? '正在加载项目…' : '点击左侧「新建项目」开始你的科学发现任务'}
            </p>
          </main>
        )}
      </div>
    </>
  );
}
