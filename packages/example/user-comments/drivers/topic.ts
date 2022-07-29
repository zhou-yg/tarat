import {
  compose,
  computed,
  progress,
  state,
  connectCreate,
} from 'tarat-core'
import _topic from './compose/topic'

export default function topic () {

  const r = compose(_topic)

  connectCreate(r.topics, () => ({
    
  }))

  return {
    ...r
  }
}
/*--tarat deps start--*/
const deps = {}

/*--tarat deps end--*/
