import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SessionWorkspace } from './components/SessionWorkspace';
import { Sidebar } from './components/Sidebar';
import { SciCompassWorkbench } from './components/SciCompassWorkbench';
import { demoLiterature, demoProjects, demoSessions, demoSpace } from './domain/demoData';
import { projectDirectory } from './domain/project';
import { themeAssets } from './theme/assets';
import type { Project, ScienceSession } from './domain/types';

type WorkbenchView = 'demo' | 'live';

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

export function App() {
  const [view, setView] = useState<WorkbenchView>('demo');
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
      spaceId: demoSpace.id,
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

  // 悬浮视图切换：默认演示流程（mock 工作流），可切到实盘工作台（真实连接 SciCompass 后端）
  const modeSwitch = (
    <div className="view-switch" role="tablist" aria-label="工作台视图切换">
      <button
        role="tab"
        aria-selected={view === 'demo'}
        className={view === 'demo' ? 'is-active' : ''}
        onClick={() => setView('demo')}
      >
        演示流程
      </button>
      <button
        role="tab"
        aria-selected={view === 'live'}
        className={view === 'live' ? 'is-active' : ''}
        onClick={() => setView('live')}
      >
        SciCompass 实盘
      </button>
    </div>
  );

  if (view === 'live') {
    return (
      <>
        {modeSwitch}
        <SciCompassWorkbench />
      </>
    );
  }

  return (
    <>
      {modeSwitch}
      <div className="desktop-app" style={shellStyle}>
        <Sidebar
          space={demoSpace}
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
          space={demoSpace}
          literature={demoLiterature}
          workspacePath={workspacePath}
        />
      </div>
    </>
  );
}
