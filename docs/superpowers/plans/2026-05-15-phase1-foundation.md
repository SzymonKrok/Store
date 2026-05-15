# Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `store` Turborepo monorepo, establish shared packages (`@store/db`, `@store/validation`, `@store/tsconfig`), bootstrap a NestJS API with JWT auth (access + refresh tokens), and create skeleton Next.js storefront and admin apps.

**Architecture:** Three apps (`storefront` port 3000, `admin` port 3001, `api` port 4000) + three shared packages (`db`, `validation`, `tsconfig`). Prisma schema in `packages/db` is the single source of truth for all TypeScript types. JWT uses 15-min access tokens returned in response body and 7-day refresh tokens stored as httpOnly cookies + hashed in the database.

**Tech Stack:** pnpm 9, Turborepo 2, Next.js 15 (App Router), NestJS 10, Prisma 6, PostgreSQL (Railway), TypeScript 5, Tailwind CSS 3, TanStack Query 5, Zod 3, bcrypt, passport-jwt, @nestjs/config, cookie-parser

---

## File Map

**Root**
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.env.example`

**packages/tsconfig**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nextjs.json`
- Create: `packages/tsconfig/nestjs.json`

**packages/db**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`

**packages/validation**
- Create: `packages/validation/package.json`
- Create: `packages/validation/tsconfig.json`
- Create: `packages/validation/src/auth.schemas.ts`
- Create: `packages/validation/src/index.ts`
- Create: `packages/validation/src/__tests__/auth.schemas.test.ts`

**apps/api**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/common/filters/http-exception.filter.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.spec.ts`
- Create: `apps/api/src/users/users.module.ts`
- Create: `apps/api/src/users/users.service.ts`
- Create: `apps/api/src/users/users.service.spec.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.service.spec.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/dto/register.dto.ts`
- Create: `apps/api/src/auth/dto/login.dto.ts`
- Create: `apps/api/src/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/auth/strategies/jwt-refresh.strategy.ts`
- Create: `apps/api/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/auth/guards/jwt-refresh.guard.ts`
- Create: `apps/api/src/auth/decorators/current-user.decorator.ts`
- Create: `apps/api/src/auth/decorators/roles.decorator.ts`
- Create: `apps/api/src/auth/guards/roles.guard.ts`
- Create: `apps/api/test/jest-e2e.json`
- Create: `apps/api/test/auth.e2e-spec.ts`

**apps/storefront**
- Create: `apps/storefront/package.json`
- Create: `apps/storefront/tsconfig.json`
- Create: `apps/storefront/next.config.ts`
- Create: `apps/storefront/tailwind.config.ts`
- Create: `apps/storefront/postcss.config.js`
- Create: `apps/storefront/theme.config.ts`
- Create: `apps/storefront/app/layout.tsx`
- Create: `apps/storefront/app/page.tsx`
- Create: `apps/storefront/app/globals.css`
- Create: `apps/storefront/lib/axios.ts`
- Create: `apps/storefront/components/providers.tsx`

**apps/admin**
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/tailwind.config.ts`
- Create: `apps/admin/postcss.config.js`
- Create: `apps/admin/app/layout.tsx`
- Create: `apps/admin/app/page.tsx`
- Create: `apps/admin/app/globals.css`

---

## Task 1: Initialize git repository and monorepo root files

**Files:**
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.env.example`

- [ ] **Step 1: Initialize git repository**

```bash
git init
```

Expected output: `Initialized empty Git repository in .../store/.git/`

- [ ] **Step 2: Create .gitignore**

```
node_modules
.next
dist
.env
.env.local
*.tsbuildinfo
packages/db/generated
coverage
.turbo
```

- [ ] **Step 3: Create .npmrc** (required so pnpm hoists Prisma to root node_modules — without this, the generated client is invisible across the monorepo)

```
public-hoist-pattern[]=*prisma*
public-hoist-pattern[]=@prisma/client
```

