# architecture 
for early access version

## internal-state

- state
  - parameter
    - data, not reactive -> [doc](https://vuejs.org/api/reactivity-core.html)
  - constructor 
    - toRaw(data) as "internal-state"
  - watchSelf
    - collect any patch in "internal-state" [watch api source](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/apiWatch.ts#L173)
    - batch calling "update" event in next tick (15ms)
  - update
    - trigger "chang" event, if receive "watchEffect" listeners
  - get value
   - is under "input-compute"
     - yes: draft, using "toRaw" so that it won't trigger "watch" during "input-compute"
     - no: reactive data
- model
- cache (not necessary)