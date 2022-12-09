import { expectType } from 'tsd'
import {
  Assign, DoCommand, PatchLayout, PrintLayoutStructTree,
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

type DoCommandV1 = DoCommand<MyLayoutTree, { op: 'addChild', parent: [], child: { type: 'p' } }>
type DoCommandV1Display = PrintLayoutStructTree<DoCommandV1>
expectType<DoCommandV1Display>({
  type: 'div',
  children: [
    { type: 'div' },
    { type: 'p' }
  ]
})

type DoCommandV2 = DoCommand<MyLayoutTree, { op: 'removeChild', parent: [], child: { type: 'div' } }>
type DoCommandV2Display = PrintLayoutStructTree<DoCommandV2>
expectType<DoCommandV2Display>({
  type: 'div',
  children: []
})

type DoCommandV3 = DoCommand<MyLayoutTree, { op: 'replaceChild', parent: [], child: { type: 'p' } }>
type DoCommandV3Display = PrintLayoutStructTree<DoCommandV3>
expectType<DoCommandV3Display>({
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
    div: {}
  }
})

type TransformV2 = TransformToLayoutTreeDraft<MyTransformLayoutTree2>
type TransformV2Display = PrintLayoutStructTree<TransformV2>
expectType<TransformV2Display>({
  div: {
    div: {},
    p: {}
  }
})