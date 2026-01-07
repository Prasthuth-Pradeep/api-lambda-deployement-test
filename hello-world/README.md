# AWS SAM Local Testing Guide

This project uses AWS Serverless Application Model (SAM) for local development. Since `events/`, `scripts/`, and `.vscode/` folders are gitignored, this guide will help you set up everything from scratch.

## Prerequisites

- **AWS SAM CLI**: [Install Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- **Docker Desktop**: Required for `sam local invoke`
- **Node.js**: v18 or later

---

## Quick Start

1. **Create Required Folders**
```bash
mkdir -p events scripts .vscode
```

2. **Create Scripts** (see code below)
3. **Create Test Event** (see examples below)
4. **Run Tests**
```bash
npm run test-local
```

---

## 1. Setup Scripts

### Create `scripts/test-runner.js`

This interactive script scans your `template.yaml`, lets you select which function to test, and auto-detects the HTTP method and path.

```javascript
import readline from 'readline';
import { execSync } from 'child_process';
import fs from 'fs';

// Configuration
const TEMPLATE_FILE = 'template.yaml';
const EVENT_INPUT = 'events/event.json';
const PROXY_EVENT = 'events/proxy-event.json';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (str) => new Promise(resolve => rl.question(str, resolve));

async function main() {
    try {
        console.log('🔍 Scanning template.yaml for functions...');
        const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
        
        const functions = [];
        const lines = template.split('\n');
        let inResources = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.match(/^Resources:/)) {
                inResources = true;
                continue;
            }
            
            if (inResources && line.match(/^[A-Z]\w+:/)) {
                inResources = false;
            }
            
            if (inResources && line.match(/^  [A-Z]\w+:/)) {
                const fnName = line.trim().replace(':', '');
                
                let isFunction = false;
                let method = 'POST';
                let path = '/hello';
                
                for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
                    if (lines[j].includes('Type: AWS::Serverless::Function')) {
                        isFunction = true;
                    }
                    const methodMatch = lines[j].match(/Method:\s*(get|post|put|delete)/i);
                    if (methodMatch) {
                        method = methodMatch[1].toUpperCase();
                    }
                    const pathMatch = lines[j].match(/Path:\s*(.+)/);
                    if (pathMatch) {
                        path = pathMatch[1].trim();
                    }
                    if (j > i + 1 && lines[j].match(/^  [A-Z]\w+:/)) {
                        break;
                    }
                }
                
                if (isFunction) {
                    functions.push({ name: fnName, method: method, path: path });
                }
            }
        }

        if (functions.length === 0) {
            console.error('No functions found in template.yaml');
            process.exit(1);
        }

        console.log('\n⚡ Available Functions:');
        functions.forEach((fn, index) => console.log(`${index + 1}. ${fn.name}\t[${fn.method}] ${fn.path}`));

        const fnChoice = await question(`\nSelect Function [1-${functions.length}]: `);
        const selected = functions[parseInt(fnChoice) - 1];

        if (!selected) {
            console.error('Invalid selection.');
            process.exit(1);
        }

        console.log(`\nSelected: ${selected.name}`);
        console.log(`Auto-detected Method: ${selected.method}`);
        console.log(`Auto-detected Path: ${selected.path}`);
        
        console.log(`\nPreparing to invoke ${selected.name}...`);

        console.log('   > Generating event...');
        execSync(`node scripts/generate-event.js ${EVENT_INPUT} ${PROXY_EVENT} ${selected.method} ${selected.path}`, { stdio: 'inherit' });

        console.log('   > Building...');
        execSync('sam build', { stdio: 'inherit' });

        console.log('   > Invoking...');
        const cmd = `sam local invoke ${selected.name} -e ${PROXY_EVENT}`;
        console.log(`   $ ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });

    } catch (err) {
        console.error('\nError:', err.message);
    } finally {
        rl.close();
    }
}

main();
```

### Create `scripts/generate-event.js`

This script converts your simple test data into AWS API Gateway proxy event format.

```javascript
import fs from 'fs';
import path from 'path';

// Usage: node scripts/generate-event.js <input-json> [output-json] [method] [path]

const inputPath = process.argv[2] || 'events/event.json';
const outputPath = process.argv[3] || 'events/proxy-event.json';
const methodArg = process.argv[4] || 'POST';
const pathPattern = process.argv[5] || '/hello';

