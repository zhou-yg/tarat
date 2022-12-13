import { expectType } from 'tsd'

import { MergedPatchCommandsToModule, PrintLayoutStructTree, PrintObjectLike, ConvertToLayoutTreeDraft, ShallowCopyArray } from '../src/index'

type Props = {

}
type L = {
  type: 'div',
  children: [
    {
      type: 'p',
    },
  ]
}

type O1 = MergedPatchCommandsToModule<{}, L, [], []>

expectType<O1>({
  patchLayout: (props: Props, jsonTree: ConvertToLayoutTreeDraft<L>) => {
    return [] as const
  }
})


// convert

type LT = {
  type: 'div';
  readonly children: readonly [{
      type: 'div';
  }, {
      readonly type: "p";
  }];
}

type LTNested = ConvertToLayoutTreeDraft<LT>
type LT2Layer = LTNested['div']


type MyTransformLayoutTree = {
  type: 'div',
  children: [
    {
      type: 'div',
      children: [
        {
          type: 'p'
        }
      ]
    }
  ]
}

type TreeWithIntersectionPath = {
  div: readonly ['div'] & {
    div: readonly ['div', 'div'] & {
      p: readonly ['div', 'div', 'p']
    }
  }
}

const firstPath = ['div'] as const
const secondPath = ['div', 'div'] as const
const thirdPath = ['div', 'div', 'p'] as const
const treeWithPaths = {
  div: Object.assign(firstPath, {
    div: Object.assign(secondPath, {
      p: thirdPath
    })
  })
}

type NestedTransformType = ConvertToLayoutTreeDraft<MyTransformLayoutTree>
type NestedTransformTypeDisplay = PrintLayoutStructTree<NestedTransformType>

type display = NestedTransformType['div']

type vvR = NestedTransformType['div'] extends readonly string[] ? true : false
type vvR2 = NestedTransformType['div'] extends { [k: string]: readonly string[] } ? true : false // invalid because the target has multiple keys including Array

type keys2 = keyof NestedTransformType['div']

type keysV = PrintObjectLike<keys2>

type KS = {
  div: ['a', 'b']
}
type vvR3 = KS extends { [k: string]: readonly string[] } ? true : false

expectType<NestedTransformType>(treeWithPaths)
expectType<NestedTransformType['div']>(
  Object.assign(['div'] as const, { 
      div: Object.assign(['div', 'div'] as const, {
        p: ['div', 'div', 'p'] as const
      })
  })
)


// pick back

type PB = readonly ['div'] & { div: 2 }
type PB2 = readonly ['div', 'p'] & { div: 2 }

type PBV = PB2[ 0 extends string ? 0 : 1 ]

type vpb = PB2 extends readonly [infer F, ...infer R] ? [F, ...R] : never

type PickBack1 = ShallowCopyArray<NestedTransformType['div']>
type PickBack2 = ShallowCopyArray<NestedTransformType['div']['div']>

expectType<PickBack1>(['div'] as const)
expectType<PickBack2>(['div', 'div'] as const)


type a = 0 | 1 | 2

type c = {
  [k in a]: k
}

type CC = a extends infer A | [] ? A : false
type CC0 = CC extends infer B | [number] ? B : false

type CC1 = Extract<CC, [number]>

type CMD = [] | [{ type: 'div' }] | [{ type: 'p' }]


type b = 0

type vv = [] extends CMD ? true : false

type AA = {
  div?: {
    div: ['div', 'div']
  }
}

const aa: AA = {
}

const parent = [...aa.div.div] as const
type pt = typeof parent