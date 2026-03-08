import { ChapterUnit } from "./chapter";

export class RewriteCxt {
    chapters: Map<string, ChapterUnit[]> = new Map();

    now: ChapterUnit[] = [];

    newChapter(name: string) {
        if (name === '') {
            throw new Error('Chapter name cannot be empty');
        }

        if (this.chapters.has(name)) {
            throw new Error(`Chapter ${name} already exists`);
        }

        this.now = [];

        return this.chapters.set(name, this.now);
    }

    push(unit: ChapterUnit) {
        this.now.push(unit);
    }
}

export const GlobalStory = new RewriteCxt();
