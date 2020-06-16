import * as XLSX from 'xlsx'
import { Node, getHash } from './data'

export type NodeRow = Node & { number: number }
type Row = { number: number; cells: Cell[] }
type Cell = { addr: XLSX.CellAddress; value: XLSX.CellObject }

export function numToAlpha(num: number) {
    let alpha = ''
    for (; num >= 0; num = num / 26 - 1) {
        alpha = String.fromCharCode(num % 26 + 0x41) + alpha;
    }
    return alpha;
}

export function getAlphaList(start: number, end: number): string[] {
    const arr: string[] = []
    for (let i = start; i <= end; i++) {
        arr.push(numToAlpha(i))
    }
    return arr
}

/**
 * Excelシートから行を取得する。
 */
export function getRows(sheet: XLSX.Sheet, range: XLSX.Range): Row[] {
    const result = Object.entries(sheet)
        .map(([key, value]): Cell => ({
            addr: XLSX.utils.decode_cell(key),
            value: value
        }))
        .filter(({ addr, value }) =>
            range.s.r <= addr.r && addr.r <= range.e.r &&
            range.s.c <= addr.c && addr.c <= range.e.c &&
            value.t !== 'z'
        )
        .sort((a, b) => {
            if (a.addr.r > b.addr.r) return 1
            if (a.addr.r < b.addr.r) return 1
            return a.addr.c - b.addr.c
        })
        .reduce((acc: Row[], c: Cell, i, arr) => {
            const prev = arr[i - 1]
            if (prev && prev.addr.r === c.addr.r) {
                acc[acc.length - 1].cells.push(c)
            } else {
                acc.push({ number: c.addr.r, cells: [c] })
            }
            return acc
        }, [])
    console.log(result)
    return result
}

/**
 * Excelシートからデータ行を取得する。
 */
export async function getItemRows(
    sheet: XLSX.Sheet,
    options: { columns: Array<number>; rowMin: number; rowMax: number }
): Promise<NodeRow[]> {
    const { columns, rowMin, rowMax } = options
    const range: XLSX.Range = {
        s: { r: rowMin, c: Math.min(...columns) },
        e: { r: rowMax, c: Math.max(...columns) }
    }
    const rows: Row[] = getRows(sheet, range)
    const result: NodeRow[] = await Promise.all(rows.map(
        async ({ number, cells }): Promise<NodeRow> => {
            const text = cells.map(v => v.value.w).join('')
            const hash = await getHash(text)
            return { number, text, hashSource: text, hash }
        }
    ))
    console.log(result)
    return result
}

export async function getHierarchy(
    sheet: XLSX.Sheet,
    options: { columns: Array<number>; rowMin: number; rowMax: number }
): Promise<Node[]> {
    const { columns, rowMin, rowMax } = options
    const range: XLSX.Range = {
        s: { r: rowMin, c: Math.min(...columns) },
        e: { r: rowMax, c: Math.max(...columns) }
    }
    type Row = { column: number; text?: string }
    const rows: Row[] = getRows(sheet, range).map(v => ({
        column: v.cells[0].addr.c,
        text: v.cells[0].value.w
    }))
    console.log('rows', rows)
    async function build(arr: Row[], parent?: Node, column = -1): Promise<Node[]> {
        const result = []
        while (arr.length > 0) {
            const row = arr.shift()
            if (!row) continue
            const hashSource = parent
                ? [parent.hashSource, row.text].join(' - ')
                : '' + row.text
            const node = { text: row.text, hashSource, hash: await getHash(hashSource) }
            if (column < row.column) { // row is child
                const children = await build(arr, node, row.column)
                children.length > 0
                    ? result.push({ ...node, children })
                    : result.push(node)
            } else {
                arr.unshift(row)
                return result
            }
        }
        return result
    }
    const result = await build(rows)
    console.log(result)
    return result
}

export async function getHierarchyRows(
    sheet: XLSX.Sheet,
    options: { columns: Array<number>; rowMin: number; rowMax: number }
): Promise<NodeRow[]> {
    const { columns, rowMin, rowMax } = options
    const range: XLSX.Range = {
        s: { r: rowMin, c: Math.min(...columns) },
        e: { r: rowMax, c: Math.max(...columns) }
    }
    type Row = { column: number; text?: string; number: number }
    const rows: Row[] = getRows(sheet, range).map(v => ({
        column: v.cells[0].addr.c,
        text: v.cells[0].value.w,
        number: v.number
    }))
    console.log('rows', rows)
    async function build(arr: Row[], parent?: Node, column = -1): Promise<NodeRow[]> {
        const result = []
        while (arr.length > 0) {
            const row = arr.shift()
            if (!row) continue
            const hashSource = parent
                ? [parent.hashSource, row.text].join(' - ')
                : '' + row.text
            const node = { number: row.number, text: row.text, hashSource, hash: await getHash(hashSource) }
            if (column < row.column) { // row is child
                result.push(node)
                result.push(...await build(arr, node, row.column))
            } else {
                arr.unshift(row)
                return result
            }
        }
        return result
    }
    const result = await build(rows)
    console.log(result)
    return result
}