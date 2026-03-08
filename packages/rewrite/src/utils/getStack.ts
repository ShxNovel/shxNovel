export const getStack = (fn: Function, dep = 1) => {
    const err = { stack: '' };

    Error.captureStackTrace(err, fn);

    const stack = err.stack as string;

    const stackLines = stack.split("\n");

    const callerLine = stackLines[dep] || "";

    const regex = /at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/;

    const match = callerLine.match(regex);

    return match ? `${match[2]}:${match[3]}:${match[4]}` : "";
};
