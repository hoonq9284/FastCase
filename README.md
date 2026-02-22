# ⚡ FastCase

AI-powered test case generator from specs and designs.

기획서(Markdown, 텍스트, 이미지)를 넣으면 테스트케이스를 자동으로 생성합니다.

## Install

```bash
npm install -g fastcase-cli
```

## Quick Start

```bash
# 1. API 키 설정 (Claude 또는 OpenAI)
fastcase init

# 2. TC 생성
fastcase ./spec.md
```

## Usage

```bash
# 마크다운 기획서 분석
fastcase ./spec.md

# 기획서 + UI 화면 함께 분석
fastcase ./spec.md ./flow.png

# CSV로 저장
fastcase ./spec.md -f csv -o testcases.csv

# JSON으로 저장
fastcase ./spec.md -f json -o testcases.json

# 영어로 TC 생성
fastcase ./spec.md -l en

# 클립보드에서 바로 TC 생성
fastcase --clipboard
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-c, --clipboard` | 클립보드 내용을 입력으로 사용 | - |
| `-o, --output <file>` | 결과를 파일로 저장 | stdout |
| `-f, --format <format>` | 출력 포맷: markdown, csv, json | markdown |
| `-l, --lang <lang>` | 출력 언어: ko, en | ko |

## Supported AI Providers

- **Claude** (Anthropic) - 이미지 분석 지원
- **OpenAI** (GPT-4o) - 이미지 분석 지원

## License

MIT
