import { TextOp } from "@shxnovel/schema";
import { InitLinkText, LinkText, TextUnit } from "./types";
import { GlobalStory } from "../rewrite-ctx";


export function character(name: string | null, quote?: boolean): InitLinkText;
export function character(quote: boolean): InitLinkText;

export function character(name: string | boolean | null, quote?: boolean): InitLinkText {

    let nameStr: string | null = null;
    let quoteBool: boolean = false;

    if (typeof name === 'string') {
        nameStr = name;
        quoteBool = quote ?? true;
    } else if (typeof name === 'boolean') {
        nameStr = null;
        quoteBool = name;
    } else {
        nameStr = name;
        quoteBool = quote ?? false;
    }

    function init(some?: TemplateStringsArray, ...values: TextOp[]): LinkText {

        const cache = GlobalStory;

        const content: TextOp[] = [];

        const talk: TextUnit = { type: 'text', name: nameStr, quote: quoteBool, content };

        cache.push(talk);

        const link = CreateLink(content);

        if (!some) return link;

        return link(some, ...values);
    }

    init.useQuote = (quote_: boolean): InitLinkText => {
        return character(nameStr, quote_);
    };

    return init as InitLinkText;
}

const TextMethodsImpl = {

    pause(ms: number): TextOp {
        return { kind: 'wait', ms };
    },

    fast(text: string): TextOp {
        return { kind: 'fast', text };
    }

};

function bindContent(methods: Record<string, (...args: any[]) => TextOp>, content: TextOp[]) {
    const bound: Record<string, (...args: any[]) => void> = {};
    for (const key in methods) {
        bound[key] = (...args: any[]) => {
            content.push(methods[key](...args));
        };
    }
    return bound;
}

function addChainableMethods(methods: Record<string, (...args: any[]) => void>) {
    return (fn: any) => {
        for (const key in methods) {
            fn[key] = (...args: any[]) => {
                methods[key](...args);
                return fn;
            };
        }
        return fn;
    };
}

function CreateLink(content: TextOp[]): LinkText {

    function link(some: TemplateStringsArray, ...values: TextOp[]) {
        const len = some.length;
        content.push(some[0]);
        for (let i = 1; i < len; i++) {
            content.push(values[i - 1]);
            content.push(some[i]);
        }
        return link as LinkText;
    }

    const methods = bindContent(TextMethodsImpl, content);

    return addChainableMethods(methods)(link) as LinkText;
}
