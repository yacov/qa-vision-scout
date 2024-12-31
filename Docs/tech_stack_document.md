# Technology Stack Documentation

## Frontend

- **Framework**: Next.js 14 (app router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/UI, Radix UI
- **Icons**: Lucide Icons
- **Data Visualization**: Three.js, D3.js, P5.js

## Backend

- **Platform**: Supabase
- **Functions**: Edge Functions (TypeScript)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth

## Testing

### Framework
- **Test Runner**: Vitest
- **Coverage**: @vitest/coverage-v8
- **Mocking**: Vitest's built-in mocking capabilities
- **Environment**: Node.js with native fetch API

### Testing Types
- **Unit Tests**: Component and function level testing
- **Integration Tests**: API endpoint testing
- **Visual Tests**: BrowserStack screenshot comparison
- **E2E Tests**: Cypress for critical user flows

### Testing Tools
- **API Testing**: Native fetch with TypeScript
- **Visual Testing**: BrowserStack Screenshots API
- **AI-Powered Testing**: Claude AI, ChatGPT, Gemini API
- **Automated Testing**: @antiwork/shortest package

## API Integration

- **BrowserStack API**: Screenshot and browser testing
- **Supabase API**: Database and authentication
- **OpenAI API**: AI-powered testing assistance
- **Gemini API**: Visual comparison and analysis

## Development Tools

- **IDE**: Cursor (with AI assistance)
- **Version Control**: Git
- **Package Manager**: npm
- **Build Tool**: Vite
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier

## Infrastructure

- **Hosting**: Vercel (Frontend)
- **Database**: Supabase (PostgreSQL)
- **Functions**: Supabase Edge Functions
- **Storage**: Supabase Storage
- **CDN**: Vercel Edge Network

## Development Environment

- **Node.js**: v18+ (for native fetch support)
- **TypeScript**: v5.0+
- **npm**: v8+
- **Git**: v2.3+

## Quality Assurance

### Testing Coverage Requirements
- Unit Tests: 80% minimum
- Integration Tests: 100% for critical paths
- Visual Tests: All key UI components
- E2E Tests: Critical user flows

### Performance Targets
- Lighthouse Score: 90+ all categories
- Core Web Vitals: Pass all metrics
- API Response Time: <500ms
- Test Execution Time: <5 minutes for full suite

### Code Quality Standards
- TypeScript strict mode enabled
- ESLint configuration enforced
- Prettier formatting required
- Sonar quality gate passing

## Documentation

- **API**: OpenAPI/Swagger
- **Components**: Storybook
- **Code**: TSDoc/JSDoc
- **Testing**: Comprehensive test documentation
- **Architecture**: System design documents
