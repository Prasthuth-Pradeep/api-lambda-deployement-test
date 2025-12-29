# AWS SAM Usage Guide

This project is built using the AWS Serverless Application Model (SAM). This guide covers how to build, test, and deploy your serverless application effectively.

## prerequisites

Before you begin, ensure you have the following installed:
*   **AWS SAM CLI**: The command-line tool for building and deploying.
*   **Docker Desktop**: Required for running Lambda functions locally (`sam local invoke`).

---

## 1. Building the Project
Before running or deploying, you must build your application. This compiles your code and installs dependencies.

```bash
sam build
```
*   **When to run:** Every time you modify your code (`app.js`) or template (`template.yaml`).
*   **What it does:** Creates an `.aws-sam` directory with the processed artifacts.

---

## 2. Local Testing (`sam local invoke`)
You can run your Lambda functions locally on your machine. This requires Docker to be running.

### Invoke a Specific Function
To run a function defined in `template.yaml`:

```bash
sam local invoke HelloWorldFunction
```

### Invoke with Custom Events
To simulate specific inputs (like a POST body), create a JSON event file (e.g., `events/post-event.json`) and pass it:

```bash
sam local invoke HelloWorldPostFunction -e events/post-event.json
```

### Console Logging Tips
Logs map directly to the terminal output:
*   `console.log()`: Standard information.
*   `console.error()`: highlighted errors (Best for `catch` blocks).
*   **Deep Objects**: Use `console.dir(obj, { depth: null })` to see full object structures that `console.log` might truncate.
*   **Performance**: Use `console.time("Label")` and `console.timeEnd("Label")` to measure execution time.

---

## 3. development Sync
For rapid development, use `sam sync` to automatically update your cloud stack when you save files.

```bash
sam sync --watch --stack-name <your-stack-name>
```

---

## 4. Deployment
To deploy your application to AWS for the first time:

```bash
sam deploy --guided
```
Follow the prompts to set your Stack Name, Region, and permissions. For subsequent deployments, you can just run `sam deploy`.

---

## 5. Viewing Logs from AWS
To tail logs from your deployed Lambda functions in real-time:

```bash
sam logs -n HelloWorldFunction --stack-name <your-stack-name> --tail
```
