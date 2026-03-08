export interface BranchIR {
    type: 'branch';
    cond: string;

    ENDFLAG: string;

    targets: {
        [result: string]: string;
    }

    meta?: Record<string, any>;
}