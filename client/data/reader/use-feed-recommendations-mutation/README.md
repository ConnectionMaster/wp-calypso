#  Reader Hooks

This directory contains React hooks for managing the list of recommend feeds from the current user.

## Overview

### `useFeedRecommendationsMutation`

A custom hook for managing recommended sites state with optimistic updates and automatic error recovery. Note that sites are actually "feeds."

## Real-World Example

```typescript
const SiteSubscriptionRow = ( { feed_ID: feedId, /* other props */ } ) => {
	const { isRecommended, toggleRecommended } = useFeedRecommendationsMutation( Number( feedId ) );

	return (
		<div className="subscription-row">
			{/* Site info */}
			<Toggle
				checked={ isRecommended }
				onChange={ toggleRecommended }
				label="Recommended blog"
			/>
		</div>
	);
};
```

## API Reference

### `useFeedRecommendationsMutation(feedId: number)`

**Parameters:**
- `feedId: number` - The feed ID to manage recommendations for

**Returns:** `useFeedRecommendationsMutationResult`

```typescript
interface useFeedRecommendationsMutationResult {
	isRecommended: boolean;    // Current recommendation state (from Redux)
	isUpdating: boolean;       // Whether operation is in progress  
	canToggle: boolean;        // Whether toggle is allowed
	toggleRecommended: () => void; // Function to toggle state
}
```

## Error Recovery Flow

The implementation uses the established WordPress.com `bypassDataLayer` pattern:

### Successful Operation
```
1. User toggles → READER_LIST_ITEM_ADD_FEED dispatched
2. Reducer immediately adds feed (optimistic update)
3. API succeeds → READER_LIST_ITEM_ADD_FEED_RECEIVE ensures feed is in list
4. UI shows new state ✅
```

### Failed Operation with Automatic Recovery
```
1. User toggles → READER_LIST_ITEM_ADD_FEED dispatched  
2. Reducer immediately adds feed (optimistic update)
3. API fails → Data layer dispatches bypassDataLayer(READER_LIST_ITEM_DELETE_FEED)
4. Reducer removes feed, reverting to original state
5. UI automatically reverts toggle to previous position ✅
6. Error notice shown to user
```

## Testing

### Running Tests

```bash
yarn test-client client/data/reader/use-recommended-site/index.test.ts
yarn test-client client/state/reader/lists/test/reducer.js
```

## Related Files

See `client/state/reader/lists/`
