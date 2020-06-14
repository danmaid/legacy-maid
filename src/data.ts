export interface Node {
    hash: string;
    hashSource: string;
    text?: string;
    children?: Node[] | string[];
    parent?: Node | string;
}

export async function getHash(text: string) {
    const data = new TextEncoder().encode(text)
    const buffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(buffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
}
