import { BookOpen, FolderKanban, Network, Plus } from 'lucide-react';
import { projectDirectory, referenceDirectory } from '../domain/project';
import type { Project, ScienceSession, ScientificSpace } from '../domain/types';
import { SciWorkPulseIcon } from './SciWorkPulseIcon';

interface SidebarProps {
  space: ScientificSpace;
  projects: Project[];
  activeProjectId: string;
  sessions: ScienceSession[];
  activeSessionId: string;
  literatureCount: number;
  onCreateProject: () => void;
  onCreateSession: () => void;
  onSelectProject: (projectId: string) => void;
  onSelectSession: (sessionId: string) => void;
}

function sessionStatusLabel(status: ScienceSession['status']): string {
  if (status === 'active') return '进行中';
  if (status === 'queued') return '待运行';
  if (status === 'completed') return '已完成';
  return '待启动';
}

export function Sidebar({
  space,
  projects,
  activeProjectId,
  sessions,
  activeSessionId,
  literatureCount,
  onCreateProject,
  onCreateSession,
  onSelectProject,
  onSelectSession
}: SidebarProps) {
  const activeProject = projects.find((project) => project.id === activeProjectId);

  return (
    <nav className="sidebar" aria-label="项目与会话导航">
      {/* 身份区：IP 形象 + 流光特效 + 当前科学发现空间 */}
      <div className="sidebar__identity">
        <span className="sidebar__avatar-ring">
          <SciWorkPulseIcon className="sidebar__logo" state="active" title="SciWork 外星科研智核" />
        </span>
        <div className="sidebar__wordmark">
          <strong>SciWork</strong>
          <span>{space.name}</span>
        </div>
        <i aria-hidden="true" className="sidebar__identity-sheen" />
      </div>

      <section className="sidebar__section" aria-labelledby="sidebar-projects">
        <div className="sidebar__section-title-row">
          <h2 id="sidebar-projects">项目</h2>
          <button className="sidebar__mini-action" onClick={onCreateProject} type="button">
            <Plus size={13} />
            <span>新建项目</span>
          </button>
        </div>
        <div className="sidebar__list sidebar__list--projects">
          {projects.map((project) => (
            <button
              className={
                project.id === activeProjectId
                  ? 'sidebar__row sidebar__row--project sidebar__row--active'
                  : 'sidebar__row sidebar__row--project'
              }
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              type="button"
            >
              <FolderKanban size={15} />
              <span className="sidebar__row-body">
                <strong>{project.name}</strong>
                <small>{projectDirectory(project)}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar__section" aria-labelledby="sidebar-sessions">
        <div className="sidebar__section-title-row">
          <h2 id="sidebar-sessions">会话</h2>
          <button className="sidebar__mini-action" onClick={onCreateSession} type="button">
            <Plus size={13} />
            <span>新建会话</span>
          </button>
        </div>
        <ol className="sidebar__list sidebar__list--sessions">
          {sessions.length === 0 && <li className="sidebar__empty">点击「新建会话」开始第一个任务</li>}
          {sessions.map((session) => (
            <li key={session.id}>
              <button
                aria-label={`${session.title}，${sessionStatusLabel(session.status)}`}
                className={
                  session.id === activeSessionId
                    ? 'sidebar__row sidebar__row--session sidebar__row--active'
                    : 'sidebar__row sidebar__row--session'
                }
                onClick={() => onSelectSession(session.id)}
                type="button"
              >
                <i
                  aria-hidden="true"
                  className={
                    session.status === 'active' ? 'sidebar__status-dot sidebar__status-dot--active' : 'sidebar__status-dot'
                  }
                />
                <span className="sidebar__row-body">
                  <strong>{session.title}</strong>
                  <small>
                    {sessionStatusLabel(session.status)} · {session.updatedAt}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <div className="sidebar__footer">
        <div className="sidebar__resource">
          <BookOpen size={14} />
          <span>私域文献库</span>
          {activeProject && (
            <small>
              {referenceDirectory(activeProject)} · {literatureCount} 篇
            </small>
          )}
        </div>
        <div className="sidebar__resource">
          <Network size={14} />
          <span>知识图谱</span>
          <small>SciGraph / LabOntology / Experimental Graph</small>
        </div>
      </div>
    </nav>
  );
}
