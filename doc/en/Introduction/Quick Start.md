---
order:1
---

# Quick Start

Follow the steps below to complete a Markdown-Editor application like Apple Notes and you'll find it out that building application so easy while working with tarat

Bofore this quckstart, we assumed that you are fimilar with the "nodejs" and "react" technology ecosystem. if having no idea with these keywords, you ought to learn it first.

guides:

- [react](https://reactjs.org/)
- [nodejs](https://nodejs.org/en/)

## Pre-requisites

In this tutorial, it's very important for you to have these things locally on you own computer:

- [Node.js](https://nodejs.org/en/) (16.18.0 LTS version is recommended)
- npm 8 or greater 
- A code editor ([VSCode](https://code.visualstudio.com/) is a nice one)

## Creating the project

Quickly initialize a new tarat project, we recommend using tarat cli directly

> npx create-tarat@latest

After few interactive questions, the project is ready to run.

Let start the dev server:

> npm run dev

Open up [http://localhost:9100](http://localhost:9100), you can see the first page.

And this pristine project needs to add more sepecific to turn it into an Markdown-Editor

## Prepare for composing tarat-module 

As we all know that a simplest editor consist of 2 parts:

- a double column list
- a editor
- a user login/signup system

Benefit from tarat's composable module system, we are not necessarily implement these function from 0.

There already exists similar tarat-module, like:

- [tarat-cascading-list](https://www.npmjs.com/package/tarat-cascading-list)
- [tarat-markdown-editor](https://www.npmjs.com/package/tarat-markdown-editor)
- [tarat-user-login-system](https://www.npmjs.com/package/tarat-user-login-system)

let's compose it directly.

## Integrate tarat-modules

In our application, every time we create new item in folder we create a new markdown meantime.

So we need a junction between **item** and **markdown**

Firstly, let's install them

> npm i -S tarat-cascading-list tarat-markdown-editor tarat-user-login-system

Now these modules are totally independent, we need to build model relations with each other

create new file in **models/**

> touch ./models/model.enhance.json

And then write some correlation code about models

```javascript
// model.enhance.json
{
  "extraRelation": [
    {
      "from": {
        "model": "Tarat_cascading_list_Item",
        "field": "markdown"
      },
      "type": "1:1",
      "to": {
        "model": "Tarat_markdown_editor_Markdown",
        "field": "listItem"
      }
    }
  ]
}
```

With knowing "Entity Relationship (ER) Diagram Model", you'll find it out there is a new 1 to 1 relation connected with
model "item" in [tarat-cascading-list](https://www.npmjs.com/package/tarat-cascading-list) and model "markdown" in [tarat-markdown-editor](https://www.npmjs.com/package/tarat-markdown-editor)

Until now, we achieve our first goal by completion fundamental ER models

## Your first page

Our editor application need a fundamental function named "login/signup", so that oneself or others can access to the application

