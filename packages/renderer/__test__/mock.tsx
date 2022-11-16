/* @jsxFactory h  */
import { h, useLayout, useLogic } from '../src/index'
import { SingleFileModule } from '../src/types'

export const MockRectFramework = {
  name: 'react',
  lib: {
    createElement: h,
    useRef: (v = null) => ({ current: v }),
    useState: (v = undefined) => [v, () => {}],
    useEffect: () => {}
  }
}

export function simpleModule(): SingleFileModule {
  return {
    logic() {
      return {}
    },
    layout() {
      return <div></div>
    }
  }
}

export function layoutUseLogic(): SingleFileModule {
  return {
    logic() {
      return { num: 1 }
    },
    layout(props: { name: string }) {
      const logic = useLogic<{ num: number }>()
      return <div name={props.name}>{logic.num}</div>
    }
  }
}

export function useStyleInLayout(): SingleFileModule {
  return {
    logic() {
      return { num: 1 }
    },
    layout(props: { name: string }) {
      const logic = useLogic<{ num: number }>()
      return <div name={props.name}><span>{logic.num}</span></div>
    },
    style(props: { name: string }) {
      const root = useLayout()
      root.div.props.style = {
        color: 'red'
      }
    },
  }
}
