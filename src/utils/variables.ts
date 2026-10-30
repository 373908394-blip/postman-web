import type { Environment, KeyValue } from '../types';

const VAR_PATTERN = /\{\{\s*([\w.$-]+)\s*\}\}/g;

/** 把环境变量数组转成字典（只取启用的项）。 */
export const toVariableMap = (env?: Environment | null): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!env) return map;
  env.variables.forEach((v: KeyValue) => {
    if (v.enabled && v.key.trim()) map[v.key.trim()] = v.value;
  });
  return map;
};

/** 解析 {{var}} 占位符；未定义的变量保持原样，方便用户发现拼写错误。 */
export const resolveVariables = (input: string, vars: Record<string, string>): string =>
  input.replace(VAR_PATTERN, (match, key: string) => (key in vars ? vars[key] : match));

/** 找出字符串里引用的所有变量名（去重）。 */
export const extractVariables = (input: string): string[] => {
  const found = new Set<string>();
  for (const match of input.matchAll(VAR_PATTERN)) found.add(match[1]);
  return [...found];
};

/** 在整段文本里把未解析的变量名标出来 */
export const findMissingVariables = (input: string, vars: Record<string, string>): string[] =>
  extractVariables(input).filter((name) => !(name in vars));
