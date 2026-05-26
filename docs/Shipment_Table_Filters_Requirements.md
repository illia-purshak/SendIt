# Shipment Table Filters Requirements Report

## Purpose

Define the functional requirements for filters on the Shipments table so the UI, URL state, and API contract stay aligned.

## Scope

This report covers the Shipments list page only:

- table-level filters
- filter persistence in URL
- filter-to-API mapping
- expected user behavior

## Current Implementation Summary

The current Shipments table already supports these filters in the UI:

- `ttn` via text filter
- `operator` via select filter
- `status` via select filter
- `createdFrom` via date picker
- `createdTo` via date picker

The current frontend sends these query params to the shipments API:

- `ttn`
- `operator`
- `status`
- `createdFrom`
- `createdTo`
- `sortBy`
- `sortDir`
- `page`
- `limit`

The current type definition also allows, but the UI does not yet expose:

- `valueFrom`
- `valueTo`

## Required Filters

### 1. TTN / Shipment ID

Requirement:

- user can search by TTN or draft identifier from the table toolbar
- input must support partial text match unless backend explicitly restricts it to exact match
- empty value removes the filter

Expected API field:

- `ttn`

### 2. Operator

Requirement:

- user can filter shipments by postal operator
- values must match backend operator slug values
- options must be generated from supported operators or a single shared source of truth

Expected values currently used in UI:

- `novapost`
- `ukrposhta`
- `meest`

Expected API field:

- `operator`

### 3. Status

Requirement:

- user can filter by normalized shipment status
- filter must include drafts because drafts are displayed in the same table
- labels in UI can be human-readable, but submitted values must match enum values

Required statuses:

- `DRAFT`
- `CREATED`
- `PREPARING`
- `IN_TRANSIT`
- `DELIVERED`
- `CANCELLED`
- `RETURNED`
- `UNKNOWN`

Expected API field:

- `status`

### 4. Created Date Range

Requirement:

- user can filter shipments by created date using a start and end date
- each date must work independently
- when both are set, the range must be inclusive
- clearing either date must immediately remove that boundary from the query

Expected UI fields:

- `createdFrom`
- `createdTo`

Expected behavior:

- `createdFrom` means created on or after selected date
- `createdTo` means created on or before selected date

### 5. Declared Value Range

Requirement:

- user can filter shipments by declared monetary value
- both minimum and maximum must be optional
- validation must reject non-numeric values and invalid ranges

Expected API fields:

- `valueFrom`
- `valueTo`

Status:

- supported by frontend query type and backend documentation
- not implemented in current Shipments page UI

## UX Requirements

- filters must be grouped under the table Filters panel
- active filter count must reflect all non-empty filters
- changing any filter must reset pagination to page 1
- filter state must persist in the URL
- page refresh must restore filters from the URL
- clearing a filter must remove it from the URL
- empty-state messaging should reflect filtered results, not only the no-data state

## API Contract Requirements

The frontend, type definitions, and backend docs must use the same parameter names.

Required alignment:

- one canonical pair for date range fields
- one canonical pair for value range fields
- one canonical meaning for `ttn` search

## Identified Gaps

### Gap 1. Date filter naming mismatch

Backend shipment documentation currently describes:

- `dateFrom`
- `dateTo`

Frontend currently sends:

- `createdFrom`
- `createdTo`

Requirement:

- choose one naming convention and apply it consistently across API docs, backend, frontend types, and frontend requests

Preferred option:

- keep `createdFrom` / `createdTo` if the filter is specifically based on SendIt record creation time

### Gap 2. Value range filter missing in UI

`valueFrom` and `valueTo` exist in the query type and backend docs, but users cannot set them from the Shipments page.

Requirement:

- add min/max declared value inputs to the filter panel

### Gap 3. Operator options are hardcoded

Current operator filter options are defined statically in the page.

Requirement:

- either confirm the list is fixed for this release
- or replace hardcoded values with shared config/API-driven options

### Gap 4. Filterable coverage is incomplete

The table shows `recipient` and `declaredValue`, but only some visible fields are filterable.

Requirement:

- confirm whether recipient search is intentionally excluded
- confirm whether declared value filtering is required for MVP

## Recommended MVP

Minimum acceptable shipment-table filter set:

- TTN / ID
- Operator
- Status
- Created date from
- Created date to
- Declared value from
- Declared value to

## Acceptance Criteria

1. User can apply each supported filter independently.
2. User can combine filters in any valid combination.
3. Applied filters are visible in the URL and survive page refresh.
4. Changing filters resets pagination to the first page.
5. Clearing filters removes their query params.
6. Backend returns filtered results that match the selected criteria.
7. Date filter field names are identical in frontend and backend.
8. Declared value range filtering is available in the UI if supported by backend.
9. Drafts remain discoverable through the shared status filter using `DRAFT`.

## Implementation Notes

Based on the current codebase, the table already has the right architecture for filter persistence and API-driven filtering. The main work remaining is contract alignment and completing the missing filter inputs.
