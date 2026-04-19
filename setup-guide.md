# AWS Day-of-Week API 作業手順書

対象OS: macOS / Windows 共通（差異がある場合は明記）  
使用言語: TypeScript / Node.js v22.12.0  
構成: AWS Lambda \+ API Gateway（SAM CLI でデプロイ）

---

## 目次

1. [前提ツールのインストール](#1-前提ツールのインストール)  
2. [プロジェクトの作成](#2-プロジェクトの作成)  
3. [ファイルの作成](#3-ファイルの作成)  
4. [テストの実行](#4-テストの実行)  
5. [ビルドとローカル動作確認](#5-ビルドとローカル動作確認)  
6. [AWSへのデプロイ](#6-awsへのデプロイ)  
7. [GitHubへのプッシュ](#7-githubへのプッシュ)

---

## 1\. 前提ツールのインストール

### 1-1. Node.js v22.12.0

**Mac:**

\# nodenvがない場合はまずインストール

brew install nodenv

echo 'eval "$(nodenv init \-)"' \>\> \~/.zshrc

source \~/.zshrc

nodenv install 22.12.0

nodenv global 22.12.0

\# バージョン確認

node \-v   \# → v22.12.0

npm \-v

**Windows:**

\# wingetでインストール（バージョン指定）

winget install OpenJS.NodeJS \--version 22.12.0

\# バージョン確認（新しいターミナルを開いてから）

node \-v   \# → v22.12.0

npm \-v

---

### 1-2. AWS CLI

**Mac:**

brew install awscli

\# バージョン確認

aws \--version

**Windows:**

winget install Amazon.AWSCLI

\# バージョン確認（新しいターミナルを開いてから）

aws \--version

**AWS認証情報の設定（Mac/Windows共通）:**

aws configure

\# AWS Access Key ID:     → AWSコンソール \> セキュリティ認証情報 で取得したIDを入力

\# AWS Secret Access Key: → 同画面で取得したキーを入力

\# Default region name:   → ap-northeast-1

\# Default output format: → json

---

### 1-3. SAM CLI

**Mac:**

brew install aws-sam-cli

\# バージョン確認

sam \--version

**Windows:**

\# 公式インストーラーをダウンロードして実行

\# https://github.com/aws/aws-sam-cli/releases/latest/download/AWS\_SAM\_CLI\_64\_PY3.msi

\# バージョン確認（新しいターミナルを開いてから）

sam \--version

---

### 1-4. Docker Engine \+ Colima（Mac）/ Docker Desktop（Windows）

**Mac（Colima使用）:**

brew install colima docker

\# Colima起動

colima start

\# 動作確認

docker info   \# エラーが出なければOK

**補足:** Macを再起動した場合は `colima start` を再度実行してください。

**Windows:**

\# Docker Desktop をインストール

winget install Docker.DockerDesktop

\# インストール後にDocker Desktopを起動してからターミナルで確認

docker info   \# エラーが出なければOK

---

### 1-5. Git

**Mac:**

brew install git

git \--version

**Windows:**

winget install Git.Git

\# バージョン確認（新しいターミナルを開いてから）

git \--version

---

## 2\. プロジェクトの作成

mkdir day-of-week-api

cd day-of-week-api

npm init \-y

### 依存パッケージのインストール

npm install \-D typescript @types/node @types/aws-lambda ts-node jest ts-jest @types/jest esbuild

`aws-lambda` は **dependencies には追加しない**。型定義は `@types/aws-lambda`（devDependencies）のみ使用。

### TypeScript 設定ファイルの生成

npx tsc \--init

### ディレクトリの作成

**Mac:**

mkdir src tests

**Windows:**

mkdir src

mkdir tests

---

## 3\. ファイルの作成

### 3-1. `tsconfig.json` を以下の内容で上書き

{

  "compilerOptions": {

    "outDir": "dist",

    "module": "nodenext",

    "target": "es2020",

    "moduleResolution": "nodenext",

    "rootDir": ".",

    "types": \["node", "jest"\],

    "sourceMap": true,

    "declaration": true,

    "declarationMap": true,

    "noUncheckedIndexedAccess": true,

    "exactOptionalPropertyTypes": true,

    "strict": true,

    "jsx": "react-jsx",

    "verbatimModuleSyntax": false,

    "isolatedModules": true,

    "noUncheckedSideEffectImports": true,

    "moduleDetection": "force",

    "skipLibCheck": true

  },

  "include": \["src/\*\*/\*", "tests/\*\*/\*"\]

}

`module: "nodenext"` と `moduleResolution: "nodenext"` はモダンなNode.js向けの設定で、常に最新安定版のNode.jsに追従する。`Node22` や `node22` という値は存在しないため `nodenext` を使用する。

---

### 3-2. `src/handler.ts` を作成

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const DAYS \= \["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"\];

export const getDayOfWeek \= (dateStr: string): string \=\> {

  const date \= new Date(\`${dateStr}T00:00:00\`);

  if (isNaN(date.getTime())) throw new Error("Invalid date format. Use YYYY-MM-DD.");

  return DAYS\[date.getDay()\];

};

export const handler \= async (event: APIGatewayProxyEvent): Promise\<APIGatewayProxyResult\> \=\> {

  try {

    const dateStr \= event.queryStringParameters?.date;

    if (\!dateStr) return { statusCode: 400, body: JSON.stringify({ error: "date parameter is required." }) };

    const dayOfWeek \= getDayOfWeek(dateStr);

    return { statusCode: 200, body: JSON.stringify({ date: dateStr, dayOfWeek }) };

  } catch (e) {

    return { statusCode: 400, body: JSON.stringify({ error: (e as Error).message }) };

  }

};

---

### 3-3. `tests/handler.test.ts` を作成

import type { APIGatewayProxyEvent } from "aws-lambda";

import { getDayOfWeek, handler } from "../src/handler";

const mockEvent \= (date?: string) \=\>

  ({ queryStringParameters: date ? { date } : null } as unknown as APIGatewayProxyEvent);

describe("getDayOfWeek", () \=\> {

  it.each(\[

    \["2024-01-01", "Monday"\],

    \["2024-12-25", "Wednesday"\],

    \["2025-04-13", "Sunday"\],

  \])("returns correct day for %s", (date, expected) \=\> {

    expect(getDayOfWeek(date)).toBe(expected);

  });

  it("throws on invalid date", () \=\> {

    expect(() \=\> getDayOfWeek("not-a-date")).toThrow("Invalid date format");

  });

});

describe("handler", () \=\> {

  it("returns 200 with dayOfWeek", async () \=\> {

    const res \= await handler(mockEvent("2024-01-01"));

    expect(res.statusCode).toBe(200);

    expect(JSON.parse(res.body).dayOfWeek).toBe("Monday");

  });

  it("returns 400 when date is missing", async () \=\> {

    const res \= await handler(mockEvent());

    expect(res.statusCode).toBe(400);

  });

});

---

### 3-4. `package.json` の `scripts` と `jest` を更新

`package.json` を開き、`"scripts"` と `"jest"` セクションを以下の通りに修正：

{

  "scripts": {

    "test": "jest",

    "build": "esbuild src/handler.ts \--bundle \--platform=node \--target=node22 \--outfile=dist/handler.js"

  },

  "jest": {

    "preset": "ts-jest",

    "testEnvironment": "node"

  }

}

---

### 3-5. `template.yaml` を作成

AWSTemplateFormatVersion: "2010-09-09"

Transform: AWS::Serverless-2016-10-31

Globals:

  Function:

    Runtime: nodejs22.x

    Architectures:

      \- arm64

    Handler: handler.handler

    CodeUri: dist/

Resources:

  DayOfWeekFunction:

    Type: AWS::Serverless::Function

    Properties:

      Events:

        GetDayOfWeek:

          Type: Api

          Properties:

            Path: /day-of-week

            Method: GET

Outputs:

  ApiUrl:

    Value: \!Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/day-of-week"

`Architectures: arm64` を指定することでAWS Graviton2プロセッサで動作し、コスト削減とパフォーマンス向上が見込めます。

---

### 3-6. `.gitignore` を作成

node\_modules/

dist/

.aws-sam/

.env

`samconfig.toml` はデプロイ設定を含むためGitで管理する（gitignoreに含めない）。

---

## 4\. テストの実行

npm test

以下のように全テストが PASS することを確認する：

PASS  tests/handler.test.ts

  getDayOfWeek

    ✓ returns correct day for 2024-01-01

    ✓ returns correct day for 2024-12-25

    ✓ returns correct day for 2025-04-13

    ✓ throws on invalid date

  handler

    ✓ returns 200 with dayOfWeek

    ✓ returns 400 when date is missing

テストが失敗した場合はコードを修正してから次のステップに進む。

---

## 5\. ビルドとローカル動作確認

### ビルド

ビルドには2つの方法があり、用途に応じて使い分ける：

| コマンド | 用途 | 出力先 |
| :---- | :---- | :---- |
| `npm run build` | esbuildによる単体ビルド。テスト後の動作確認など | `dist/` |
| `sam build` | SAMが管理するビルド。**AWSデプロイ前は必ずこちらを使用** | `.aws-sam/` |

\# ローカル動作確認・デプロイ前はsam buildを使用

sam build

`.aws-sam/` 配下にビルド成果物が生成されることを確認。

### ローカル動作確認（Dockerが起動していること）

**Mac（Colimaが停止している場合は先に起動）:**

colima start

\# 別ターミナルでAPIサーバーを起動

sam local start-api

\# 元のターミナルで動作確認

curl "http://localhost:3000/day-of-week?date=2024-01-01"

\# → {"date":"2024-01-01","dayOfWeek":"Monday"}

**Windows（PowerShell）:**

\# 別ウィンドウでAPIサーバーを起動

sam local start-api

\# 元のウィンドウで動作確認

curl "http://localhost:3000/day-of-week?date=2024-01-01"

---

## 6\. AWSへのデプロイ

### 初回デプロイ（対話形式）

\# 1\. SAMでビルド

sam build

\# 2\. 対話形式でデプロイ

sam deploy \--guided

プロンプトへの入力例：

Stack Name \[sam-app\]: day-of-week-api

AWS Region \[ap-northeast-1\]: ap-northeast-1

Confirm changes before deploy \[y/N\]: N

Allow SAM CLI IAM role creation \[Y/n\]: Y

Disable rollback \[y/N\]: N

DayOfWeekFunction may not have authorization defined. Is this okay? \[y/N\]: y

Save arguments to configuration file \[Y/n\]: Y

SAM configuration file \[samconfig.toml\]: （Enterでスキップ）

SAM configuration environment \[default\]: （Enterでスキップ）

初回デプロイ後、`samconfig.toml` が自動生成される。内容が以下になっていることを確認し、異なる場合は修正する：

version \= 0.1

\[default.deploy.parameters\]

stack\_name \= "day-of-week-api"

resolve\_s3 \= true

s3\_prefix \= "day-of-week-api"

confirm\_changeset \= false

capabilities \= "CAPABILITY\_IAM"

image\_repositories \= \[\]

disable\_rollback \= false

\[default.global.parameters\]

region \= "ap-northeast-1"

### デプロイ完了後の確認

デプロイ完了時に表示される `Outputs` の `ApiUrl` をコピーして動作確認：

curl "https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/Prod/day-of-week?date=2025-04-13"

\# → {"date":"2025-04-13","dayOfWeek":"Sunday"}

Runtimeが正しく反映されているか確認する：

aws lambda get-function-configuration \\

  \--function-name $(aws cloudformation describe-stack-resources \\

    \--stack-name day-of-week-api \\

    \--query "StackResources\[?ResourceType=='AWS::Lambda::Function'\].PhysicalResourceId" \\

    \--output text) \\

  \--query "Runtime" \\

  \--output text

\# → nodejs22.x

### 2回目以降のデプロイ

npm test && sam build && sam deploy

---

## 7\. GitHubへのプッシュ

### 7-1. GitHubでリポジトリを作成

1. [github.com](https://github.com) にログイン  
2. 右上の `+` → `New repository`  
3. 以下を設定して `Create repository` をクリック：  
   - Repository name: `day-of-week-api`  
   - Visibility: `Private`（任意）  
   - README・.gitignore・license: **追加しない**（すべてチェックなし）

### 7-2. ローカルリポジトリの初期化とプッシュ

git init

git add .

git commit \-m "feat: initial commit \- day of week API"

git branch \-M main

git remote add origin https://github.com/\<GitHubユーザー名\>/day-of-week-api.git

git push \-u origin main

`<GitHubユーザー名>` は自身のGitHubアカウント名に置き換えてください。

### 7-3. プッシュの確認

GitHubのリポジトリページを開き、以下のファイルがすべて存在することを確認：

day-of-week-api/

├── src/

│   └── handler.ts

├── tests/

│   └── handler.test.ts

├── template.yaml

├── samconfig.toml

├── tsconfig.json

├── package.json

├── package-lock.json

└── .gitignore

`node_modules/`・`dist/`・`.aws-sam/` は `.gitignore` により除外されています。

---

## 補足：AWSリソースの削除方法

不要になった場合は以下のコマンドでAWS上のリソースをすべて削除できます：

sam delete

---

*以上で作業完了です。*  
