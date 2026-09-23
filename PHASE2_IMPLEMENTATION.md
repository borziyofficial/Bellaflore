# BellaFlore AI Sales Agent - Phase 2 Implementation

## Overview

Phase 2 of the BellaFlore AI Sales Agent implements persistent order drafts with comprehensive conversation state tracking, product availability validation, and an explicit order confirmation flow. Payment handling is explicitly excluded from this phase.

## Architecture

### Database Schema

**order_drafts table** (PostgreSQL):
- `id` (UUID primary key)
- `customer_phone` (indexed for lookups)
- `delivery_address`, `delivery_latitude`, `delivery_longitude`, `delivery_zone_id`
- `items` (JSONB array of order line items)
- `conversation_state` (JSONB with conversation turns)
- `status` ('active', 'abandoned', 'converted')
- `created_at`, `updated_at`, `abandoned_at` (timestamps with indexes)

### Core Components

#### 1. Draft Management
- `lib/orders/draftRepository.ts`: PostgreSQL repository for CRUD operations
- `lib/orders/draftTypes.ts`: TypeScript type definitions for drafts and conversation state
- `app/api/order-drafts/route.ts`: REST API for draft operations

#### 2. AI Florist Tools (`app/api/ai-florist-tools/route.ts`)

**Core Product Tools:**
- `search_products`: Full-text search with price filters and popularity sorting
- `get_product`: Detailed product information with composition and care instructions
- `validate_product_availability`: Real-time availability checks against catalog

**Address & Delivery:**
- `validate_address`: Yandex Geocoder integration for address validation and coordinates
- `calculate_delivery`: Real delivery zone calculation with actual pricing

**Draft Management:**
- `update_draft`: Update conversation state and collected order data
- `get_draft_summary`: Retrieve complete draft summary for confirmation
- `finalize_order_from_draft`: Convert draft to confirmed order with validation

#### 3. UI Components

**AiFloristChat** (`components/aiSalesAgent/AiFloristChat.tsx`):
- Real-time conversation tracking
- Product recommendation display with inline selection
- Conversation state persistence across turns
- Draft initialization and updates
- Summary button for order review

**OrderDraftSummary** (`components/aiSalesAgent/OrderDraftSummary.tsx`):
- Display complete order details (customer, recipient, delivery, items)
- Calculate and show order total
- Validation indicator for incomplete orders
- Edit and confirm buttons

**AiFloristChatWithSummary** (`components/aiSalesAgent/AiFloristChatWithSummary.tsx`):
- Integrated chat and summary layout
- Responsive grid layout (chat + sidebar on desktop, stacked on mobile)
- Summary loading and state management

## Key Features Implemented

### 1. Persistent Order Drafts
- Orders are saved immediately upon chat initialization
- Draft ID visible to users for reference
- Draft lifecycle: active → abandoned or converted
- Automatic timestamp tracking

### 2. Conversation State Tracking
```typescript
ConversationStateTurn = {
  turn: number,
  timestamp: ISO8601,
  userMessage?: string,
  aiReply?: string,
  recommendedProductIds?: string[]
}
```
- Each turn captures user input and AI response
- Product recommendations tracked with turn
- Full conversation history preserved in database

### 3. Product Availability Validation
- Real-time catalog checks before order confirmation
- Products validated against current inventory
- Graceful error messages for unavailable items
- Support for bulk availability checks

### 4. Real Yandex Integration
- Geocoding for address validation
- Coordinate extraction for delivery zone calculation
- Proper error handling for invalid/ambiguous addresses

### 5. Server-Side Delivery Pricing
- Real delivery zone detection using coordinates
- Accurate delivery cost calculation
- Zone ID tracking in draft for reference

### 6. Order Summary Display
- Organized summary with all required information
- Visual hierarchy: sections for items, customer, recipient, delivery
- Total price calculation
- Completion status indicator

### 7. Explicit Confirmation Flow
- Clear order review before finalization
- Validation checks:
  - All customer data present
  - Recipient information complete
  - Delivery address valid
  - Items selected
  - Products still available
