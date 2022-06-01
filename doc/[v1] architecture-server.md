# architecture 
for early *access version*

target: can run with react or axii with a server, 

- for application
  - page router
  - runtime
  - as service
  - project structure
  - bulding & packing

- only for server(koa)
  - server side
    - koa middleware
    - hook directory structure
    - merge Model config
  - frontend usage
    - vite plugin to compile referrence
    - any "compute" will sent to server
    - connect axii.reactive with immer.pathes
      - tarot.ts -> axii
      - axii -> tarot.ts
    - receive server info

# server side config

- page diectory
  - default: [project workspace]/pages/
- hook api pre
  - default: _hook, example: http://host/_hook

# run mode

- dev
  - intergration with [vite ssr](https://cn.vitejs.dev/guide/ssr.html)
  - load pages/*.ts
  - provide html template as base
  - Model
    - planet.ER
    - prisma
- prod
  - running with compiled nodejs js
    - load client compiled html
      - html load js/css
    - load compiled
  - Model
    - planet.ER
    - prisma

# model open api

- client config
  - call CRUD proxy by Server
  - or postDiffToServer
- server config
  - CRUD is real db operation
  - or postDiffTo other server

# service router system

- load pages as html
- export router config to client
  - is support dynamic router ?
  - client should keep same config
  - client can use custom Router component
- ssr (not neccesary)

# compiler
why compiler ? the service maybe load the ts file

- load file and compile it if needed