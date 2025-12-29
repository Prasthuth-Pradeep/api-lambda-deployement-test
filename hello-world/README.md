# AWS SAM Usage Guide

This project is built using the AWS Serverless Application Model (SAM). This guide covers how to build and test your serverless application effectively.

## Prerequisites

Before you begin, ensure you have the following installed:
*   **AWS SAM CLI**: The command-line tool for building and testing.
*   **Docker Desktop**: Required for running Lambda functions locally (`sam local invoke`).
*   **Node.js**: Required to run the event generation scripts.

---

## 1. Local Testing (Simplified Workflow)

We have created a unified workflow to make local testing easy, allowing you to use simple JSON files instead of complex API Gateway proxy events.

### Step 1: Create your Test Event
The `events/` folder is gitignored to keep your local test data private. You must create the input file yourself.

Create a file named **`events/event.json`** inside the `hello-world/` directory.

**Structure:**
You can provide just a body, or headers and a body.

**Option A: Body Only**
```json
{
  "name": "Developer",
  "action": "testing"
}
```

**Option B: Headers + Body**
```json
{
  "headers": {
    "Authorization": "Bearer token",
    "Language": "en"
  },
  "body": {
    "name": "Developer",
    "action": "testing"
  }
}
```

### Step 2: Run the Test
We have a helper script that auto-generates the necessary AWS Proxy event structure, builds the app, and invokes it.

```bash
npm run test-local
```

**What this does:**
1.  Generates `events/proxy-event.json` from your `events/event.json`.
2.  Runs `sam build`.
3.  Runs `sam local invoke` using the generated proxy event.

---

## 2. Standard SAM Commands

If you prefer to run commands manually or need to debug specific steps:

### Build
```bash
sam build
```

### Invoke (Manual)
If you have a proxy event file ready:
```bash
sam local invoke HelloWorldPostFunction -e events/proxy-event.json
```

---

## 3. Logging Tips
*   `console.log()`: Standard output.
*   `console.error()`: Highlighted errors in CloudWatch.
*   **Context**: The `context` object is logged in `app.js` to show runtime info (request ID, memory limit, etc.).
