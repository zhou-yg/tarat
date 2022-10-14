import {
  inputCompute,
  inputComputeInServer,
  prisma,
  state,
  writePrisma
} from 'tarat/core'

export default function single() {
  const name = state('init')
  return {
    name
  }
}
