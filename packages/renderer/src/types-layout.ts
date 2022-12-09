/**
 * 
 * some type utility functions
 * 
 */

 export interface LayoutJSONTree {
  type: string
  children?: LayoutJSONTree[]
}

interface Command {
  op: 'addChild' | 'removeChild' | 'replaceChild',
  parent: LayoutJSONTree['type'][]
  child: LayoutJSONTree
}

export type Assign<U, T> = Omit<U, keyof T> & T

export type RemoveItem<Children extends LayoutJSONTree['children'], child extends LayoutJSONTree> =
  Children extends [infer First, ...infer Rest]
    ? First extends child
      ? Rest extends []
        ? []
        : Rest extends LayoutJSONTree['children'] ? RemoveItem<Rest, child> : []
      : Rest extends LayoutJSONTree['children'] ? [First, ...RemoveItem<Rest, child>] : []
    : []


export type DoCommand<T extends LayoutJSONTree, Cmd extends Command> =
  Cmd['op'] extends 'addChild'
    ? T['children'] extends LayoutJSONTree['children']
      ? Assign<T, { children: [...T['children'], Cmd['child']] }>
      : Assign<T, { children: [Cmd['child']] }>
    : Cmd['op'] extends 'removeChild'
      ? Assign<T, { children: RemoveItem<T['children'], Cmd['child']> }>
      : Cmd['op'] extends 'replaceChild'
        ? Cmd['child']
        : never

type PatchToLayoutChildren<T extends LayoutJSONTree['children'], Cmd extends Command> =
  T extends [infer FirstChild, ...infer RestChildren]
    ? FirstChild extends LayoutJSONTree 
      ? RestChildren extends LayoutJSONTree['children']
        ? [PatchLayout<FirstChild, Cmd>, ...PatchToLayoutChildren<RestChildren, Cmd>]
        : never
      : never
    : T

export type PatchLayout<T extends LayoutJSONTree, Cmd extends Command> = 
  Cmd['parent'] extends [infer First, ...infer Rest]
    ? Rest extends []
      ? T extends { type: First } 
        ? DoCommand<T, Cmd>
        : never
      : Rest extends Command['parent']
        ? Assign<T, { children: PatchToLayoutChildren<T['children'], Assign<Cmd, { parent: Rest }>> }>
        : never
    : T;

export type PrintLayoutJSONTree<T> = {
  [P in keyof T]: 
    T[P] extends [infer First, ...infer Rest]
      ? [
          {
            [P2 in keyof First]: First[P2]
          },
          ...PrintLayoutJSONTree<Rest>
        ]
      : T[P] extends object
        ? T[P] extends []
          ? []
          : {
              [P2 in keyof T[P]]: T[P][P2]
            }
        : T[P]
}