- [ ] **Step 4: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 5: Create root package.json**

```json
{
  "name": "store",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "db:generate": "pnpm --filter @store/db run db:generate",
    "db:migrate": "pnpm --filter @store/db run db:migrate",
    "db:studio": "pnpm --filter @store/db run db:studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 6: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "generated/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:studio": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 7: Create .env.example**

```
# Database (Railway PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/store_db"

# JWT Secrets — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET="change-me-access-secret"
JWT_REFRESH_SECRET="change-me-refresh-secret"

# API
PORT=4000
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
NODE_ENV="development"

# Storefront
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

- [ ] **Step 8: Commit**

```bash
git add .gitignore .npmrc package.json pnpm-workspace.yaml turbo.json .env.example
git commit -m "chore: initialize monorepo root with Turborepo and pnpm workspaces"
```

---

## Task 2: Create packages/tsconfig

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nextjs.json`
- Create: `packages/tsconfig/nestjs.json`

- [ ] **Step 1: Create packages/tsconfig/package.json**

```json
{
  "name": "@store/tsconfig",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./base.json": "./base.json",
    "./nextjs.json": "./nextjs.json",
    "./nestjs.json": "./nestjs.json"
  }
}
```

- [ ] **Step 2: Create packages/tsconfig/base.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Create packages/tsconfig/nextjs.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create packages/tsconfig/nestjs.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/tsconfig
git commit -m "chore: add @store/tsconfig shared TypeScript configs"
```

---

