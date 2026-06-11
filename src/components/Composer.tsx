import {
  Bot,
  ChevronDown,
  FolderOpen,
  Mic,
  Paperclip,
  SendHorizontal,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { WorkflowStageId } from '../domain/types';

interface ComposerProps {
  activeStageId: WorkflowStageId;
  workspacePath: string;
  canAdvance: boolean;
  isRunning: boolean;
  onRun: (constraint: string) => Promise<void>;
}

interface ScienceSkill {
  command: string;
  label: string;
  description: string;
}

interface ToolbarOption {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

const actionLabels: Record<WorkflowStageId, string> = {
  literature: '分析文献',
  'scigraph-analysis': '生成报告',
  report: '设计方案',
  'protocol-design': 'LabOntology 校验',
  'labontology-check': '模拟执行',
  simulation: '回流 Experimental Graph',
  'experimental-graph': '生成下一轮建议',
  'next-suggestion': '流程完成'
};

const scienceSkills: ScienceSkill[] = [
  {
    command: '/scigraph',
    label: 'SciGraph 文献分析',
    description: '把私域文献对齐到反应实体、证据链和公开知识。'
  },
  {
    command: '/report',
    label: '研究总结报告',
    description: '基于文献分析结果生成可追溯的总结报告。'
  },
  {
    command: '/protocol',
    label: '实验方案设计',
    description: '把报告和用户约束转化为实验方案。'
  },
  {
    command: '/labontology',
    label: 'LabOntology 校验',
    description: '规范实验术语并检查模拟实验室约束。'
  },
  {
    command: '/simulate',
    label: '模拟执行',
    description: '通过模拟执行引擎运行实验方案。'
  },
  {
    command: '/graph',
    label: 'Experimental Graph 回流',
    description: '把运行数据、观测结果和建议组织为图谱知识。'
  }
];

const modelOptions: ToolbarOption[] = [
  { id: 'sci-pro', label: '科学智能体 Pro', hint: '完整科学工作流与图谱推理' },
  { id: 'sci-lite', label: '科学智能体 Lite', hint: '轻量快速响应' },
  { id: 'general', label: '通用智能体', hint: '不附加科学定制层' }
];

/** 实验安全闸门：演示轮只放开模拟执行，物理执行保持禁用。 */
const approvalOptions: ToolbarOption[] = [
  { id: 'simulation-only', label: '仅模拟执行', hint: '不接触真实装置（当前轮默认）' },
  { id: 'queue-approval', label: 'Queue With Approval', hint: '提交装置队列，人工审批后执行' },
  { id: 'direct', label: '直接物理执行', hint: '需装置管理员授权，演示中禁用', disabled: true }
];

interface ToolbarMenuProps {
  ariaLabel: string;
  icon: ReactNode;
  options: ToolbarOption[];
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (optionId: string) => void;
}

function ToolbarMenu({ ariaLabel, icon, options, value, isOpen, onToggle, onSelect }: ToolbarMenuProps) {
  const current = options.find((option) => option.id === value);

  return (
    <div className="toolbar-menu">
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="composer-tool"
        onClick={onToggle}
        type="button"
      >
        {icon}
        <span>{current?.label}</span>
        <ChevronDown size={13} />
      </button>
      {isOpen && (
        <ul aria-label={`${ariaLabel}选项`} className="toolbar-menu__list" role="listbox">
          {options.map((option) => (
            <li key={option.id}>
              <button
                aria-disabled={option.disabled}
                aria-selected={option.id === value}
                className={option.disabled ? 'toolbar-menu__option toolbar-menu__option--disabled' : 'toolbar-menu__option'}
                onClick={() => {
                  if (option.disabled) return;
                  onSelect(option.id);
                }}
                role="option"
                type="button"
              >
                <strong>{option.label}</strong>
                {option.hint && <small>{option.hint}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Composer({ activeStageId, canAdvance, isRunning, onRun, workspacePath }: ComposerProps) {
  const [draft, setDraft] = useState('');
  const [isRunPending, setIsRunPending] = useState(false);
  // 选中技能后记录写入的前缀，输入仍以该前缀开头时面板保持关闭。
  const [dismissedCommand, setDismissedCommand] = useState<string | null>(null);
  const [modelId, setModelId] = useState('sci-pro');
  const [approvalId, setApprovalId] = useState('simulation-only');
  const [openMenu, setOpenMenu] = useState<'model' | 'approval' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const runPendingRef = useRef(false);

  const isBusy = isRunning || isRunPending;
  const isPaletteDismissed = dismissedCommand !== null && draft.startsWith(dismissedCommand);
  const isPaletteOpen = draft.startsWith('/') && !isPaletteDismissed;

  async function handleRun() {
    if (isRunning || runPendingRef.current || !canAdvance) return;
    runPendingRef.current = true;
    setIsRunPending(true);
    try {
      await onRun(draft);
      setDraft('');
      setDismissedCommand(null);
    } finally {
      runPendingRef.current = false;
      setIsRunPending(false);
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    setDismissedCommand((command) => (command !== null && value.startsWith(command) ? command : null));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') {
      if (openMenu !== null) {
        setOpenMenu(null);
        return;
      }
      if (isPaletteOpen) {
        setDismissedCommand(draft);
      }
      return;
    }
    if (event.key === 'Enter' && !isPaletteOpen) {
      event.preventDefault();
      void handleRun();
    }
  }

  function selectSkill(command: string) {
    const draftWithCommand = `${command} `;
    setDraft(draftWithCommand);
    setDismissedCommand(draftWithCommand);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <footer className="composer-shell" aria-label="SciWork 输入区">
      {isPaletteOpen && (
        <div className="skill-palette" role="listbox" aria-label="科学技能包">
          <div className="skill-palette__header">
            <Sparkles size={14} />
            <span>科学技能包</span>
          </div>
          {scienceSkills.map((skill) => (
            <button
              className="skill-option"
              key={skill.command}
              onClick={() => selectSkill(skill.command)}
              role="option"
              type="button"
            >
              <strong>{skill.command}</strong>
              <span>{skill.label}</span>
              <small>{skill.description}</small>
            </button>
          ))}
        </div>
      )}

      <div className="composer">
        <label className="sr-only" htmlFor="sciwork-message">
          给 SciWork 发送消息
        </label>
        <input
          aria-label="给 SciWork 发送消息"
          className="composer__input"
          id="sciwork-message"
          onChange={(event) => handleDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="给 SciWork 发送消息，输入 / 调用科学技能包"
          ref={inputRef}
          value={draft}
        />

        <div className="composer__toolbar">
          <div className="composer__toolbar-group">
            <button aria-label="工作区目录" className="composer-tool composer-tool--workspace" type="button">
              <FolderOpen size={14} />
              <span>{workspacePath}</span>
            </button>
            <ToolbarMenu
              ariaLabel="模型"
              icon={<Bot size={14} />}
              isOpen={openMenu === 'model'}
              onSelect={(optionId) => {
                setModelId(optionId);
                setOpenMenu(null);
              }}
              onToggle={() => setOpenMenu(openMenu === 'model' ? null : 'model')}
              options={modelOptions}
              value={modelId}
            />
            <ToolbarMenu
              ariaLabel="执行授权"
              icon={<ShieldCheck size={14} />}
              isOpen={openMenu === 'approval'}
              onSelect={(optionId) => {
                setApprovalId(optionId);
                setOpenMenu(null);
              }}
              onToggle={() => setOpenMenu(openMenu === 'approval' ? null : 'approval')}
              options={approvalOptions}
              value={approvalId}
            />
          </div>

          <div className="composer__toolbar-group">
            <button aria-label="添加文件" className="icon-button" type="button">
              <Paperclip size={15} />
            </button>
            <button aria-label="语音输入" className="icon-button" type="button">
              <Mic size={15} />
            </button>
            <button className="send-button" disabled={isBusy || !canAdvance} onClick={handleRun} type="button">
              <SendHorizontal size={15} />
              <span>{isBusy ? '执行中...' : actionLabels[activeStageId]}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
