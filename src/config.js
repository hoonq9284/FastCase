const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

const CONFIG_DIR = path.join(require('os').homedir(), '.fastcase');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function initConfig() {
  console.log('');
  console.log(chalk.bold('⚡ FastCase Setup'));
  console.log('');

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select AI provider:',
      choices: [
        { name: 'Claude (Anthropic)', value: 'claude' },
        { name: 'OpenAI (GPT)', value: 'openai' },
      ],
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your API key:',
      mask: '*',
      validate: (input) => input.length > 0 || 'API key is required',
    },
    {
      type: 'list',
      name: 'lang',
      message: 'Default output language:',
      choices: [
        { name: '한국어', value: 'ko' },
        { name: 'English', value: 'en' },
      ],
    },
  ]);

  const config = {
    provider: answers.provider,
    apiKey: answers.apiKey,
    lang: answers.lang,
  };

  saveConfig(config);

  console.log('');
  console.log(chalk.green('✓ Configuration saved!'));
  console.log(chalk.dim(`  Config location: ${CONFIG_FILE}`));
  console.log('');
  console.log('  Now you can run:');
  console.log(chalk.cyan('    fastcase ./your-spec.md'));
  console.log('');
}

module.exports = { loadConfig, saveConfig, initConfig, CONFIG_FILE };
