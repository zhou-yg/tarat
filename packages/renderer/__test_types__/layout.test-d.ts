import { expectType } from 'tsd'
import {
  Assign, DoPatchCommand, PatchLayout, PrintLayoutStructTree,
  RemoveItem,
  TransformToLayoutTreeDraft,

} from '../src/types-layout'

// assign

type AssignV1 = Assign<{ a:1 }, { b: 2 }>
type AssignV1Display = PrintLayoutStructTree<AssignV1>

expectType<AssignV1Display>({ a:1, b:2 })

type AssignV2 = Assign<{ a: 0 }, { a:1 }>
type AssignV2Display = PrintLayoutStructTree<AssignV2>
expectType<AssignV2Display>({ a:1 })

// remove item
type Items = [
  {
    type: 'div'
  },
  {
    type: 'div',
  },
  {
    type: 'p'
  }
]
type RemoveItemV1 = RemoveItem<Items, { type: 'div' }>
expectType<RemoveItemV1>([{ type: 'p' }])

type RemoveItemV2 = RemoveItem<Items, { type: 'p' }>
expectType<RemoveItemV2>([{ type: 'div' }, { type: 'div' }])


// do command
type MyLayoutTree = {
  type: 'div',
  children: [
    {
      type: 'div',
    }
  ]
}

const addOp = { op: 'addChild', parent: [], child: { type: 'p' } } as const
type AddOp = typeof addOp

type DoPatchCommandV1 = DoPatchCommand<MyLayoutTree, AddOp>
type DoPatchCommandV1Display = PrintLayoutStructTree<DoPatchCommandV1>
expectType<DoPatchCommandV1Display>({
  type: 'div',
  children: [
    { type: 'div' },
    { type: 'p' } as const // @TODO here looks like a bug
  ]
})

type DoPatchCommandV2 = DoPatchCommand<MyLayoutTree, { op: 'removeChild', parent: [], child: { type: 'div' } }>
type DoPatchCommandV2Display = PrintLayoutStructTree<DoPatchCommandV2>
expectType<DoPatchCommandV2Display>({
  type: 'div',
  children: []
})

type DoPatchCommandV3 = DoPatchCommand<MyLayoutTree, { op: 'replaceChild', parent: [], child: { type: 'p' } }>
type DoPatchCommandV3Display = PrintLayoutStructTree<DoPatchCommandV3>
expectType<DoPatchCommandV3Display>({
  type: 'p'
})

// key point: PatchLayout

type PatchLayoutV1 = PatchLayout<MyLayoutTree, { op: 'addChild', parent: ['div'], child: { type: 'div', children: [] } }>
type PatchLayoutV1Display = PrintLayoutStructTree<PatchLayoutV1>
expectType<PatchLayoutV1Display>({
  type: 'div',
  children: [
    {
      type: 'div',
    },
    {
      type: 'div',
      children: []
    },
  ]
})

type PatchLayoutV2 = PatchLayout<PatchLayoutV1, { op: 'addChild', parent: ['div', 'div'], child: { type: 'p' } }>
type PatchLayoutV2Display = PrintLayoutStructTree<PatchLayoutV2>
expectType<PatchLayoutV2Display>({
  type: 'div',
  children: [
    {
      type: 'div',
      children: [
        {
          type: 'p'
        }
      ]
    },
    {
      type: 'div',
      children: [
        {
          type: 'p'
        }
      ]
    },
  ]
})

type PatchLayoutV3 = PatchLayout<PatchLayoutV2, { op: 'removeChild', parent: ['div', 'div'], child: { type: 'p' } }>
type PatchLayoutV3Display = PrintLayoutStructTree<PatchLayoutV3>
expectType<PatchLayoutV3Display>({
  type: 'div',
  children: [
    {
      type: 'div',
      children: [],
    },
    {
      type: 'div',
      children: [],
    }
  ]
})

type PatchLayoutV4 = PatchLayout<PatchLayoutV3, { op: 'replaceChild', parent: ['div', 'div'], child: { type: 'p' } }>
type PatchLayoutV4Display = PrintLayoutStructTree<PatchLayoutV4>
expectType<PatchLayoutV4Display>({
  type: 'div',
  children: [
    {
      type: 'p',
    },
    {
      type: 'p'
    }
  ]
})


// transform

type MyTransformLayoutTree = {
  type: 'div',
  children: [
    {
      type: 'div',
    }
  ]
}
type MyTransformLayoutTree2 = {
  type: 'div',
  children: [
    {
      type: 'div',
    },
    {
      type: 'p'
    },
    {
      type: 'div'
    }
  ]
}

type TransformV1 = TransformToLayoutTreeDraft<MyTransformLayoutTree>
type TransformV1Display = PrintLayoutStructTree<TransformV1>
expectType<TransformV1Display>({
  div: {
    div: {
      paths: ['div', 'div']
    }
  }
})

type TransformV2 = TransformToLayoutTreeDraft<MyTransformLayoutTree2>
type TransformV2Display = PrintLayoutStructTree<TransformV2>
expectType<TransformV2Display>({
  div: {
    div: {
      paths: ['div', 'div']
    },
    p: {
      paths: ['div', 'p']
    }
  }
})