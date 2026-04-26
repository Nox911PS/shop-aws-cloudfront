## Initialization and Setup

### 1. Prerequisites
- Install **Node.js** (20.x or higher).
- Configure **AWS CLI** with valid credentials.
- Install AWS CDK globally:

```bash
npm install -g aws-cdk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root:

```env
CDK_ACCOUNT=000000000000
CDK_REGION=eu-north-1
ALLOWED_ORIGIN=https://your-cloudfront-domain
PRODUCTS_TABLE_NAME=Products
STOCKS_TABLE_NAME=Stocks
```

Notes:
- `ALLOWED_ORIGIN` (singular) is used by Lambdas and CDK stack configuration.
- `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` can be provided by the AWS/CDK environment and are used as fallback values.

### 4. Build

```bash
npm run build
```

### 5. Synthesize CloudFormation Template

```bash
npm run synth
```

### 6. Deploy

```bash
npm run deploy
```

`deploy` automatically runs `build` first (`predeploy`).

### 7. Useful Scripts

```bash
npm test
npm run fillTables
```

### 8. API Documentation
OpenAPI spec: `swagger.yaml`

You can import it into Swagger Editor to browse and test endpoints.

### 9. Resource Links
- Frontend (Angular App): https://dqf8vlilpkdl9.cloudfront.net/
- Backend API (API Gateway URL): https://54qzly9jwb.execute-api.eu-north-1.amazonaws.com/prod