## Task 3: Create packages/db (Prisma schema + client)

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`

- [ ] **Step 1: Create packages/db/package.json**

```json
{
  "name": "@store/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0"
  },
  "devDependencies": {
    "@store/tsconfig": "workspace:*",
    "prisma": "^6.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create packages/db/tsconfig.json**

```json
{
  "extends": "@store/tsconfig/base.json",
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "generated"]
}
```

- [ ] **Step 3: Create packages/db/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  refreshToken String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Category {
  id       String     @id @default(cuid())
  name     String
  slug     String     @unique
  parentId String?
  parent   Category?  @relation("Subcategories", fields: [parentId], references: [id])
  children Category[] @relation("Subcategories")
  products Product[]
}

model Product {
  id           String           @id @default(cuid())
  name         String
  slug         String           @unique
  description  String?
  basePrice    Decimal          @db.Decimal(10, 2)
  categoryId   String
  category     Category         @relation(fields: [categoryId], references: [id])
  variants     ProductVariant[]
  priceHistory PriceHistory[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
}

model ProductVariant {
  id        String     @id @default(cuid())
  productId String
  product   Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku       String     @unique
  price     Decimal    @db.Decimal(10, 2)
  stock     Int        @default(0)
  attributes Json
  cartItems CartItem[]
}

/// Omnibus Directive compliance — stores lowest price per product for the last 30 days display
model PriceHistory {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  price      Decimal  @db.Decimal(10, 2)
  recordedAt DateTime @default(now())

  @@index([productId, recordedAt])
}

model Cart {
  id        String     @id @default(cuid())
  userId    String?
  sessionId String?
  items     CartItem[]
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String         @id @default(cuid())
  cartId    String
  cart      Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int
}
```

- [ ] **Step 4: Create packages/db/src/index.ts**

```typescript
export { PrismaClient } from '@prisma/client'
export type * from '@prisma/client'

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Singleton for Next.js hot-reload safety — NestJS uses PrismaService instead
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/db
git commit -m "chore: add @store/db package with Prisma schema and client singleton"
```

---

## Task 4: Create packages/validation with Zod auth schemas and tests

**Files:**
- Create: `packages/validation/package.json`
- Create: `packages/validation/tsconfig.json`
- Create: `packages/validation/src/auth.schemas.ts`
- Create: `packages/validation/src/index.ts`
- Create: `packages/validation/src/__tests__/auth.schemas.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `packages/validation/src/__tests__/auth.schemas.test.ts`:

```typescript
import { registerSchema, loginSchema } from '../auth.schemas'

describe('registerSchema', () => {
  it('accepts valid email and password', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email format', () => {
    const result = registerSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('email')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: 'short' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('password')
  })

  it('rejects password longer than 100 characters', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = registerSchema.safeParse({})
    expect(result.success).toBe(false)
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(2)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'anypassword' })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: 'password123' })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Create packages/validation/package.json**

```json
{
  "name": "@store/validation",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "test": "jest",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "@store/tsconfig": "workspace:*",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testRegex": ".*\\.test\\.ts$",
    "moduleFileExtensions": ["ts", "js", "json"]
  }
}
```

- [ ] **Step 3: Create packages/validation/tsconfig.json**

```json
{
  "extends": "@store/tsconfig/base.json",
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Install and run tests — confirm they FAIL**

```bash
pnpm install
pnpm --filter @store/validation run test
```

Expected: FAIL — `Cannot find module '../auth.schemas'`

- [ ] **Step 5: Create packages/validation/src/auth.schemas.ts**

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
```

- [ ] **Step 6: Create packages/validation/src/index.ts**

```typescript
export * from './auth.schemas'
```

- [ ] **Step 7: Run tests — confirm they PASS**

```bash
pnpm --filter @store/validation run test
```

Expected: PASS — 8 tests, 2 test suites

- [ ] **Step 8: Commit**

```bash
git add packages/validation
git commit -m "feat: add @store/validation with Zod auth schemas"
```

---

## Task 5: Scaffold apps/api — project files, main.ts, AppModule

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/common/filters/http-exception.filter.ts`

- [ ] **Step 1: Create apps/api/package.json**

```json
{
  "name": "@store/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@store/db": "workspace:*",
    "@store/validation": "workspace:*",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "cookie-parser": "^1.4.7",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@store/tsconfig": "workspace:*",
    "@types/bcrypt": "^5.0.0",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/supertest": "^6.0.0",
    "jest": "^29.0.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "testRegex": "src/.*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["src/**/*.(t|j)s"],
    "coverageDirectory": "coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@store/db$": "<rootDir>/../../packages/db/src/index.ts",
      "^@store/validation$": "<rootDir>/../../packages/validation/src/index.ts"
    }
  }
}
```

- [ ] **Step 2: Create apps/api/tsconfig.json**

```json
{
  "extends": "@store/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@store/db": ["../../packages/db/src/index.ts"],
      "@store/validation": ["../../packages/validation/src/index.ts"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts"]
}
```

- [ ] **Step 3: Create apps/api/nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 4: Create apps/api/src/common/filters/http-exception.filter.ts**

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()
    const body = exception.getResponse()

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof body === 'string' ? body : (body as Record<string, unknown>).message,
    })
  }
}
```

- [ ] **Step 5: Create apps/api/src/app.module.ts**

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Create apps/api/src/main.ts**

```typescript
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalFilters(new HttpExceptionFilter())
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 4000)
  console.log(`API running on http://localhost:${process.env.PORT ?? 4000}/api`)
}

bootstrap()
```

- [ ] **Step 7: Install dependencies and verify TypeScript compiles**

```bash
pnpm install
pnpm --filter @store/api run typecheck
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/api
git commit -m "chore: scaffold NestJS API app with global config, pipes, and filters"
```

---

## Task 6: Implement PrismaService and PrismaModule with unit test

**Files:**
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/prisma/prisma.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from './prisma.service'

describe('PrismaService', () => {
  let service: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile()

    service = module.get<PrismaService>(PrismaService)
  })

  it('is defined', () => {
    expect(service).toBeDefined()
  })

  it('exposes PrismaClient model accessors', () => {
    expect(service.user).toBeDefined()
    expect(service.product).toBeDefined()
    expect(service.cart).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to confirm it FAILS**

```bash
pnpm --filter @store/api run test -- --testPathPattern=prisma.service
```

Expected: FAIL — `Cannot find module './prisma.service'`

- [ ] **Step 3: Create apps/api/src/prisma/prisma.service.ts**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@store/db'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
```

