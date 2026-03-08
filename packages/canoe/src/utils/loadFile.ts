export function loadFile(url: string) {
    return fetch(url);
}

export async function loadJson<T = any>(url: string): Promise<T> {
    const req = await fetch(url);
    return await req.json();
}
