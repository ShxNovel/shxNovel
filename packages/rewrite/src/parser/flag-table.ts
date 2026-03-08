type Where = string | undefined;

class FlagTable {
    table = new Map<string, Where>();

    shouldTabel = new Map<string, Where>();

    add(flag: string, where: Where) {
        if (this.table.has(flag)) {
            const place = this.table.get(flag);
            throw new Error(`Flag "${flag}" already exists: ${place} <-- ${where}(this)`);
        }
        this.table.set(flag, where);
    }

    addShould(flag: string, where: Where) {
        this.shouldTabel.set(flag, where);
    }

    check() {
        for (const [flag, _where] of this.shouldTabel) {
            if (!this.table.has(flag)) {
                throw new Error(`Flag "${flag}" is in shouldTabel but not in table`);
            }
        }
    }
}
export const flagTable = new FlagTable();