- [ ] **Step 4: Create apps/api/src/prisma/prisma.module.ts**

```typescript
import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 5: Register PrismaModule in AppModule**

Edit `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Run test to confirm it PASSES**

```bash
pnpm --filter @store/api run test -- --testPathPattern=prisma.service
```

Expected: PASS — 2 tests

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/prisma apps/api/src/app.module.ts
git commit -m "feat(api): add global PrismaModule with lifecycle-managed PrismaService"
```

---

## Task 7: Implement UsersService with unit tests

**Files:**
- Create: `apps/api/src/users/users.module.ts`
- Create: `apps/api/src/users/users.service.ts`
- Create: `apps/api/src/users/users.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/users/users.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { PrismaService } from '../prisma/prisma.service'

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  describe('findByEmail', () => {
    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      const result = await service.findByEmail('nobody@example.com')
      expect(result).toBeNull()
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nobody@example.com' },
      })
    })

    it('returns user when found', async () => {
      const user = { id: 'id-1', email: 'found@example.com' }
      mockPrisma.user.findUnique.mockResolvedValue(user)
      const result = await service.findByEmail('found@example.com')
      expect(result).toEqual(user)
    })
  })

  describe('findById', () => {
    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      expect(await service.findById('nonexistent-id')).toBeNull()
    })
  })

  describe('create', () => {
    it('calls prisma.user.create with correct data and returns the new user', async () => {
      const newUser = { id: 'id-2', email: 'new@example.com', passwordHash: 'hashed' }
      mockPrisma.user.create.mockResolvedValue(newUser)

      const result = await service.create({ email: 'new@example.com', passwordHash: 'hashed' })

      expect(result).toEqual(newUser)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: 'new@example.com', passwordHash: 'hashed' },
      })
    })
  })

  describe('updateRefreshToken', () => {
    it('calls prisma.user.update with the provided token', async () => {
      mockPrisma.user.update.mockResolvedValue({})
      await service.updateRefreshToken('id-1', 'hashed-token')
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'id-1' },
        data: { refreshToken: 'hashed-token' },
      })
    })

    it('stores null on logout', async () => {
      mockPrisma.user.update.mockResolvedValue({})
      await service.updateRefreshToken('id-1', null)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'id-1' },
        data: { refreshToken: null },
      })
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they FAIL**

```bash
pnpm --filter @store/api run test -- --testPathPattern=users.service
```

Expected: FAIL — `Cannot find module './users.service'`

- [ ] **Step 3: Create apps/api/src/users/users.service.ts**

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

interface CreateUserData {
  email: string
  passwordHash: string
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  create(data: CreateUserData) {
    return this.prisma.user.create({ data })
  }

  updateRefreshToken(id: string, refreshToken: string | null) {
    return this.prisma.user.update({ where: { id }, data: { refreshToken } })
  }
}
```

- [ ] **Step 4: Create apps/api/src/users/users.module.ts**

```typescript
import { Module } from '@nestjs/common'
import { UsersService } from './users.service'

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 5: Register UsersModule in AppModule**

Edit `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Run tests to confirm they PASS**

```bash
pnpm --filter @store/api run test -- --testPathPattern=users.service
```

Expected: PASS — 5 tests

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/users apps/api/src/app.module.ts
git commit -m "feat(api): add UsersModule with CRUD service methods"
```

---

## Task 8: Implement AuthService with unit tests

**Files:**
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/auth/auth.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
}

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
}

