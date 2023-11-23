# Coupon Code Service

This repository contains the implementation of a Coupon Code Service with enhanced fraud mitigation features. The service is built using NestJS and utilizes an in-memory SQLite3 database managed by TypeORM.

## Features

### 1. Add Repeat Counts to Coupon Code

Endpoint: `POST /coupon/add-repeat-counts-code`

```bash
curl -X POST http://localhost:3000/coupon/add-repeat-counts-code -H "Content-Type: application/json" -d '{"code": "HelloWorld", "globalRepeatCount": 5, "userTotalRepeatCount": 10, "userDailyRepeatCount": 2, "userWeeklyRepeatCount": 5}'
```

This API allows you to add repeat count configurations to a specific coupon code. You can set global total repeat counts, user total repeat counts, user daily repeat counts, and user weekly repeat counts.

### 2. Verify Coupon Code Validity

Endpoint: `POST /coupon/verify-coupon`

```bash
curl -X POST http://localhost:3000/coupon/verify-coupon -H "Content-Type: application/json" -d '{"code": "HelloWorld", "userId": 123}'
```

Use this API to verify the validity of a coupon code based on the configured repeat counts. Provide the coupon code and the user ID to check if the coupon can be applied.

### 3. Apply Coupon Code

Endpoint: `POST /coupon/apply-coupon`

```bash
curl -X POST http://localhost:3000/coupon/apply-coupon -H "Content-Type: application/json" -d '{"code": "HelloWorld", "userId": 123}'
```

Apply a coupon code using this API. It validates the coupon using the Verify Coupon Code API and updates the repeat counts accordingly.

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/coupon-code-service.git
   ```

2. Install dependencies:

   ```bash
   cd coupon-code-service
   npm install
   ```

3. Run the application:

   ```bash
   npm run start
   ```

   The service will be available at `http://localhost:3000`.

## Testing

To test the APIs, you can use the provided `curl` commands in the assignment instructions. Additionally, you can write unit tests to cover key functionality. Run tests using:

```bash
npm run test
```

## Database

The service uses an in-memory SQLite3 database managed by TypeORM. This is suitable for testing purposes, but for production, consider integrating with a persistent database.

## Trade-offs and Scalability

In designing this service, trade-offs were made to prioritize simplicity and ease of understanding. For scalability, consider implementing caching mechanisms and migrating to a scalable database solution based on production requirements.

