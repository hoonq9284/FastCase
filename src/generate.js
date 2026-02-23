const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const XLSX = require('xlsx');

const { loadConfig, CONFIG_FILE } = require('./config');
const { collectInputs } = require('./input');
const { buildSystemPrompt, buildUserContent } = require('./prompt');
const { generateWithAI } = require('./ai');

function csvToXlsx(csvText, outputPath) {
  // CSV 텍스트를 파싱하여 XLSX로 변환
  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 컬럼 너비 자동 조정
  const colWidths = [
    { wch: 12 },  // test_case_id
    { wch: 35 },  // folder
    { wch: 50 },  // testcases
    { wch: 25 },  // label
    { wch: 10 },  // priority
    { wch: 40 },  // precondition
    { wch: 55 },  // step
    { wch: 55 },  // expected
    { wch: 15 },  // actual
    { wch: 15 },  // notes
  ];
  sheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, outputPath);
}

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
  const outputPath = options.output ? path.resolve(options.output) : null;
  const isXlsx = outputPath && outputPath.toLowerCase().endsWith('.xlsx');
  // xlsx 출력이면 AI에게는 csv로 요청 (변환용)
  const format = isXlsx ? 'csv' : (options.format || 'markdown');
  const provider = config.provider;

  console.log('');
  console.log(chalk.bold('⚡ FastCase'));
  console.log(chalk.dim(`   Provider: ${provider === 'claude' ? 'Claude (Anthropic)' : 'OpenAI (GPT)'}`));
  console.log(chalk.dim(`   Files: ${inputs.map((i) => i.name).join(', ')}`));
  console.log(chalk.dim(`   Format: ${isXlsx ? 'xlsx' : format} | Language: ${lang}`));
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

  if (outputPath) {
    // AI 응답에서 코드블록 제거 (```csv ... ``` 형태)
    let cleanResult = result.replace(/^```(?:csv)?\s*\n?/m, '').replace(/\n?```\s*$/m, '');

    if (isXlsx) {
      csvToXlsx(cleanResult, outputPath);
    } else {
      const isCsv = outputPath.toLowerCase().endsWith('.csv');
      const content = isCsv ? '\uFEFF' + cleanResult : cleanResult;
      fs.writeFileSync(outputPath, content, 'utf-8');
    }
    console.log(chalk.green(`✓ Test cases saved to ${outputPath}`));
  } else {
    console.log(result);
  }

  console.log('');
}

module.exports = { runGenerate };
