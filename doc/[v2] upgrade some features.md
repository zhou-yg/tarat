# beta version

features

sort by priority

- 0.test example: login-system √

- 1.new feature
  - part1: core
    - "cache" hook √
      - cookie √
      - redis √
    - "mode" √
      - "model" directive √
        - exist √
      - "model" lazy query aysnc √
      - computed with state √
    - "context" synchronism with 0 compute √
      -  differentiate query if immediate or not in two side √
    - "InputCompute" access hook values isolation from the current hook √
    - building "model" input relation with state
      - providing atomic operation of Model: CUD 
  - part2: connect
    - access hook in "views" component
      - react
  - part3: server
    - compose: support staticly importing other hook to current project √
      - extra Model relation description √
    - "context synchronism" only pass dependent hooks √
      - depends AST √
    - BM drives view √
    - migrate from esm to cjs
- 2.upgrade performance / features
  - "model" global referrence
- 3.upgrade development experience
  - cleint data mode
  - more huamable API calling style
  - run production
  - page router / view router √
  - runner with typescript types snippets √
  - server part
    - support hook writen by ts, need a compiler to differentiate client/server √
    - support hot-reload √
  - quick start cli: create-tarat
