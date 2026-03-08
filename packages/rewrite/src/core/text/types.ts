import { TextOp } from '@shxnovel/schema';
import { CleanFunction } from '../../utils';

/**
 * [Rewrite internal IR type]
 */
export interface TextUnit {
    type: 'text';
    name: string | null;
    quote: boolean;
    content: TextOp[];
    meta?: Record<string, any>;
}

/**
 * LinkText type definition
 */

export type LinkText = CleanFunction<_LinkText>;

type _LinkTextFn = (some?: TemplateStringsArray, ...values: TextOp[]) => LinkText;

type _LinkText = _LinkTextFn & TextMethods;

export interface TextMethods {
    /**
     * @param ms The duration of the pause in milliseconds
     */
    pause(ms: number): LinkText;

    /**
     * @param str The string content to be displayed
     */
    fast(str: string): LinkText;
}

// /* Before initialization */

export type InitLinkText = CleanFunction<_InitLinkText>;

type _InitLinkText = _LinkTextFn & InitTextMethod;

export interface InitTextMethod {
    /** @param quote show quote */
    useQuote: (quote: boolean) => InitLinkText;
}