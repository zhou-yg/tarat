# server-client-individual

for the normal mono repo that have 2 or more individual project like

- packages/
  - server/
  - hooks/
  - client/

## prepare

this example dependent on @tarot/core in workspace, so you should build core library first

build @tarot-run/core local dist

> cd ../../core
> pnpm install
> npm run build

build @tarot-run/server local dist

> cd ../../server
> pnpm install
> npm run build


## get start 

start the project 

> npm run dev