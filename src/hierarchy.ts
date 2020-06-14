export interface Node {
    hash: string;
    hashSource: string;
    text?: string;
    children?: Node[];
    parent?: Node;
}
