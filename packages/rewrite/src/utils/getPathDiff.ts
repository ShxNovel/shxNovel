export function getPathDiff(base: string, target: string): string {
    // 确保 base 以斜杠结尾，这样截取后的结果就不会带开头的斜杠
    const normalizedBase = base.endsWith('\\') || base.endsWith('/') ? base : base + '\\';

    if (target.startsWith(normalizedBase)) {
        return target.slice(normalizedBase.length);
    }

    return ''; // 如果前缀不匹配
}
