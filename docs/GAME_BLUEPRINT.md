# Game Blueprint

## Product identity

Pinebarrow Land Company is a mining company, logistics, and town-development game. Its defining promise is:

> I did not just make my mining company bigger. My company helped turn this place into a city.

The player should see both sides of that promise: an increasingly capable industrial operation and a large town that visibly develops because of the resources and contracts the player supplies.

## Core loop

1. Explore and clear claimed land.
2. Prospect for a material seam.
3. Lease and construct mines and support buildings.
4. Supply workers through housing.
5. Move mine output into warehouses.
6. Protect reserves and route available stock to contracts or the player market.
7. Earn money, upgrade bottlenecks, and expand deeper into richer land.
8. Fulfill development demand so new Pinebarrow industries appear.
9. Use the resulting demand, prices, and contracts to grow again.

## Preserve existing systems

Feature work must extend the current game rather than replace it. Preserve working behavior for:

- save profiles and migration
- claims, clearing, prospecting, and leases
- mines, warehouses, trucks, and upgrades
- material progression and the Shaker
- marketplace prices, sell offers, company contracts, and road contracts
- the newspaper, daily business stories, and price effects
- Coming Soon sites and town-business progression
- touch, keyboard, and controller controls
- audio settings
- Developer Mode and regression-test hooks

Any intentional replacement must be named in a focused commit and covered by migration and regression tests.

## Management screens

### Mine Management

Show every mine in one screen with:

- name or ID, material, mine level, and active state
- production rate, local output, and output capacity
- assigned worker and worker status
- assigned warehouse and hauling status
- amount waiting for pickup and current upgrade path
- a prominent reason whenever production is stopped

Standard statuses: `PRODUCING`, `NO WORKER`, `MINE STORAGE FULL`, `WAREHOUSE FULL`, `WAITING FOR TRUCK`, and `INACTIVE`.

### Contract Management

Show customer, material, required quantity, delivered quantity, remaining quantity, unit price/reward, deadline or cycle, assigned source, and current fulfillment status. Keep the existing contract economy; this screen makes it manageable.

### Warehouse Management

Show inventory by material, capacity, reserve, available stock, assigned mines, collection throughput, worker state, and independent upgrade paths.

## Buildable support structures

| Building | Footprint | Minimum staffing | Primary role |
|---|---:|---:|---|
| Worker House | 2×2 | None | Provides one assignable worker |
| Mine | Existing 2×2 | 1 worker | Produces material into local storage |
| Warehouse | Existing footprint | 1 worker | Collects, stores, and routes mine output |
| Player Market | 2×6 | 1 worker | Automates eligible warehouse sales at town-market prices |

A building can exist without a worker, but its productive operation remains safely stopped until staffed.

## Phased implementation

1. **Source protection** — complete recovery, protected baseline, GitHub source of truth.
2. **Focused cleanup** — make the truck panel readable, remove the road-tile counter/display, fix ore spawning on roads, and correct town proportions without shrinking the town.
3. **Town streets** — build a four-lane Main Street, two-lane side streets, intersections, blocks, sidewalks, curbs, and believable lots.
4. **Management UI** — add mine, contract, and warehouse management screens with explicit bottlenecks.
5. **Workforce** — add 2×2 worker houses, a worker pool, assignments, and staffing requirements.
6. **Warehouse logistics** — add automated mine collection, independent capacity/logistics upgrades, and reserves.
7. **Player market** — add the 2×6 market, price-aware automated distribution, and independent throughput upgrades.
8. **Town growth** — expand Coming Soon and construction states into player-driven business development.

Each phase is a separate tested GitHub commit or commit series. Do not combine these phases into an uncontrolled rewrite.
