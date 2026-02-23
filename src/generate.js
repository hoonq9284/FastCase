const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

const { loadConfig, CONFIG_FILE } = require('./config');
const { collectInputs } = require('./input');
const { buildSystemPrompt, buildUserContent } = require('./prompt');
const { generateWithAI } = require('./ai');

async function runGenerate(files, options) {
  // 1. Load config
  const config = loadConfig();
  if (!config) {
    console.error('');
    console.error(chalk.red('✗ No configuration found.'));
    console.error(`  Run ${chalk.cyan('fastcase init')} first to set up your API key.`);
    console.error('');
    return;
  }

  // 2. Collect inputs
  let inputs;
  try {
    inputs = collectInputs(files, options);
  } catch (err) {
    console.log('');
    console.log(chalk.red(`✗ ${err.message}`));
    console.log('');
    return;
  }

  // 3. Show summary
  const lang = options.lang || config.lang || 'ko';
  const format = options.format || 'markdown';
  const provider = config.provider;

  console.log('');
  console.log(chalk.bold('⚡ FastCase'));
  console.log(chalk.dim(`   Provider: ${provider === 'claude' ? 'Claude (Anthropic)' : 'OpenAI (GPT)'}`));
  console.log(chalk.dim(`   Files: ${inputs.map((i) => i.name).join(', ')}`));
  console.log(chalk.dim(`   Format: ${format} | Language: ${lang}`));
  console.log('');

  // 4. Build prompts
  const systemPrompt = buildSystemPrompt(lang);
  const userContent = buildUserContent(inputs, format);

  // 5. Call AI
  const spinner = ora('Analyzing specs and generating test cases...').start();

  let result;
  try {
    result = await generateWithAI(provider, config.apiKey, systemPrompt, userContent);
    spinner.succeed('Test cases generated!');
  } catch (err) {
    spinner.fail('Failed to generate test cases');
    console.log('');
    if (err.message.includes('401') || err.message.includes('auth')) {
      console.log(chalk.red('  API key is invalid. Run `fastcase init` to reconfigure.'));
    } else {
      console.log(chalk.red(`  Error: ${err.message}`));
    }
    console.log('');
    return;
  }

  // 6. Output
  console.log('');

  if (options.output) {
    const outputPath = path.resolve(options.output);
    const isCsv = outputPath.toLowerCase().endsWith('.csv');
    const content = isCsv ? '\uFEFF' + result : result;
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(chalk.green(`✓ Test cases saved to ${outputPath}`));
  } else {
    console.log(result);
  }

  console.log('');
}

module.exports = { runGenerate };
