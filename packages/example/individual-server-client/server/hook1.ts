import {
  state
} from '@tarot-run/core'

export default function hook1 () {
  const s1 = state(1)

  return {
    s1
  }
}