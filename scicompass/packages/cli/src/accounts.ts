import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export interface AccountTeam { id: string; name: string }

/** 对外账号信息（不含密码） */
export interface Account {
  username: string;
  displayName: string;
  team: AccountTeam;
  space: string;
}

interface StoredAccount extends Account {
  password: string;
}

/**
 * 账号存储 —— 演示级：明文密码、本地校验。
 * 生产必须替换为加盐哈希（bcrypt/scrypt）或机构 SSO。
 */
export class AccountStore {
  private byName = new Map<string, StoredAccount>();

  constructor(accountsFile: string) {
    const data = parse(readFileSync(accountsFile, 'utf8'));
    for (const a of (data.accounts ?? []) as StoredAccount[]) {
      this.byName.set(a.username, a);
    }
  }

  /** 校验账号密码；成功返回去除密码的账号信息，失败返回 null。 */
  verify(username: string, password: string): Account | null {
    const a = this.byName.get(username);
    if (!a || a.password !== password) return null;
    const { password: _omit, ...pub } = a;
    return pub;
  }

  /** 账号绑定的空间集合（去重） */
  spaces(): string[] {
    return [...new Set([...this.byName.values()].map((a) => a.space))];
  }

  list(): Account[] {
    return [...this.byName.values()].map(({ password: _p, ...pub }) => pub);
  }
}
