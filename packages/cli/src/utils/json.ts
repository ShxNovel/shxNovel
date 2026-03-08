/**
 * JSON 序列化工具
 * 支持根据环境控制输出格式
 */

/**
 * 检测是否为开发模式
 */
function isDevMode(): boolean {
    return process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'prod';
}

/**
 * JSON 序列化配置
 */
export interface JsonStringifyOptions {
    space?: string | number;
    indent?: number;
}

/**
 * JSON 序列化
 * @param obj 要序列化的对象
 * @param options 配置选项
 * @returns JSON 字符串
 */
export function jsonStringify<T = any>(
    obj: T,
    options: JsonStringifyOptions = {}
): string {
    const { space, indent } = options;

    // 如果明确指定了 space，使用指定的值
    if (space !== undefined) {
        return JSON.stringify(obj, null, space);
    }

    // 开发模式使用缩进，生产模式不使用
    if (isDevMode()) {
        const indentSpaces = indent ?? 2;
        return JSON.stringify(obj, null, indentSpaces);
    }

    // 生产模式不使用缩进
    return JSON.stringify(obj);
}

/**
 * 紧凑的 JSON 序列化（不使用缩进，单行输出）
 * @param obj 要序列化的对象
 * @returns JSON 字符串（单行）
 */
export function jsonStringifyCompact<T = any>(obj: T): string {
    return JSON.stringify(obj);
}

/**
 * 格式化的 JSON 序列化（使用缩进，多行输出）
 * @param obj 要序列化的对象
 * @param indent 缩进空格数，默认 2
 * @returns JSON 字符串（多行）
 */
export function jsonStringifyFormatted<T = any>(
    obj: T,
    indent: number = 2
): string {
    return JSON.stringify(obj, null, indent);
}
