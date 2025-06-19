<!-- This file lists the modifications done to the base package `@wordpress/dataviews` that are published under `@automattic/dataviews`. -->

## Next

- Update the field type definitions to declare the default and valid operators they support. Fields with no `type` property can use all operators and, if none is provided in the field's config, they'll display `is` and `isNot`.
- Add a story for each FieldTypeDefinition.
- Add new filter operators: `before`, `after`, `beforeInc`, and `afterInc` for date fields.
- Adjust the spacing of the `DataForm` based on the type.
- Sync with Gutenberg packages/dataviews. It bundles `@wordpress/dataviews` 4.21.0 plus https://github.com/WordPress/gutenberg/pull/70435 (fix alignment between label and control in DataForms layout).
- Update SYNC.md docs to include information on rebasing existing sync branches on top of Calypso trunk and other frequently asked questions.
- Hide the label in input widgets to prevent duplicate labels in the filter UI.
- Add new filter operator: `between`.

## 0.2.1

- `text`, `email` Edit control: add `help` support from the field `description` prop.
- Add `align` to the `layout.styles` properties, for use in the DataViews table layout. Options are: `start`, `center`, and `end`.
- Allow fields to opt-out of filtering via `field.filterBy: false`.

## 0.2.0

- Bring changes from `@wordpress/dataviews 4.19.0` (no updates in this version).
- `select` Edit control: add `help` support from the field `description` prop.
- Add new Edit controls: `checkbox`, `toggleGroup`. In the `toggleGroup`, if the field elements (options) have a `description`, then the selected option's description will be also rendered.
- Add new `media`, `boolean`, and `email` field type definitions.
- Field type definitions are now able to define a default `enableSorting` and `render` function.
- Pin the actions column on the table view when the width is insufficient.
- Add `renderItemLink` prop support in the `DataViews` component. It replaces `onClickItem`prop and allows integration with router libraries.
- Adds new story that combines DataViews and DataForm.
- Add `className` prop to the `DataViews.Layout` component to allow customizing the layout styles.
- Enhance filter component styles.
- Add user input filter support based on the `Edit` property of the field type definitions.
- Add new filter operators: `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `contains`, `notContains`, `startsWith`.

## 0.1.1

- Add support for free composition in the `DataViews` component by exporting subcomponents: `<DataViews.ViewConfig />`, `<DataViews.Search />`, `<DataViews.Pagination />`, `<DataViews.LayoutSwitcher />`, `<DataViews.Layout />`, `<DataViews.FiltersToggle />`, `<DataViews.Filters />`, `<DataViews.BulkActionToolbar />`.
- Fix `filterSortAndPaginate` to handle undefined values for the `is` filter.

## 0.1.0

- First release of the `@automattic/dataviews` package. It bundles all changes from `@wordpress/dataviews` 4.18.0.
