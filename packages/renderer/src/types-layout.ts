/**
 * 
 * some type utility functions
 * 
 */
export interface LayoutStructTree {
  type: string
  children?: LayoutStructTree[]
  value?: any
}

/**
 * explicity convert layout tree to layout tree draft
 */
export type TransformToLayoutTreeDraft<T extends LayoutStructTree, Keys extends unknown[] = []> = {
  [K in T['type']]: T['children'] extends any[]
    ? TransformToLayoutTreeDraft<T['children'][number], [...Keys, K]>
    : { paths: [...Keys, K]  }
}


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
  Children extends [infer First, ...infer Rest]
    ? First extends child
      ? Rest extends []
        ? []
        : Rest extends LayoutStructTree['children'] ? RemoveItem<Rest, child> : []
      : Rest extends LayoutStructTree['children'] ? [First, ...RemoveItem<Rest, child>] : []
    : []


export type DoPatchCommand<T extends LayoutStructTree, Cmd extends PatchCommand> =
  Cmd['op'] extends 'addChild'
    ? T['children'] extends LayoutStructTree['children']
      ? Assign<T, { children: [...T['children'], Cmd['child']] }>
      : Assign<T, { children: [Cmd['child']] }>
    : Cmd['op'] extends 'removeChild'
      ? Assign<T, { children: RemoveItem<T['children'], Cmd['child']> }>
      : Cmd['op'] extends 'replaceChild'
        ? Cmd['child']
        : never

type PatchToLayoutChildren<T extends LayoutStructTree['children'], Cmd extends PatchCommand> =
  T extends [infer FirstChild, ...infer RestChildren]
    ? FirstChild extends LayoutStructTree 
      ? RestChildren extends LayoutStructTree['children']
        ? [PatchLayout<FirstChild, Cmd>, ...PatchToLayoutChildren<RestChildren, Cmd>]
        : never
      : never
    : T

export type PatchLayout<T extends LayoutStructTree, Cmd extends PatchCommand> = 
  Cmd['parent'] extends [infer First, ...infer Rest]
    ? Rest extends []
      ? T extends { type: First } 
        ? DoPatchCommand<T, Cmd>
        : never
      : Rest extends PatchCommand['parent']
        ? Assign<T, { children: PatchToLayoutChildren<T['children'], Assign<Cmd, { parent: Rest }>> }>
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

/**
 * module extend
 */

export type MergedPatchCommandsToModule<Props, L extends LayoutStructTree , P1 extends readonly any[], P2 extends readonly any[]>= {
  patchLayout: (props: Props, jsonTree: TransformToLayoutTreeDraft<L>) => readonly [...P1, ...P2]
}
