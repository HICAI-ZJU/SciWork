import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SessionWorkspace } from './components/SessionWorkspace';
import { Sidebar } from './components/Sidebar';
import { SpaceHeader } from './components/SpaceHeader';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './auth/AuthContext';
import { demoLiterature, demoProjects, demoSessions } from './domain/demoData';
import { projectDirectory } from './domain/project';
import { themeAssets } from './theme/assets';
import type { Project, ScienceSession, ScientificSpace } from './domain/types';

type ShellStyle = CSSProperties & {
  '--sciwork-skin': string;
  '--sciwork-paper': string;
};

function createDemoSession(projectId: string, sequence: number): ScienceSession {
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

  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [sessions, setSessions] = useState<ScienceSession[]>(demoSessions);
  const [activeProjectId, setActiveProjectId] = useState(demoProjects[0].id);
  const [activeSessionId, setActiveSessionId] = useState(demoSessions[0].id);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const projectSessions = sessions.filter((session) => session.projectId === activeProject.id);
  const activeSession = projectSessions.find((session) => session.id === activeSessionId) ?? projectSessions[0];

  function handleCreateProject() {
    const sequence = String(projects.length + 1).padStart(2, '0');
    const project: Project = {
      id: `project-${Date.now()}`,
      spaceId: space.id,
      name: `新建科研项目 ${sequence}`,
      objective: '定义新的反应科学任务并开始探索。'
    };
    const session = createDemoSession(project.id, 1);
    setProjects([...projects, project]);
    setSessions([...sessions, session]);
    setActiveProjectId(project.id);
    setActiveSessionId(session.id);
  }

  function handleCreateSession() {
    const session = createDemoSession(activeProject.id, projectSessions.length + 1);
    setSessions([...sessions, session]);
    setActiveSessionId(session.id);
  }

  function handleSelectProject(projectId: string) {
    setActiveProjectId(projectId);
    const firstSession = sessions.find((session) => session.projectId === projectId);
    setActiveSessionId(firstSession?.id ?? '');
  }

  const workspacePath = activeSession
    ? `${projectDirectory(activeProject)}/${activeSession.id}`
    : projectDirectory(activeProject);

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
          activeProjectId={activeProject.id}
          sessions={projectSessions}
          activeSessionId={activeSession?.id ?? ''}
          literatureCount={demoLiterature.length}
          onCreateProject={handleCreateProject}
          onCreateSession={handleCreateSession}
          onSelectProject={handleSelectProject}
          onSelectSession={setActiveSessionId}
        />
        <SessionWorkspace
          key={`${activeProject.id}/${activeSession?.id ?? 'none'}`}
          project={activeProject}
          session={activeSession}
          space={space}
          literature={demoLiterature}
          workspacePath={workspacePath}
        />
      </div>
    </>
  );
}
