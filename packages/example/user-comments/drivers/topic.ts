import {
  compose,
  computed,
  progress,
  state,
} from 'tarat-core'
import _topic from './compose/topic'

export default function topic () {

  const r = compose(_topic)

  return {
    ...r
  }
}
/*--tarat deps start--*/
const deps = {}

/*--tarat deps end--*/
