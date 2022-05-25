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

development plan:
- service about:
  - page router
  - runtime
  - as service
  - project structure
  - bulding & packing

- core about:
  - runner & scope
  - internal-state
  - inputCompute
  - effect
  - BM



## BM

- a closure, a hook like function
  - body include
    - internal-state
    - input-compute
    - effect

## internal-state

- State class
  - freeze property, maybe useless in partial inputCompute in server side
  - _intervalValue: any
  - parameter
    - data -> [doc](https://vuejs.org/api/reactivity-core.html)
  - constructor 
    - data as "_intervalValue"
    - call watchSelf
  - onUpdate / offUpdate
    - add listener
  - update
    - batch calling "update" event in next tick (15ms)
    - trigger "changed" event to "onUpdate" listener
      - state object
  - get value
   - return "_intervalValue"
- Model class
  - extends to "state"
  - constructor
    - parameter
      - ER.find's query language
        - entity
        - where
      - queryAtConstructor(default=true)
  - query
    - execute query parameter
      - set response to _internalValue
    - the model operate api should registed by outside
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
  - retun
    - getter, pass undef param
    - setter, pass function that receive a draft, return latest value
      - when setter end. but if under "input-compute"
        - no: commit data to replace old "_intervalValue"
        - yes: collect patches to "CurrentRunnerScope" (still return latest value), so that inputCompute can commit all patches

- model factory
  - same above

## input-compute

- inputCompute hook method
  - receive a function as [compute execution body]
  - return a runner function, so that can collect execute situation
  - support asynchoronous
  - binding destroy to "CurrentRunnerScope"
- calling inputCompute
  - check is force running in server
    - yes: post to server side
    - no: continute execute
      - record current inputCompute, set currentInputeCompute=[compute execution body]
      - trigger "before event" and pass [compute execlute body]  to "CurrentRunnerScope"
      - check freeze
        - yes: dont execute, and unfreeze it
        - no: continue execute...
- calling end
  - collect all state patches inside inputCompute, trigger their's 'update'
  - use CurrentScope.applyComputePatches to commit patches from CurrentScope and clear
- provide distinct hook for server/client
  - inputCompute
  - inputComputeServer

- runtime
  - server
    - do compute directly
  - client
    - inputCompute
      - same above
    - inputComputeServer
      - post context to server and wait response

- context serialization
  - hooks data for sort index, data structure
    - { type: 'data' | 'patch', value: any }
    - strinigfy data, skip input compute, but keep the position (consider long model data)
  - compute hook index

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

## runner

- runner
  - class
    - so that can keep memory
  - instantiate "CurrentRunnerScope" and recod
    - maybe with "serialized parameters" in server side
  - get BM result
    - binding result to scope
    - response result
  - watch scope changing
  - trigger listener in runner

- scope
  - class CurrentRunnerScope
    - constructor
      - with serialized parameters
  - computePatches
    - save state or model patches during inputCompute
    - should cleared when inputCompute end
  - applyComputePatches
    - called by inputCompute at end
  - hook <-> setterGetter maps
  - addHook, add State, Model, compute function to current scope
  - hooks
    - states
      - array
    - models
      - array
      - if in client(or specify a optional parameter): check global data
        - exist: set globalData to model._internalValue
        - no: use query method to fetch
      - model global data & subscribe
        - only in client and optional
  - listeners
    - data structor unit: [state or model or inputCompute, scopeDefaultListener, {
      before: effectListeners,
      after: effectListeners
    }]
  - addHook
    - add unit
      - State
      - Model
      - inputCompute
    - subscribe onUpdate (State or Model)
  - addWatch
    - parameters: target, callback, 'before' or 'after'

## runtime

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
  - example: [next-server](https://github.com/vercel/next.js/blob/canary/packages/next/server/next-server.ts)
- bootstrap
  - middleware load with a collection of BM.server.js
  - middleware load with a collection of pages (CSR)
    - consider SSR in next version
- response
  - page
  - api data

## page router
- spa 
  - render mode: CSR
  - 
- mpa (to be continued)

## project structure

- normal
  - .tarot/ like dist but only serve for "dev"
    - hooks/
      - bm1.server.js
      - bm1.client.js
  - db/
    - prisma.schema
  - hooks/  --> api: /bm1/inputCompute
    - bm1.ts
  - pages/  --> page: /tab1/my
    - home.tsx (import bm1.ts) replaced to bm1.client.js 
    - tab1/
      - my.tsx
    - _app.tsx (custom or using default template html )


- after building
  - dist/
    - hooks/
      - bm1.server.js
      - bm1.client.js
    - pages/
      - home.js (import bm1.client.js)
      - tab1.my.js
  - others, same above...