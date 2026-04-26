## 🚀 Initialization and Setup

### 1. Prerequisites
* Installed **Node.js** (version 20.x or higher).
* Configured **AWS CLI** with valid credentials.
* Globally installed AWS CDK: `npm install -g aws-cdk`.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Configuration
* Create a .env file in the root of the project and add the following parameters:

```
env
CDK_ACCOUNT=0000000000000
CDK_REGION=us-east-1
ALLOWED_ORIGINS=http://localhost:4200,https://cloudfront.net
```

### 4. Build and Deploy
The project uses a custom build via esbuild to meet the requirement for manual bundler configuration.
**Manual Code Build:**
```
npm run build
```

### 5. CloudFormation Template Synthesis:

```
npm run synth
```

### 6.Deploy to AWS Cloud:
```
npm run deploy
```
The deploy script automatically triggers the build (predeploy), so the code in AWS is always up to date.

### 7. API Documentation (Swagger)
The API specification is available in the file: swagger.yaml
You can import this file into Swagger Editor to visualize and test the requests.


### 8. Resource Links

Frontend (Angular App): https://dqf8vlilpkdl9.cloudfront.net/

Backend API (API Gateway URL): https://54qzly9jwb.execute-api.eu-north-1.amazonaws.com/prod
