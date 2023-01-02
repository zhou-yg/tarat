// import { expectType } from 'tsd'

// import {
//   PrintLayoutStructTree,
//   ConvertToLayoutTreeDraft,
//   h2
// } from '../src/index'

// // v value

// const nodeSpan = h2('span', {}, h2('text'))

// type NS = typeof nodeSpan
// type NSDisplay = PrintLayoutStructTree<NS>

// const nodeP = h2('p')
// type NP = typeof nodeP
// type NPDisplay = PrintLayoutStructTree<NP>

// const nodeDiv = h2('div', {}, 1 as const, nodeP)
// type ND = typeof nodeDiv
// type NDDisplay = PrintLayoutStructTree<ND['children'][1]> // BaseType

// type NodeDivType = typeof nodeDiv
// type NodeDivTypeDraft = ConvertToLayoutTreeDraft<NodeDivType>

// expectType<NodeDivTypeDraft>({
//   div: Object.assign(['div'] as const, {
//     p: ['div', 'p'] as const
//   })
// })
