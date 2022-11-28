import {
  matchPatternMatrix,
  assignRules,
  applyJSONTreePatches,
  buildLayoutNestedObj,
  JSONPatch,
  VirtualLayoutJSON,
  proxyLayoutJSON,
  StyleRule,
  assignPattern,
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
  it('applyJSONTreePatches with insertNode', () => {
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
          tag: 'div',
          props: {
            id: 'child2'
          },
          children: undefined
        },
      ]
    }
    const patches: JSONPatch[] = [
      {
        op: 'insertNode',
        path: ['div'],
        value: 1
      },
      {
        op: 'insertNode',
        path: ['div', 'div'],
        value: 2
      },
    ]

    const result = applyJSONTreePatches(json, patches)
    expect(result).toEqual({
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
          children: [1, 2]
        },
        {
          id: 0,
          tag: 'div',
          props: {
            id: 'child2'
          },
          children: [2]
        },
        1
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
  it('proxyLayoutJSON with operates', () => {
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
    draft.div.insert(0)
    draft.div.div.insert(1)

    const result = apply()

    expect(result).toEqual({
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
          children: [1]
        },
        0,
      ]
    })
  })
  it('assignRules', () => {
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
        },
        {
          id: 0,
          tag: 'span',
          props: {
            id: 'child2',
            style: {
              fontSize: 14,
            }
          },
          children: undefined
        },
      ]
    }
    const { draft, apply } = proxyLayoutJSON(json)
    const rules: StyleRule[] = [
      {
        target: draft.div,
        condition: true,
        style: {
          color: 'red'
        }
      },
      {
        target: draft.div.span,
        condition: true,
        style: {
          color: 'blue'
        }
      }
    ]
    assignRules(draft, rules);
    const result = apply()
    expect(result).toEqual({
      id: 1,
      tag: 'div',
      props: {
        id: 'root',
        style: {
          color: 'red'
        }
      },
      children: [
        {
          id: 0,
          tag: 'div',
          props: {
            id: 'child'
          },
          children: undefined
        },
        {
          id: 0,
          tag: 'span',
          props: {
            id: 'child2',
            style: {
              fontSize: 14,
              color: 'blue'
            }
          },
          children: undefined
        },
      ]
    })
  })
  it('matchPatternMatrix', () => {
    const json: VirtualLayoutJSON = {
      id: 1,
      tag: 'div',
      props: {
        id: 'root',
        ['is-container']: true
      },
      children: [
        {
          id: 0,
          tag: 'div',
          props: {
            id: 'child'
          },
          children: undefined
        },
        {
          id: 0,
          tag: 'span',
          props: {
            id: 'child2',
            ['is-text']: true,
            style: {
              fontSize: 14,
            }
          },
          children: undefined
        },
      ]
    }
    const patternResult = matchPatternMatrix([true, false])({
      container: {
        backgroundColor: {
          red: [true, false],
          blue: [false, true],
        }
      },
      text: {
        fontSize: {
          small: [true, false],
          middle: [true, false],
        },
      }
    })

    const result = assignPattern(json, patternResult)

    expect(result).toEqual({
      id: 1,
      tag: 'div',
      props: {
        id: 'root',
        ['is-container']: true,
        style: {
          backgroundColor: 'red'
        }
      },
      children: [
        {
          id: 0,
          tag: 'div',
          props: {
            id: 'child'
          },
          children: undefined
        },
        {
          id: 0,
          tag: 'span',
          props: {
            id: 'child2',
            ['is-text']: true,
            style: {
              fontSize: 'middle',
            }
          },
          children: undefined
        },
      ]
    })
  })
})
