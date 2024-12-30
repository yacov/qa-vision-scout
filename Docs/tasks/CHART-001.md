# CHART-001: Improve Chart Component Type System

## Overview
The chart component currently has several type-related issues that need to be addressed to improve type safety and maintainability.

## Current Issues

### 1. Type Mismatches with Recharts
- NameType can be string | number, but our component primarily handles strings
- DataKey can be string | number | function, but we expect string | number
- LegendType has more variants than we currently support
- **Critical**: Incompatibility between Recharts' Payload type and our ChartPayloadItem type
  - Recharts expects `type: "none" | undefined`
  - Our component needs to support full `LegendType` range
  - Current workaround uses type assertions, needs proper fix

### 2. Payload Type Complexity
- Recharts Payload type is generic and more complex than our usage
- Need to handle both tooltip and legend payload types
- Custom properties like 'color' need to be properly typed
- Need to handle type coercion safely

### 3. Formatter Function Types
- Different components expect different formatter signatures
- Need to handle both simple and complex formatting cases

## Required Changes

### 1. Type Hierarchy
- [ ] Create base interface for chart data
- [ ] Create specialized interfaces for different chart types
- [ ] Add proper generic constraints
- [ ] Document type hierarchy
- [ ] Create proper type mapping between Recharts and our types

### 2. Type Guards
- [ ] Implement comprehensive type guards for all payload variations
- [ ] Add runtime validation for complex types
- [ ] Create utility functions for type checking
- [ ] Add validation for LegendType variations

### 3. Adapter Layer
- [ ] Create adapter functions for Recharts integration
- [ ] Handle type conversions safely
- [ ] Add error handling for type mismatches
- [ ] Implement proper type coercion for LegendType

### 4. Testing
- [ ] Add unit tests for type guards
- [ ] Add integration tests for chart components
- [ ] Test edge cases and error handling
- [ ] Add specific tests for type coercion

## Implementation Plan

1. Phase 1: Type Definition
   - Create new type hierarchy
   - Document type relationships
   - Add JSDoc comments
   - Create proper type mappings

2. Phase 2: Runtime Safety
   - Implement type guards
   - Add validation functions
   - Create adapter layer
   - Handle type coercion

3. Phase 3: Testing
   - Add unit tests
   - Add integration tests
   - Document test cases
   - Test type coercion

4. Phase 4: Migration
   - Update existing components
   - Fix type errors
   - Update documentation
   - Remove type assertions

## Dependencies
- Recharts version: ^2.0.0
- TypeScript version: ^4.9.0

## Notes
- Breaking changes may be required
- Need to maintain backward compatibility where possible
- Consider performance impact of runtime checks
- Current workaround uses type assertions, which is not ideal
- Need to properly handle LegendType variations
- Consider creating a custom type system for chart payloads 