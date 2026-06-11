import type { Project } from './types';

/** 项目对应的工作区目录；演示数据可显式指定，新建项目走默认约定。 */
export function projectDirectory(project: Project): string {
  return project.directory ?? `projects/${project.id}`;
}

/** 项目专属私域文献目录：约定为工作区目录下的 reference/。 */
export function referenceDirectory(project: Project): string {
  return `${projectDirectory(project)}/reference`;
}