try {
    let rawData = fs.readFileSync(inputPath, 'utf8');
    
    // Remove BOM if present (PowerShell adds this)
    if (rawData.charCodeAt(0) === 0xFEFF) {
        rawData = rawData.substring(1);
    }
    
    // Strip comments (// and /* */)
    const cleanedData = rawData.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    let inputJson;
    try {
        inputJson = JSON.parse(cleanedData);
    } catch (e) {
        throw new Error('Failed to parse JSON: ' + e.message);
    }
    
    // Build actual path from pattern and pathParams
    let actualPath = pathPattern;
    const pathParams = inputJson.pathParams || null;
    
    if (pathParams) {
        Object.keys(pathParams).forEach(key => {
            actualPath = actualPath.replace(`{${key}}`, pathParams[key]);
        });
    }
    
    const bodyPayload = inputJson.body ? JSON.stringify(inputJson.body) : null;
    const headersPayload = inputJson.headers || { "Content-Type": "application/json" };
    const queryParams = inputJson.queryParams || null;

    const proxyEvent = {
        body: bodyPayload,
        resource: pathPattern,
        path: actualPath,
        httpMethod: methodArg,
        headers: headersPayload,
        queryStringParameters: queryParams,
        pathParameters: pathParams,
        isBase64Encoded: false
    };

    fs.writeFileSync(outputPath, JSON.stringify(proxyEvent, null, 4));
    console.log('Successfully generated proxy event at: ' + outputPath);

} catch (err) {
    console.error('Error generating event file:', err.message);
    process.exit(1);
}
```

---

## 2. Create Test Events

### GET Request with Path & Query Parameters

**`events/event.json`**:
```json
{
    "pathParams": {
        "id": "user-123"
    },
    "queryParams": {
        "filter": "active",
        "sort": "desc"
    }
}
```

This will generate a request to `/hello/user-123?filter=active&sort=desc`

### POST Request with Headers & Body

**`events/event.json`**:
```json
{
    "headers": {
        "Authorization": "Bearer your-token",
        "Language": "en-US"
    },
    "body": {
        "name": "Developer",
        "action": "testing"
    }
}
```

---

## 3. Testing Commands

### Interactive Testing (Recommended)

Select which function to test interactively:
```bash
npm run test-local
```

**Output Example:**
```
🔍 Scanning template.yaml for functions...

⚡ Available Functions:
1. HelloWorldFunction   [GET] /hello/{id}
2. HelloWorldPostFunction       [POST] /hello

Select Function [1-2]: 1

Selected: HelloWorldFunction
Auto-detected Method: GET
Auto-detected Path: /hello/{id}
```

### Watch Mode (Auto-rerun on save)

```bash
npm run watch-local
```

Automatically rebuilds and tests whenever you save `app.js` or `events/event.json`.

### Debug Mode (VS Code Breakpoints)

1. Set breakpoints in `app.js`
2. Run:
   ```bash
   npm run debug-local
   ```
3. Wait for "Debugger listening..."
4. Press **F5** in VS Code
5. Execution pauses at your breakpoints

---

## 4. VS Code Debug Configuration (Optional)

If you want to use the debugger, create **`.vscode/launch.json`**:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach to SAM Local",
            "type": "node",
            "request": "attach",
            "address": "localhost",
            "port": 5858,
            "localRoot": "${workspaceFolder}/hello-world",
            "remoteRoot": "/var/task"
        }
    ]
}
```

---

## 5. Understanding the Workflow

**Step 1:** You create simple test data in `events/event.json`  
**Step 2:** `generate-event.js` wraps it into AWS API Gateway format  
**Step 3:** `sam build` compiles your Lambda  
**Step 4:** `sam local invoke` runs it in Docker  

### Why This Approach?

- No need to manually craft complex AWS proxy events
- Auto-detect HTTP method and path from template.yaml
- Simple JSON files for test data
- Interactive menu to select functions

---

## 6. Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run test-local` | Interactive test runner |
| `npm run watch-local` | Auto-rerun tests on file changes |
| `npm run debug-local` | Start debugger for POST function |
| `npm run generate-event` | Manually generate proxy event |

---

## 7. Troubleshooting

### "No such file or directory: events/event.json"
Create the `events/` folder and `event.json` file as shown above.

### "docker: command not found"
Install Docker Desktop and ensure it's running.

### "Failed to parse JSON"
Check `events/event.json` for syntax errors (trailing commas, missing quotes).

### Only seeing one function in the menu
Verify both functions are defined in `template.yaml` under `Resources:`.

---

## Next Steps

- Modify `events/event.json` with your test data
- Run `npm run test-local`
- Check the console output for your Lambda logs
- Use `console.log()` in `app.js` to debug
