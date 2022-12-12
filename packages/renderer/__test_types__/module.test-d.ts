import { expectType } from 'tsd'

import { MergedPatchCommandsToModule, PrintLayoutStructTree, TransformToLayoutTreeDraft } from '../src/index'

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
  patchLayout: (props: Props, jsonTree: TransformToLayoutTreeDraft<L>) => {
    return [] as const
  }
})


