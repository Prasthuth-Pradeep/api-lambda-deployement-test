
import readline from 'readline';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (str) => new Promise(resolve => rl.question(str, resolve));

import os from 'os';

async function main() {
    try {
        console.log("🚀 Starting Local Runner...");

        // 1. Scan Template for Function Details (Name, Method, Path)
        let functions = [];
        if (fs.existsSync('template.yaml')) {
            const template = fs.readFileSync('template.yaml', 'utf8');
            const lines = template.split('\n');
            let inResources = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.match(/^Resources:/)) { inResources = true; continue; }
                if (inResources && line.match(/^[A-Z]\w+:/)) { inResources = false; }

                if (inResources && line.match(/^  [A-Z]\w+:/)) {
                    const fnName = line.trim().replace(':', '');
                    let isFunction = false;
                    let method = 'GET'; // Default
                    let pathPattern = '/'; // Default

                    for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
                        if (lines[j].includes('Type: AWS::Serverless::Function')) isFunction = true;
                        const mMatch = lines[j].match(/Method:\s*(get|post|put|delete)/i);
                        if (mMatch) method = mMatch[1].toUpperCase();
                        const pMatch = lines[j].match(/Path:\s*(.+)/);
                        if (pMatch) pathPattern = pMatch[1].trim();
                        if (j > i + 1 && lines[j].match(/^  [A-Z]\w+:/)) break;
                    }
                    if (isFunction) functions.push({ name: fnName, method, path: pathPattern });
                }
            }
        }

        if (functions.length === 0) {
            console.error("❌ No functions found in template.yaml");
            process.exit(1);
        }

        console.log("\nAvailable Functions:");
        functions.forEach((f, i) => console.log(`${i + 1}. ${f.name} \t[${f.method}] ${f.path}`));

        let selectedFn;
        const choice = await question(`\nEnter Function ID (default 1): `);
        const choiceInt = parseInt(choice.trim()) || 1;

        if (choiceInt > 0 && choiceInt <= functions.length) {
            selectedFn = functions[choiceInt - 1];
        } else {
            console.error("❌ Invalid selection");
            process.exit(1);
        }

        // 2. Load User's Simple Event Data
        const userEventPath = path.join('events', `${selectedFn.name}.json`);
        let userEventData = {};

        if (!fs.existsSync(userEventPath)) {
            console.warn(`⚠️  Event file not found at: ${userEventPath}`);
            const create = await question(`   Create default event file? (y/n): `);
            if (create.trim().toLowerCase() === 'y') {
                if (!fs.existsSync('events')) fs.mkdirSync('events');
                // Create a SIMPLE event file
                userEventData = {
                    body: { message: "Hello from local test" },
                    queryParams: { foo: "bar" },
                    headers: { "Content-Type": "application/json" }
                };
                fs.writeFileSync(userEventPath, JSON.stringify(userEventData, null, 2));
                console.log(`   ✅ Created ${userEventPath}`);
            } else {
                console.error("❌ Aborted.");
                process.exit(1);
            }
        } else {
            console.log(`\n📂 Using event file: ${userEventPath}`);
            try {
                userEventData = JSON.parse(fs.readFileSync(userEventPath, 'utf8'));
            } catch (e) {
                console.error("❌ Failed to parse event JSON");
                process.exit(1);
            }
        }

        // 3. Generate AWS Proxy Event (The Heavy Lifting)
        const proxyEvent = {
            body: typeof userEventData.body === 'string' ? userEventData.body : JSON.stringify(userEventData.body || {}),
            resource: selectedFn.path,
            path: selectedFn.path, // In a real scenario, we'd replace {params} here
            httpMethod: selectedFn.method,
            isBase64Encoded: false,
            queryStringParameters: userEventData.queryParams || {},
            pathParameters: userEventData.pathParams || {},
            headers: userEventData.headers || {}
        };

        // Write temp file
        const tempEventPath = path.join(os.tmpdir(), 'sam-event.json');
        fs.writeFileSync(tempEventPath, JSON.stringify(proxyEvent, null, 2));

        console.log(`\n⚙️  Running: sam build`);
        execSync('sam build', { stdio: 'inherit' });

        console.log(`\n⚡ Invoking ${selectedFn.name}...`);
        const cmd = `sam local invoke ${selectedFn.name} -e "${tempEventPath}"`; // Quote path for safety
        console.log(`> ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });

    } catch (err) {
        console.error("\n❌ Error:", err.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

main();
