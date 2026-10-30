export type JsonTokenType = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punct' | 'plain';

export interface JsonToken {
  value: string;
  type: JsonTokenType;
}

const isDigit = (ch: string) => ch >= '0' && ch <= '9';

/**
 * 极简 JSON 词法分析器：只做「上色」用途，不校验语法。
 * 自己实现是为了不引入 react-json-view 之类的重量级依赖。
 */
export const tokenizeJson = (text: string): JsonToken[] => {
  const tokens: JsonToken[] = [];
  let i = 0;

  const push = (value: string, type: JsonTokenType) => {
    if (value) tokens.push({ value, type });
  };

  while (i < text.length) {
    const ch = text[i];

    // 字符串 / 键名
    if (ch === '"') {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === '\\') {
          j += 2;
          continue;
        }
        if (text[j] === '"') {
          j += 1;
          break;
        }
        j += 1;
      }
      const raw = text.slice(i, j);
      // 判断是否为键：后面第一个非空白字符是冒号
      let k = j;
      while (k < text.length && /\s/.test(text[k])) k += 1;
      push(raw, text[k] === ':' ? 'key' : 'string');
      i = j;
      continue;
    }

    // 数字
    if (isDigit(ch) || (ch === '-' && isDigit(text[i + 1] ?? ''))) {
      let j = i + 1;
      while (j < text.length && /[0-9.eE+-]/.test(text[j])) j += 1;
      push(text.slice(i, j), 'number');
      i = j;
      continue;
    }

    // 关键字
    if (text.startsWith('true', i) || text.startsWith('false', i)) {
      const word = text.startsWith('true', i) ? 'true' : 'false';
      push(word, 'boolean');
      i += word.length;
      continue;
    }
    if (text.startsWith('null', i)) {
      push('null', 'null');
      i += 4;
      continue;
    }

    // 标点
    if ('{}[],:'.includes(ch)) {
      push(ch, 'punct');
      i += 1;
      continue;
    }

    // 其它（空白、非法字符）
    let j = i + 1;
    while (j < text.length && !'"{}[],:'.includes(text[j]) && !isDigit(text[j])) {
      if (text.startsWith('true', j) || text.startsWith('false', j) || text.startsWith('null', j)) break;
      j += 1;
    }
    push(text.slice(i, j), 'plain');
    i = j;
  }

  return tokens;
};

export interface PrettyResult {
  ok: boolean;
  text: string;
  reason?: string;
}

/** 尝试美化 JSON；失败时返回原因，调用方回退到原文展示。 */
export const prettyJson = (text: string): PrettyResult => {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, text, reason: '响应体为空' };
  try {
    return { ok: true, text: JSON.stringify(JSON.parse(trimmed), null, 2) };
  } catch (err) {
    return { ok: false, text, reason: err instanceof Error ? err.message : '不是合法的 JSON' };
  }
};

/** 把 JSON 压成一行 */
export const minifyJson = (text: string): PrettyResult => {
  try {
    return { ok: true, text: JSON.stringify(JSON.parse(text)) };
  } catch (err) {
    return { ok: false, text, reason: err instanceof Error ? err.message : '不是合法的 JSON' };
  }
};

export const isProbablyJson = (contentType: string, body: string): boolean => {
  if (/json/i.test(contentType)) return true;
  const trimmed = body.trim();
  if (!trimmed) return false;
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
};

export const tryParseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};