- Disabled confirm button until all requirements met
- Edit capability to return to conversation

## Data Flow

```
1. Chat Initialization
   ↓
2. Create Draft (order-drafts API)
   ↓
3. User Message → AI Response Loop
   ├─ Update Draft with Conversation Turn
   ├─ Fetch Recommended Products
   ├─ Validate Product Availability
   └─ Display Product Cards
   ↓
4. User Requests Summary
   ├─ Load Draft Summary
   ├─ Display Order Details
   └─ Validate Completeness
   ↓
5. User Confirms Order
   ├─ Final Product Availability Check
   ├─ Mark Draft as Converted
   └─ Order Confirmed (Ready for Payment Processing)
```

## API Endpoints

### Order Drafts API (`/api/order-drafts`)

**POST** - Create/Update/Load Draft
```json
{
  "action": "create" | "load" | "update",
  "draftId": "uuid",
  "updates": { /* UpdateOrderDraftInput */ }
}
```

**GET** - Retrieve Draft
```
?phone=<customer_phone> | ?id=<draft_id>
```

**DELETE** - Remove Draft
```
?id=<draft_id>
```

### AI Florist Tools API (`/api/ai-florist-tools`)

All tools follow the same request format:
```json
{
  "tool": "tool_name",
  "params": { /* tool-specific params */ }
}
```

Response format:
```json
{
  "status": "ok" | "error",
  "data": { /* tool-specific data */ },
  "message": "error message if applicable"
}
```

## Testing

### E2E Tests (`tests/ai-florist/draft-to-order-e2e.spec.ts`)
- Draft creation on mount
- Message sending and AI response
- Product recommendation display
- Order summary display
- Confirmation validation
- API integration tests

### API Tests (`tests/ai-florist/ai-florist-tools-api.spec.ts`)
- Product search with filters
- Product detail retrieval
- Address validation (valid and invalid cases)
- Delivery calculation
- Draft CRUD operations
- Conversation state updates
- Product availability checks

## Quality Assurance Checklist

- ✅ TypeScript strict mode compilation
- ✅ Production build succeeds
- ✅ Database migration applies successfully
- ✅ Real Yandex Geocoding integration
- ✅ Real delivery zone calculation
- ✅ Real catalog product search
- ✅ Conversation state persistence
- ✅ Product availability validation
- ✅ Order summary display
- ✅ Explicit confirmation flow
- ✅ Error handling and validation
- ✅ E2E test coverage
- ✅ API test coverage

## Not Included (By Design)

- **Payment Processing**: Explicitly excluded from Phase 2
- **Order Creation in Orders Service**: Draft only; order creation requires separate phase
- **SMS/Email Notifications**: Future phase
- **Admin Dashboard Integration**: Future phase
- **Order Tracking**: Future phase

## Migration Notes

Database migration: `migrations/20260923_001_create_order_drafts.sql`

Key features:
- Creates `order_drafts` table with proper schema
- Includes indexes for phone lookup and status queries
- Enables JSONB support for conversation_state and items
- Proper constraints for data integrity

## Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_SITE_URL` for API calls
- `DATABASE_URL` for PostgreSQL connection (inherited)

## Future Enhancements (Phase 3+)

1. **Order Creation**: Convert confirmed drafts to actual orders
2. **Payment Integration**: Add payment method selection and processing
3. **Notifications**: SMS/Email confirmations and tracking
4. **Admin Integration**: Draft and order management in admin panel
5. **Analytics**: Conversation metrics and completion rates
6. **A/B Testing**: Different conversation flows and product recommendations
7. **Multi-language Support**: Translation of responses and UI

## Commits

Phase 2 consists of the following commits:
1. Foundation: Draft storage, types, repository
2. Enhanced Integration: Full draft management with tools
3. Confirmation Flow: Summary display and finalization
4. E2E & API Tests: Comprehensive test coverage
5. Test Fixes: Playwright API updates

Run `git log --oneline | head -5` to see recent commits.
