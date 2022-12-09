/**
 * 
 * some type utility functions
 * 
 */

 export interface LayoutStructTree {
  type: string
  children?: LayoutStructTree[]
}

/**
 * explicity convert layout tree to layout tree draft
 */
type MyLayoutTree = {
  type: 'div',
  children: [
    {
      type: 'div',
    },
    {
      type: 'div',
    },
    {
      type: 'p'
    }
  ]
}

type TargetResult = {
  div: {
    div: {}
  }
}

type r =  TransformToLayoutTreeDraft<MyLayoutTree>
type r2 = PrintLayoutStructTree<r>

export type TransformToLayoutTreeDraft<T extends LayoutStructTree> = {
  [K in T['type']]: T['children'] extends any[] ? TransformToLayoutTreeDraft<T['children'][number]> : {}
}


/**
 * patch cmd to struct
 */

interface Command {
  op: 'addChild' | 'removeChild' | 'replaceChild',
  parent: LayoutStructTree['type'][]
  child: LayoutStructTree
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


export type DoCommand<T extends LayoutStructTree, Cmd extends Command> =
  Cmd['op'] extends 'addChild'
    ? T['children'] extends LayoutStructTree['children']
      ? Assign<T, { children: [...T['children'], Cmd['child']] }>
      : Assign<T, { children: [Cmd['child']] }>
    : Cmd['op'] extends 'removeChild'
      ? Assign<T, { children: RemoveItem<T['children'], Cmd['child']> }>
      : Cmd['op'] extends 'replaceChild'
        ? Cmd['child']
        : never

type PatchToLayoutChildren<T extends LayoutStructTree['children'], Cmd extends Command> =
  T extends [infer FirstChild, ...infer RestChildren]
    ? FirstChild extends LayoutStructTree 
      ? RestChildren extends LayoutStructTree['children']
        ? [PatchLayout<FirstChild, Cmd>, ...PatchToLayoutChildren<RestChildren, Cmd>]
        : never
      : never
    : T

export type PatchLayout<T extends LayoutStructTree, Cmd extends Command> = 
  Cmd['parent'] extends [infer First, ...infer Rest]
    ? Rest extends []
      ? T extends { type: First } 
        ? DoCommand<T, Cmd>
        : never
      : Rest extends Command['parent']
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
      : T[P] extends object
        ? T[P] extends []
          ? []
          : {} extends T[P]
            ? { a: 1 }
            : {
                [P2 in keyof T[P]]: T[P][P2]
              }
        : T[P]
}
