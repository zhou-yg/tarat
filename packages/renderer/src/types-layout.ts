/**
 * 
 * some type utility functions
 * 
 */
export interface LayoutStructTree {
  readonly type: string
  readonly children?: readonly LayoutStructTree[]
  readonly value?: any
}

/**
 * explicity convert layout tree to layout tree draft
 */

export type ConvertToLayoutTreeDraft<T extends LayoutStructTree, Keys extends unknown[] = []> = {
  [K in T['type']]: T['children'] extends unknown[]
    ? {} extends ConvertToLayoutTreeDraft<T['children'][number], [...Keys, K]>
      ? never
      : readonly [...Keys, K] & ConvertToLayoutTreeDraft<T['children'][number], [...Keys, K]>
    : readonly [...Keys, K]
}

type InternalGenArr<ArrLen, ResultArr extends number[]> = ResultArr['length'] extends ArrLen ? ResultArr : InternalGenArr<ArrLen, [0, ...ResultArr]>
type GenArr<ArrLen extends number> = ArrLen extends number ? InternalGenArr<ArrLen, []> : []

type PlusOne<a extends number> = [...GenArr<a>, 0]['length']

export type ShallowCopyArray<T extends readonly unknown[], I extends number = 0, Result extends readonly unknown[] = []> = 
  I extends T['length']
    ? Result
    : PlusOne<I> extends number
      ? ShallowCopyArray<T, PlusOne<I>, readonly [...Result, T[I]]>
      : never

/**
 * patch cmd to struct
 */

const a = {
  type: 'a',
  arr: [1,2],
  child: { k : 'v'}
} as const

export interface PatchCommand {
  readonly op: 'addChild' | 'removeChild' | 'replaceChild',
  readonly parent: readonly LayoutStructTree['type'][]
  readonly child: {
    readonly type: string
    readonly value?: any
  }
}

export type Assign<U, T> = Omit<U, keyof T> & T

export type RemoveItem<Children extends LayoutStructTree['children'], child extends LayoutStructTree> =
  Children extends readonly [infer First, ...infer Rest]
    ? First extends child
      ? Rest extends []
        ? []
        : Rest extends LayoutStructTree['children'] ? RemoveItem<Rest, child> : []
      : Rest extends LayoutStructTree['children'] ? readonly [First, ...RemoveItem<Rest, child>] : []
    : []


export type DoPatchCommand<T extends LayoutStructTree, Cmd extends PatchCommand> =
  Cmd['op'] extends 'addChild'
    ? T['children'] extends LayoutStructTree['children']
      ? Assign<T, { readonly children: readonly [...T['children'], Cmd['child']] }>
      : Assign<T, { readonly children: readonly [Cmd['child']] }>
    : Cmd['op'] extends 'removeChild'
      ? Assign<T, { readonly children: RemoveItem<T['children'], Cmd['child']> }>
      : Cmd['op'] extends 'replaceChild'
        ? Cmd['child']
        : never

type PatchToLayoutChildren<T extends LayoutStructTree['children'], Cmd extends PatchCommand> =
  T extends readonly [infer FirstChild, ...infer RestChildren]
    ? FirstChild extends LayoutStructTree 
      ? RestChildren extends LayoutStructTree['children']
        ? readonly [PatchLayout<FirstChild, Cmd>, ...PatchToLayoutChildren<RestChildren, Cmd>]
        : never
      : never
    : T

export type PatchLayout<T extends LayoutStructTree, Cmd extends PatchCommand> = 
  Cmd['parent'] extends readonly [infer First, ...infer Rest]
    ? Rest extends []
      ? T extends { type: First } 
        ? DoPatchCommand<T, Cmd>
        : never
      : Rest extends PatchCommand['parent']
        ? Assign<T, { readonly children: PatchToLayoutChildren<T['children'], Assign<Cmd, { parent: Rest }>> }>
        : never
    : T;

export type PrintLayoutStructTree<T> = {
  [P in keyof T]: 
    T[P] extends [infer First, ...infer Rest]
      ? [
          {
            [P2 in keyof First]: First[P2]
          },
          ...PrintLayoutStructTree<Rest>
        ]
      : T[P] extends readonly [infer First, ...infer Rest]
        ? readonly [
            {
              [P2 in keyof First]: First[P2]
            },
            ...PrintLayoutStructTree<Rest>
          ] 
        : T[P] extends []
          ? []
          : T[P] extends Record<string, unknown>
            ? {} extends T[P]
              ? {}
              : {
                  [P2 in keyof T[P]]: T[P][P2]
                }
            : T[P]
}

export type PrintObjectLike<T> = 
  T extends [infer First, ...infer Rest]
    ? First extends Record<string, unknown>
      ? Rest extends unknown[]
        ? [PrintLayoutStructTree<First>, ...PrintObjectLike<Rest>]
        : Rest extends []
          ? [PrintLayoutStructTree<First>]
          : never
      : never
    : T extends Record<string, unknown>
      ? {} extends T
        ? {}
        : PrintLayoutStructTree<T>
      : T

/**
 * module extend
 */

export type MergedPatchCommandsToModule<Props, L extends LayoutStructTree , P1 extends readonly any[], P2 extends readonly any[]>= {
  patchLayout: (props: Props, jsonTree: ConvertToLayoutTreeDraft<L>) => readonly [...P1, ...P2]
}
