const inquirer = require('inquirer')

inquirer
  .prompt([
    {
      nmae: 'name',
      message: 'Please input your project name',
      type: 'input',
      default: 'my-tarat-unit'
    },
    {
      name: 'language',
      message: 'Which language you prefer',
      type: 'list',
      choices: ['typescript', 'javascript']
    },
  ]).then(answers => {
    console.log('answers: ', answers);
  })
