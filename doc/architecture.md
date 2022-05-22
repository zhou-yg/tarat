# architecture 
for early access version

## internal-state

- state
  - parameter
    - data, not reactive -> [doc](https://vuejs.org/api/reactivity-core.html)
  - constructor 
    - toRaw(data) as "internal-state"
  - watchSelf
    - collect any patch in "internal-state", reference [watch api source](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/apiWatch.ts#L173)
    - batch calling "update" event in next tick (15ms)
  - update
    - trigger "chang" event, if receive "watchEffect" listeners
  - get value
   - is under "input-compute"
     - yes: draft, using "toRaw" so that it won't trigger "watch" during "input-compute", commit patches to "internal-state" after "input-compute"
     - no: reactive data
- model
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