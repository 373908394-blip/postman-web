let counter = 0;

/** 生成足够唯一的本地 id（无需引入 uuid 依赖）。 */
export const uid = (prefix = 'id'): string => {
  counter = (counter + 1) % 1000;
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
};

export const now = (): number => Date.now();
