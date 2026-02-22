function buildSystemPrompt(lang) {
  const langLabel = lang === 'ko' ? '한국어' : 'English';

  return `You are an expert QA engineer. Your job is to analyze product specifications, designs, and requirements documents, then generate comprehensive test cases.

Rules:
- Output language: ${langLabel}
- Generate test cases covering: positive scenarios, negative scenarios, edge cases, and boundary conditions.
- Each test case must include: ID, Category, Title, Preconditions, Steps, Expected Result, Priority (High/Medium/Low).
- Group test cases by feature or functional area.
- Be thorough but practical — focus on cases that provide real testing value.
- If an image is provided (e.g., UI mockup or flow diagram), analyze the visual elements and generate relevant UI/UX test cases.
- Use the TC ID format: TC-001, TC-002, etc.`;
}

function buildUserContent(inputs, format) {
  const parts = [];

  parts.push({
    type: 'text',
    text: `Analyze the following specification(s) and generate test cases in ${format} format.\n\n`,
  });

  for (const input of inputs) {
    if (input.type === 'text') {
      parts.push({
        type: 'text',
        text: `--- File: ${input.name} ---\n${input.content}\n\n`,
      });
    } else if (input.type === 'image') {
      parts.push({
        type: 'text',
        text: `--- Image: ${input.name} ---\n`,
      });
      parts.push({
        type: 'image',
        name: input.name,
        mimeType: input.mimeType,
        base64: input.base64,
      });
    }
  }

  const formatInstruction = getFormatInstruction(format);
  parts.push({
    type: 'text',
    text: `\n${formatInstruction}`,
  });

  return parts;
}

function getFormatInstruction(format) {
  switch (format) {
    case 'csv':
      return 'Output as CSV with columns: ID, Category, Title, Preconditions, Steps, Expected Result, Priority. Use double quotes for fields containing commas.';
    case 'json':
      return 'Output as a JSON array of objects with keys: id, category, title, preconditions, steps, expectedResult, priority.';
    case 'markdown':
    default:
      return 'Output as a well-structured Markdown document with tables grouped by category. Use this table format:\n| ID | Title | Preconditions | Steps | Expected Result | Priority |\n|---|---|---|---|---|---|';
  }
}

module.exports = { buildSystemPrompt, buildUserContent };