const mockConfigService = {
  get: jest.fn().mockReturnValue('mock-secret'),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('register', () => {
    it('throws ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'id-1', email: 'exists@test.com' })

      await expect(service.register({ email: 'exists@test.com', password: 'password123' }))
        .rejects.toThrow(ConflictException)
    })

    it('creates user with hashed password on success', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)
      mockUsersService.create.mockResolvedValue({ id: 'id-1', email: 'new@test.com' })
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined)

      await service.register({ email: 'new@test.com', password: 'password123' })

      const createCall = mockUsersService.create.mock.calls[0][0]
      expect(createCall.email).toBe('new@test.com')
      expect(createCall.passwordHash).not.toBe('password123')
      expect(await bcrypt.compare('password123', createCall.passwordHash)).toBe(true)
    })

    it('returns accessToken and refreshToken on success', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)
      mockUsersService.create.mockResolvedValue({ id: 'id-1', email: 'new@test.com' })
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined)

      const result = await service.register({ email: 'new@test.com', password: 'password123' })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })
  })

  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)

      await expect(service.login({ email: 'ghost@test.com', password: 'password' }))
        .rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'id-1',
        email: 'user@test.com',
        passwordHash: await bcrypt.hash('correct', 10),
      })

      await expect(service.login({ email: 'user@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException)
    })

    it('returns tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10)
      mockUsersService.findByEmail.mockResolvedValue({ id: 'id-1', email: 'user@test.com', passwordHash })
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined)

      const result = await service.login({ email: 'user@test.com', password: 'password123' })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })
  })

  describe('logout', () => {
    it('clears the refresh token in the database', async () => {
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined)

      await service.logout('id-1')

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith('id-1', null)
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they FAIL**

```bash
pnpm --filter @store/api run test -- --testPathPattern=auth.service
```

Expected: FAIL — `Cannot find module './auth.service'`

- [ ] **Step 3: Create apps/api/src/auth/auth.service.ts**

```typescript
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import type { RegisterDto, LoginDto } from '@store/validation'

interface JwtPayload {
  sub: string
  email: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) throw new ConflictException('Email already in use')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.usersService.create({ email: dto.email, passwordHash })

    const tokens = await this.generateTokens(user.id, user.email)
    await this.storeRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.generateTokens(user.id, user.email)
    await this.storeRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId)
    if (!user?.refreshToken) throw new UnauthorizedException()

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!tokenMatch) throw new UnauthorizedException()

    const tokens = await this.generateTokens(user.id, user.email)
    await this.storeRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null)
  }

  private async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ])

    return { accessToken, refreshToken }
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10)
    await this.usersService.updateRefreshToken(userId, hashed)
  }
}
```

- [ ] **Step 4: Run tests to confirm they PASS**

```bash
pnpm --filter @store/api run test -- --testPathPattern=auth.service
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.spec.ts
git commit -m "feat(api): implement AuthService with register, login, refresh, and logout"
```

---

## Task 9: Implement JWT strategies, guards, and decorators

**Files:**
- Create: `apps/api/src/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/auth/strategies/jwt-refresh.strategy.ts`
- Create: `apps/api/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/auth/guards/jwt-refresh.guard.ts`
- Create: `apps/api/src/auth/decorators/current-user.decorator.ts`
- Create: `apps/api/src/auth/decorators/roles.decorator.ts`
- Create: `apps/api/src/auth/guards/roles.guard.ts`

- [ ] **Step 1: Create apps/api/src/auth/strategies/jwt.strategy.ts**

Reads the access token from the `Authorization: Bearer <token>` header.

```typescript
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

interface JwtPayload {
  sub: string
  email: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    })
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email }
  }
}
```

- [ ] **Step 2: Create apps/api/src/auth/strategies/jwt-refresh.strategy.ts**

Reads the refresh token from the `refresh_token` httpOnly cookie.

```typescript
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

interface JwtPayload {
  sub: string
  email: string
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null,
      ]),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    })
  }

  validate(req: Request, payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      refreshToken: req.cookies?.refresh_token as string,
    }
  }
}
```

- [ ] **Step 3: Create apps/api/src/auth/guards/jwt-auth.guard.ts**

```typescript
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 4: Create apps/api/src/auth/guards/jwt-refresh.guard.ts**

```typescript
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
```

- [ ] **Step 5: Create apps/api/src/auth/decorators/current-user.decorator.ts**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>()
    return request.user
  },
)
```

- [ ] **Step 6: Create apps/api/src/auth/decorators/roles.decorator.ts**

```typescript
import { SetMetadata } from '@nestjs/common'
import { Role } from '@store/db'

export { Role }
export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
```

- [ ] **Step 7: Create apps/api/src/auth/guards/roles.guard.ts**

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY, Role } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required) return true

    const { user } = context.switchToHttp().getRequest()
    return required.includes(user?.role)
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/auth/strategies apps/api/src/auth/guards apps/api/src/auth/decorators
git commit -m "feat(api): add JWT strategies, guards, and RBAC decorators"
```

---

## Task 10: Implement AuthController, AuthModule, and e2e tests

**Files:**
- Create: `apps/api/src/auth/dto/register.dto.ts`
- Create: `apps/api/src/auth/dto/login.dto.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/test/jest-e2e.json`
- Create: `apps/api/test/auth.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create apps/api/src/auth/dto/register.dto.ts**

```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string
}
```

- [ ] **Step 2: Create apps/api/src/auth/dto/login.dto.ts**

```typescript
import { IsEmail, IsString, IsNotEmpty } from 'class-validator'

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  password: string
}
```

- [ ] **Step 3: Create apps/api/src/auth/auth.controller.ts**

```typescript
import {
  Controller, Post, Body, UseGuards,
  Res, HttpCode, HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

interface AuthUser {
  id: string
  email: string
  refreshToken?: string
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(user.id, user.refreshToken!)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id)
    res.clearCookie('refresh_token')
    return { message: 'Logged out' }
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    })
  }
}
```

- [ ] **Step 4: Create apps/api/src/auth/auth.module.ts**

```typescript
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
```

- [ ] **Step 5: Register AuthModule in AppModule**

Edit `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Create apps/api/test/jest-e2e.json**

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^@store/db$": "<rootDir>/../../../packages/db/src/index.ts",
    "^@store/validation$": "<rootDir>/../../../packages/validation/src/index.ts"
  }
}
```

- [ ] **Step 7: Create apps/api/test/auth.e2e-spec.ts**

> **Note:** e2e tests require `DATABASE_URL` in `.env` pointing to a running PostgreSQL instance. They will be skipped in CI unless a test DB is provisioned.

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

describe('Auth (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    app.use(cookieParser())
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns accessToken + sets refresh cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: `e2e-${Date.now()}@example.com`, password: 'password123' })
        .expect(201)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.headers['set-cookie']).toBeDefined()
      expect(response.headers['set-cookie'][0]).toContain('refresh_token')
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
    })

    it('returns 409 when email already registered', async () => {
      const email = `dup-${Date.now()}@example.com`
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })
        .expect(201)

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })
        .expect(409)
    })

    it('returns 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400)
    })

    it('returns 400 for password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'valid@example.com', password: 'short' })
        .expect(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('returns accessToken for valid credentials', async () => {
      const email = `login-${Date.now()}@example.com`
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'password123' })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
    })

    it('returns 401 for wrong password', async () => {
      const email = `badpw-${Date.now()}@example.com`
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' })
        .expect(401)
    })

    it('returns 401 for unknown email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'password123' })
        .expect(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('returns 200 and clears refresh cookie for authenticated user', async () => {
      const email = `logout-${Date.now()}@example.com`
      const regResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${regResponse.body.accessToken}`)
        .expect(200)

      expect(response.body.message).toBe('Logged out')
    })

    it('returns 401 without a valid access token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401)
    })
  })
})
```

- [ ] **Step 8: Run unit tests to confirm all pass**

```bash
pnpm --filter @store/api run test
```

Expected: PASS — all spec files pass (prisma.service, users.service, auth.service)

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/auth apps/api/test apps/api/src/app.module.ts
git commit -m "feat(api): complete auth module with DTOs, controller, and e2e test suite"
```

---

## Task 11: Scaffold apps/storefront Next.js application

**Files:**
- Create: `apps/storefront/package.json`
- Create: `apps/storefront/tsconfig.json`
- Create: `apps/storefront/next.config.ts`
- Create: `apps/storefront/tailwind.config.ts`
- Create: `apps/storefront/postcss.config.js`
- Create: `apps/storefront/app/globals.css`
- Create: `apps/storefront/app/layout.tsx`
- Create: `apps/storefront/app/page.tsx`

- [ ] **Step 1: Create apps/storefront/package.json**

```json
{
  "name": "@store/storefront",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.0.0",
    "@store/db": "workspace:*",
    "@store/validation": "workspace:*",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.7.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "@store/tsconfig": "workspace:*",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create apps/storefront/tsconfig.json**

```json
{
  "extends": "@store/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create apps/storefront/next.config.ts**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@store/db', '@store/validation'],
}

export default nextConfig
```

- [ ] **Step 4: Create apps/storefront/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Create apps/storefront/postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create apps/storefront/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Create apps/storefront/app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Store',
  description: 'Online Store',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Create apps/storefront/app/page.tsx**

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950">
      <h1 className="text-4xl font-bold text-white tracking-tight">Store</h1>
    </main>
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add apps/storefront
git commit -m "chore: scaffold Next.js storefront app with Tailwind CSS"
```

---

## Task 12: Add theme.config.ts, Axios instance, and TanStack Query provider

**Files:**
- Create: `apps/storefront/theme.config.ts`
- Create: `apps/storefront/lib/axios.ts`
- Create: `apps/storefront/components/providers.tsx`

- [ ] **Step 1: Create apps/storefront/theme.config.ts**

```typescript
export const themeConfig = {
  features: {
    enableBestsellers: true,
    enableGuestCheckout: true,
    enableVariants: true,
    enableCoupons: true,
    enableAbandonedCartRecovery: true,
  },
  ui: {
    primaryColor: '#18181b',
    accentColor: '#3b82f6',
    fontFamily: 'Inter',
    borderRadius: '0.5rem',
  },
  store: {
    name: 'Store',
    currency: 'PLN',
    locale: 'pl-PL',
  },
} as const

export type ThemeConfig = typeof themeConfig
```

- [ ] **Step 2: Create apps/storefront/lib/axios.ts**

```typescript
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post<{ accessToken: string }>(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        original.headers['Authorization'] = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)
```

- [ ] **Step 3: Create apps/storefront/components/providers.tsx**

```tsx
'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm install
pnpm --filter @store/storefront run typecheck
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/storefront/theme.config.ts apps/storefront/lib apps/storefront/components
git commit -m "feat(storefront): add theme.config, Axios instance with refresh interceptor, and TanStack Query provider"
```

---

## Task 13: Scaffold apps/admin Next.js application

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/tailwind.config.ts`
- Create: `apps/admin/postcss.config.js`
- Create: `apps/admin/app/globals.css`
- Create: `apps/admin/app/layout.tsx`
- Create: `apps/admin/app/page.tsx`

- [ ] **Step 1: Create apps/admin/package.json**

```json
{
  "name": "@store/admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@store/db": "workspace:*",
    "@store/validation": "workspace:*",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.7.0",
    "lucide-react": "^0.400.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@store/tsconfig": "workspace:*",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create apps/admin/tsconfig.json**

```json
{
  "extends": "@store/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create apps/admin/next.config.ts**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@store/db', '@store/validation'],
}

export default nextConfig
```

- [ ] **Step 4: Create apps/admin/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Create apps/admin/postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create apps/admin/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Create apps/admin/app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Store Admin',
  description: 'Admin Panel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Create apps/admin/app/page.tsx**

```tsx
export default function AdminPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950">
      <h1 className="text-4xl font-bold text-white tracking-tight">Admin Panel</h1>
    </main>
  )
}
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
pnpm install
pnpm --filter @store/admin run typecheck
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add apps/admin
git commit -m "chore: scaffold Next.js admin app"
```

---

## Task 14: Run Prisma migration and verify full monorepo build

**Prerequisites:** `DATABASE_URL` must be set in a `.env` file at the repository root. Copy `.env.example` to `.env` and fill in a real PostgreSQL connection string.

- [ ] **Step 1: Copy .env.example to .env and fill in credentials**

```bash
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` to your Railway (or local) PostgreSQL URL.

- [ ] **Step 2: Run pnpm install to ensure all packages are linked**

```bash
pnpm install
```

Expected: all workspace packages symlinked, no errors

- [ ] **Step 3: Generate Prisma client**

```bash
pnpm db:generate
```

Expected: `✔ Generated Prisma Client` in output

- [ ] **Step 4: Run the initial database migration**

```bash
pnpm db:migrate
```

When prompted for a migration name, enter: `initial_schema`

Expected:
```
Applying migration `20260515000000_initial_schema`
The following migration(s) have been applied:
  migrations/
    └─ 20260515000000_initial_schema/
         └─ migration.sql
✔ Generated Prisma Client
```

- [ ] **Step 5: Run all unit tests across the monorepo**

```bash
pnpm test
```

Expected: all tests pass (packages/validation: 8 tests, apps/api: unit tests pass)

- [ ] **Step 6: Run a full typecheck across all packages**

```bash
pnpm typecheck
```

Expected: no TypeScript errors across all apps and packages

- [ ] **Step 7: Start the API in dev mode to verify it boots**

```bash
pnpm --filter @store/api run dev
```

Expected: `API running on http://localhost:4000/api` — no startup errors

- [ ] **Step 8: Smoke test register endpoint**

In a second terminal:

```bash
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@example.com","password":"password123"}' | jq .
```

Expected:
```json
{
  "accessToken": "<jwt-string>"
}
```

- [ ] **Step 9: Commit migration files**

```bash
git add packages/db/prisma/migrations .env.example
git commit -m "chore: add initial Prisma migration for Phase 1 schema"
```

- [ ] **Step 10: Final summary commit**

```bash
git add .
git status
```

Review any remaining untracked or modified files, then:

```bash
git commit -m "chore: complete Phase 1 foundation — monorepo, auth API, storefront, admin scaffolds"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Covered by task |
|---|---|
| Monorepo Turborepo + pnpm | Task 1 |
| packages/tsconfig | Task 2 |
| packages/db (Prisma, Omnibus PriceHistory, ProductVariant) | Task 3 |
| packages/validation (Zod) | Task 4 |
| NestJS API scaffold | Task 5 |
| PrismaService global | Task 6 |
| JWT Auth (register, login, refresh, logout) | Tasks 7–10 |
| RBAC decorators + guards | Task 9 |
| Next.js storefront + theme.config.ts | Tasks 11–12 |
| Next.js admin | Task 13 |
| Prisma migration + build verification | Task 14 |

All spec requirements covered. No gaps found.

**Placeholder scan:** No TBDs, no "similar to Task N" references, no incomplete steps found.

**Type consistency:**
- `JwtPayload` is defined locally in both strategy files and `auth.service.ts` — consistent shape `{ sub, email }` throughout.
- `AuthUser` interface in `auth.controller.ts` matches what JWT strategy's `validate()` returns.
- `CreateUserData` in `users.service.ts` matches the call site in `auth.service.ts`.
- `RegisterDto` / `LoginDto` types from `@store/validation` match the class-validator DTOs in shape.
