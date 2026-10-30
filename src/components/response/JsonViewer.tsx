import { useMemo } from 'react';
import { tokenizeJson } from '../../utils/jsonHighlight';

interface JsonViewerProps {
  text: string;
  wordWrap?: boolean;
}

/** 超过该长度的文本不做词法着色，直接纯文本渲染，避免卡顿。 */
const MAX_TOKENIZE_LENGTH = 20000;

/**
 * 轻量 JSON 高亮展示：复用 utils/jsonHighlight 的 tokenizeJson，
 * 以 span.tok-<type> 着色（配色见 index.css）。
 */
export default function JsonViewer({ text, wordWrap = false }: JsonViewerProps): JSX.Element {
  const tokens = useMemo(() => {
    if (!text || text.length > MAX_TOKENIZE_LENGTH) return null;
    return tokenizeJson(text);
  }, [text]);

  return (
    <pre className={`code-area${wordWrap ? ' wrap' : ''}`} style={{ margin: 0, padding: 12 }}>
      {tokens
        ? tokens.map((token, index) => (
            <span key={index} className={`tok-${token.type}`}>
              {token.value}
            </span>
          ))
        : text}
    </pre>
  );
}
