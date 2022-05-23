# architecture 
for early *access version*

target: can run with react or axii with a server, 

some features
- high priority
  - built in service, provide api using BM
  - CSR
  - a boilerplate
    - dev
    - build
    - serve
  - build compile to BM.server and BM.client
- others
  - any lint rule
  - SSR
  - useCache hook
  - hot update


## BM

- a closure, a hook like function
  - body include
    - internal-state
    - input-compute
    - effect

## internal-state

- State class
  - freeze property, maybe useless in partial inputCompute in server side
  - parameter
    - data, not reactive -> [doc](https://vuejs.org/api/reactivity-core.html)
  - constructor 
    - reactive(toRaw(data))  as "internal-state"
    - call watchSelf
  - watchSelf
    - collect any patches in "internal-state", reference [watch api source](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/apiWatch.ts#L173)
    - batch calling "update" event in next tick (15ms)
  - onUpdate
    - add listener
  - update
    - trigger "changed" event to "onUpdate" listener
      - state object
  - get value
   - is under "input-compute"
     - yes: draft, using "toRaw" so that it won't trigger "watch" during "input-compute", commit patches to "internal-state" after "input-compute"
     - no: data (already reactive)
- Model class
  - extends to "state"
  - parameter
    - ER.find's query language
      - entity
      - where
  - after "state.update", post patches to server side
    - ps: if there are any "remove" patch
      - remove property: should set it op="replace" and value="null" instead
      - remove object item: should call "remove" method
    - bad case: http request occured error
      - retry again
        - rollback patches
  - remove method
    - support batch remove
- cache (not necessary)
- computed (like vue.computed)
  - asynchronous: support async/await in compute body


- state factory
  - instantiate State class, binding to "CurrentRunnerScope"
  - add listener for state
- model factory
  - same above

## input-compute

- inputCompute hook method
  - receive a function as [compute execution body]
  - return a runner function, so that can collect execute situation
  - support asynchoronous
  - binding destroy to "CurrentRunnerScope"
- calling inputCompute
  - check is safety
    - yes: post to server side
    - no: continute execute
      - record current inputCompute, set globalInputeCompute=[compute execution body]
      - trigger "before event" and passive [compute execlute body]  to "CurrentRunnerScope"
      - check freeze 
        - yes: dont execute, and unfreeze it
        - no: continue execute...
- calling end
  - collect all state patches inside inputCompute, trigger their's 'update'

## effect

- before
  - observe target
    - state (not support)
      - tip: maybe nobody need to intercept state updating
    - inputCompute
  - bind to "CurrentRunnerScope"
    - destroy method
    - listener timing and callback
      - if watch callback want stop inputCompute execution, use "freeze" 
- after
  - observe target
    - state
    - inputCompute

## CurrentRunnerScope

- class
  - constructor
    - with serialized parameters
- states and models
  - array
- listeners
  - data structor unit: [state or model or inputCompute, scopeDefaultListener, {
    before: effectListeners,
    after: effectListeners
  }]
- addState
  - add unit
- addModel
  - same above
- addWatch
  - parameters: target, callback, 'before' or 'after'

## runtime

- runner
  - instantiate "CurrentRunnerScope" and recod
    - maybe with "serialized parameters" in server side
  - get BM result
    - binding result to scope
    - response result
  - watch scope changing
  - trigger listener in runner

- client 
  - react connect lib
    - runner in useEffect
  - axii connect lib
    - runner in main function body
    - watch runner changing event
- server 
  - koa middleware
    - runner in http request
    - receive serialized parameters
    - response calresult

## as service

- basic lib
  - [koa.js](https://github.com/koajs/koa)
- bootstrap
  - middleware load with a collection of BM.server.js
  - middleware load with a collection of pages (CSR)
    - consider SSR in next version
- response
  - page
  - api data