import {
  applyJSONTreePatches,
  buildLayoutNestedObj,
  JSONPatch,
  VirtualLayoutJSON,
  proxyLayoutJSON,
} from '../../src'

describe('utils', () => {

  it('buildLayoutNestedObj', () => {
    const json: VirtualLayoutJSON = {
      id: 1,
      tag: 'div',
      props: {
        id: 'root'
      },
      children: [
        {
          id: 0,
          tag: 'div',
          props: {
            id: 'child'
          },
          children: undefined
        }
      ]
    }

    expect(buildLayoutNestedObj(json)).toEqual({
      div: {
        props: {
          id: 'root'
        },
        div: {
          props: {
            id: 'child'
          }
        }
      }
    })
  })
  it('applyJSONTreePatches', () => {
    const json: VirtualLayoutJSON = {
      id: 1,
      tag: 'div',
      props: {
        id: 'root'
      },
      children: [
        {
          id: 0,
          tag: 'div',
          props: {
            id: 'child1'
          },
          children: 1
        },
        {
          id: 0,
          tag: 'span',
          props: {
            id: 'child2'
          },
          children: 2
        },
        {
          id: 0,
          tag: 'div',
          props: {
            id: 'child3'
          },
          children: 3
        }
      ]
    }
    const v1 = 'root2'
    const v2 = 'child33'
    const patches: JSONPatch[] = [
      {
        op: 'replace',
        path: ['div', 'props', 'id'],
        value: v1
      },
      {
        op: 'replace',
        path: ['div', 'div', 'props', 'id'],
        value: v2
      }
    ]
    const result = applyJSONTreePatches(json, patches)
    expect(result).toEqual({
      id: 1,
      tag: 'div',
      props: {
        id: v1
      },
      children: [
        {
          id: 0,
          tag: 'div',
          props: {
            id: v2
          },
          children: 1
        },
        {
          id: 0,
          tag: 'span',
          props: {
            id: 'child2'
          },
          children: 2
        },
        {
          id: 0,
          tag: 'div',
          props: {
            id: v2
          },
          children: 3
        }
      ]
    })
  })
  it('proxyLayoutJSON', () => {
    const json: VirtualLayoutJSON = {
      id: 1,
      tag: 'div',
      props: {
        id: 'root'
      },
      children: [
        {
          id: 0,
          tag: 'div',
          props: {
            id: 'child'
          },
          children: undefined
        }
      ]
    }
    const { draft, apply } = proxyLayoutJSON(json)
    draft.div.props.id = 'root2'
    draft.div.div.props.id = 'child2'

    const result = apply()

    expect(result).toEqual({
      id: 1,
      tag: 'div',
      props: {
        id: 'root2'
      },
      children: [
        {
          id: 0,
          tag: 'div',
          props: {
            id: 'child2'
          },
          children: undefined
        }
      ]
    })
  })
})
