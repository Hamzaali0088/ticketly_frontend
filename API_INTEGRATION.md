# API Integration Guide

## Configuration

The API base URL is configured in `frontend/lib/config.ts`. 

To set a custom API base URL, you can:

1. **For Expo projects**: Set the environment variable `EXPO_PUBLIC_API_BASE_URL` in your environment or `.env` file:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://localhost:5001/api
   ```

2. **Or edit directly** in `frontend/lib/config.ts`:
   ```typescript
   export const API_BASE_URL = 'http://localhost:5001/api';
   ```

## API Structure

All API calls are organized in the `frontend/lib/api/` directory:

- `client.ts` - Base axios client with token management and refresh logic
- `auth.ts` - Authentication APIs (signup, login, verify-otp, refresh-token, profile, delete)
- `events.ts` - Event APIs (get approved, create, get my, get by id, update, delete)
- `admin.ts` - Admin APIs (get pending events, approve event)

## Token Management

The app automatically handles:
- Access token storage and retrieval
- Automatic token refresh when access token expires
- Token refresh on login page when access token is expired

## Excluded APIs

As per requirements, the following APIs are NOT integrated:
- Get all users
- Get user by id
- Update user by id
- Update ticket status

## Usage Example

```typescript
import { authAPI } from '@/lib/api/auth';
import { eventsAPI } from '@/lib/api/events';

// Login
const response = await authAPI.login({ email, password });

// Get events
const events = await eventsAPI.getApprovedEvents();

// Create event
const newEvent = await eventsAPI.createEvent({
  title: 'My Event',
  description: 'Event description',
  // ... other fields
});
```

