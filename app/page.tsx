import GameEngineLoader from "./game-engine-loader";

export default function Home() {
  return (
    <main className="game-page">
      <div id="pinebarrow-visible-menu-demo" className="game-app">
        <div id="pb7-start-layer" className="start-layer" role="dialog" aria-modal="true" aria-labelledby="pb7-start-title">
          <section className="start-card">
            <div className="start-brand">
              <div className="start-brand-mark" aria-hidden="true">PL</div>
              <div>
                <p className="eyebrow">Pinebarrow County</p>
                <h2 id="pb7-start-title">Pinebarrow Land Company</h2>
                <p>Choose a company file to continue building through the forest.</p>
              </div>
            </div>

            <div className="profile-heading">
              <div>
                <p className="eyebrow">Company files</p>
                <h3>Choose a save profile</h3>
              </div>
              <span id="pb7-profile-sync" className="mini-badge mint-badge">Loading saves…</span>
            </div>

            <div id="pb7-profile-list" className="profile-list" aria-label="Save profiles">
              {[1, 2, 3].map((slot) => (
                <button key={slot} className="profile-slot" data-profile-slot={slot} type="button" aria-pressed={slot === 1 ? "true" : "false"}>
                  <span className="profile-number">{slot}</span>
                  <span className="profile-copy">
                    <strong id={`pb7-profile-name-${slot}`}>Company File {slot}</strong>
                    <small id={`pb7-profile-summary-${slot}`}>Empty company file</small>
                  </span>
                  <span className="profile-chevron" aria-hidden="true">›</span>
                </button>
              ))}
            </div>

            <label className="profile-name-field" htmlFor="pb7-profile-name-input">
              <span>Company name</span>
              <input id="pb7-profile-name-input" type="text" maxLength={28} defaultValue="Pinebarrow Company" autoComplete="off" />
            </label>

            <p id="pb7-profile-message" className="profile-message" aria-live="polite">Select a company file.</p>

            <div className="profile-actions">
              <button id="pb7-profile-play" className="arcade-button primary-button" type="button">Start new company</button>
              <button id="pb7-profile-restart" className="arcade-button secondary-button" type="button" hidden>Start over</button>
              <button id="pb7-profile-delete" className="profile-delete" type="button" hidden>Delete file</button>
            </div>

            <div className="start-audio-mixer" aria-label="Audio settings">
              <button id="pb7-start-music" className="start-audio" type="button" aria-pressed="true">
                <span aria-hidden="true">♫</span> Music on
              </button>
              <button id="pb7-start-engine" className="start-audio" type="button" aria-pressed="true">
                <span aria-hidden="true">⚙</span> Truck on
              </button>
              <button id="pb7-start-effects" className="start-audio" type="button" aria-pressed="true">
                <span aria-hidden="true">✦</span> Effects on
              </button>
            </div>

            <div className="input-guide" aria-label="Keyboard and controller controls">
              <span><strong>Keyboard</strong> Arrows / WASD drive · <kbd>E</kbd> menu · <kbd>Space</kbd> cut</span>
              <span><strong>Controller</strong> Left stick steer · RT forward · LT reverse · X cut · Y / Start menu</span>
            </div>
          </section>
        </div>

        <header className="top-header">
          <div className="brand-lockup">
            <button
              id="pb7-menu-toggle"
              className="brand-mark system-menu-toggle"
              type="button"
              aria-label="Menu"
              aria-controls="pb7-system-menu"
              aria-expanded="false"
              title="Menu"
            >
              PL
            </button>
            <div>
              <p className="eyebrow">Pinebarrow County</p>
              <h1>Pinebarrow Land Company</h1>
            </div>
          </div>

          <div className="header-stats" aria-label="Company status">
            <div className="stat-pill reward-stat cash-stat">
              <span className="stat-icon coin-icon" aria-hidden="true">$</span>
              <span className="stat-copy"><small>Company funds</small><strong id="pb7-cash">$160</strong></span>
            </div>
            <div className="stat-pill shift-stat">
              <span className="stat-icon clock-icon" aria-hidden="true">◷</span>
              <span className="stat-copy"><small>Shift clock</small><strong id="pb7-time">Day 1 · 8:00 AM</strong></span>
            </div>
            <div id="pb7-truck-stat" className="stat-pill wide-stat truck-stat" data-status="idle">
              <span className="stat-icon engine-icon" aria-hidden="true">⚙</span>
              <span className="stat-copy truck-stat-copy">
                <small><b>ZEUS</b><span id="pb7-truck-model">V1S1W0</span><span id="pb7-truck-status" className="truck-status">Idle</span></small>
                <strong><span className="anchor-icon" aria-hidden="true">⚓</span><span id="pb7-truck">0.0 / 6.0 t</span></strong>
              </span>
            </div>
          </div>

          <section id="pb7-system-menu" className="system-menu-popover" aria-label="Game menu" hidden>
            <div className="system-menu-heading">
              <div>
                <p className="eyebrow">Company controls</p>
                <h2>Menu</h2>
              </div>
              <button id="pb7-system-close" className="system-menu-close" type="button" aria-label="Close menu">×</button>
            </div>
            <div className="system-menu-actions">
              <button id="pb7-save-now" type="button"><span aria-hidden="true">◆</span> Save game</button>
              <button id="pb7-profiles" type="button"><span aria-hidden="true">▤</span> Load / profiles</button>
              <button id="pb7-music" type="button" aria-pressed="true"><span aria-hidden="true">♫</span> Music on</button>
              <button id="pb7-engine-sound" type="button" aria-pressed="true"><span aria-hidden="true">⚙</span> Truck on</button>
              <button id="pb7-effects" type="button" aria-pressed="true"><span aria-hidden="true">✦</span> Effects on</button>
              <button id="pb7-landscape" type="button"><span aria-hidden="true">⛶</span> Full screen</button>
            </div>
            <div className="save-line system-save-line">
              <span className="save-dot" aria-hidden="true" />
              <span id="pb7-save-status">Progress saves automatically</span>
            </div>
          </section>
        </header>

        <div className="game-layout">
          <section className="play-panel" aria-label="Pinebarrow map">
            <div className="panel-heading map-heading">
              <div>
                <p className="eyebrow">County map</p>
                <h2>South Claim · Player 4</h2>
              </div>
              <span id="pb7-land" className="status-pill">Unprospected land</span>
            </div>

            <div className="map-frame">
              <canvas
                id="pb7-map"
                aria-label="Interactive map. Click or tap a reachable tile to drive your truck."
              />
              <div id="pb7-map-tip" className="map-tip" aria-live="polite">Tap map · Arrows / WASD · Controller ready</div>
              <article
                id="pb7-daily-news"
                className="daily-news-bulletin"
                aria-live="polite"
                aria-label="Open the Pinebarrow Daily market newspaper"
                aria-controls="pb7-newspaper-reader"
                aria-haspopup="dialog"
                role="button"
                tabIndex={0}
              >
                <div className="news-masthead">
                  <span className="news-paper-name">The Pinebarrow Daily</span>
                  <span id="pb7-news-day" className="news-edition">Day 1 · Morning Edition</span>
                </div>
                <div className="news-story-row">
                  <span className="news-flash">Market Wire</span>
                  <strong id="pb7-news-headline">Town merchants open for business</strong>
                  <span id="pb7-news-market" className="news-market">Logs · $18/t</span>
                </div>
              </article>
              <button id="pb7-play-fullscreen" className="fullscreen-launch" type="button" aria-label="Play Pinebarrow in full screen">
                <span aria-hidden="true">⛶</span>
                <strong>Play full screen</strong>
                <small>Tap once to expand the game</small>
              </button>

              <section className="map-destination-panel" aria-label="Quick travel">
                <button
                  id="pb7-fast-travel-toggle"
                  className="fast-travel-toggle"
                  type="button"
                  aria-label="Fast travel"
                  aria-controls="pb7-fast-travel-menu"
                  aria-expanded="false"
                  title="Fast travel"
                >
                  <span aria-hidden="true">➜</span>
                </button>
                <div id="pb7-fast-travel-menu" className="fast-travel-menu" hidden>
                  <label className="field-label" htmlFor="pb7-destination">Fast travel destination</label>
                  <select id="pb7-destination" defaultValue="starter">
                    <option value="market">Market</option>
                    <option value="starter">Roadhead &amp; first tree</option>
                    <option value="townhall">Town Hall</option>
                    <option value="garage">Garage</option>
                    <option value="rental">Rental Shop</option>
                    <option value="newsstand">Newsstand</option>
                    <option value="mine">Mine site · outside edge</option>
                    <option value="warehouse">Warehouse site · outside edge</option>
                    <option value="deepclaim">Far north frontier</option>
                  </select>
                  <button id="pb7-go" className="fast-travel-go" type="button" aria-label="Drive to selected destination">Go</button>
                </div>
              </section>

              <section className="map-tool-rail" aria-label="On-screen game controls">
                <button id="pb7-zoom-in" className="screen-control" type="button" aria-label="Zoom in">＋</button>
                <button id="pb7-zoom-out" className="screen-control" type="button" aria-label="Zoom out">−</button>
                <button id="pb7-overview" className="screen-control" type="button" aria-label="World map" title="World map">⌖</button>
                <button id="pb7-unstuck" className="screen-control warm-button" type="button" aria-label="Return truck to town" title="Return to town">⌂</button>
              </section>

              <nav id="pb7-touch-dpad" className="touch-dpad" aria-label="Touch driving controls">
                <button className="dpad-up" data-drive-direction="up" type="button" aria-label="Drive up">▲</button>
                <button className="dpad-left" data-drive-direction="left" type="button" aria-label="Drive left">◀</button>
                <span className="dpad-center" aria-hidden="true" />
                <button className="dpad-right" data-drive-direction="right" type="button" aria-label="Drive right">▶</button>
                <button className="dpad-down" data-drive-direction="down" type="button" aria-label="Drive down">▼</button>
              </nav>

              <div className="touch-action-pad" aria-label="Touch action controls">
                <button id="pb7-touch-interact" className="touch-action-button interact-action" type="button" aria-label="Interact with this location" title="Interact">
                  <span aria-hidden="true">✦</span>
                </button>
                <button id="pb7-clear" className="touch-action-button cut-action" type="button" aria-label="Cut selected tree" title="Cut tree" hidden>
                  <span aria-hidden="true">🪚</span>
                </button>
              </div>
            </div>
          </section>

          <aside className="control-panel" aria-label="Game controls">
            <section className="control-card objective-card">
              <p className="eyebrow">Current objective</p>
              <h2 id="pb7-context-title">Pinebarrow guide</h2>
              <p id="pb7-context">
                Develop north of Pinebarrow: clear clustered trees, survey promising ground, and build a road network around the lakes.
              </p>
            </section>

            <p id="pb7-company" className="company-status-sr">No prospector · no saw · no mine · no warehouse</p>
          </aside>
        </div>

        <div id="pb7-menu-layer" className="menu-layer" hidden>
          <button id="pb7-menu-scrim" className="menu-scrim" type="button" aria-label="Close menu" />
          <section
            id="pb7-building-panel"
            className="building-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pb7-building-panel-title"
          >
            <div className="modal-heading">
              <div>
                <p id="pb7-location-kicker" className="eyebrow">Available here</p>
                <h2 id="pb7-building-panel-title">Field actions</h2>
              </div>
              <button id="pb7-menu-close" className="close-button" type="button" aria-label="Close menu">×</button>
            </div>
            <section id="pb7-location-details" className="location-details" aria-label="Selected location details" hidden />
            <p id="pb7-no-actions" className="modal-copy">Travel to a building or claim tile to see its actions.</p>
            <p id="pb7-action-hint" className="action-hint" aria-live="polite">Choose an available action.</p>
            <div id="pb7-actions" className="action-grid">
              <button id="pb7-hire" type="button">Hire permanent prospector · $60</button>
              <button id="pb7-hire-worker" type="button">Hire permanent mine worker</button>
              <button id="pb7-marketplace" type="button">Open marketplace</button>
              <button id="pb7-contracts" type="button">Open company contracts</button>
              <button id="pb7-company-management" type="button">Open company operations</button>
              <button id="pb7-buy-saw" type="button">Buy saw · $90</button>
              <button id="pb7-rent-saw" type="button">Rent saw · $18/day</button>
              <button id="pb7-shaker" type="button">Buy shaker · $350</button>
              <button id="pb7-upgrade-truck-size" type="button">Upgrade truck size</button>
              <button id="pb7-upgrade-truck-speed" type="button">Upgrade truck speed</button>
              <button id="pb7-road-plan" type="button">Survey a road route</button>
              <button id="pb7-road-submit" type="button">Submit route to Town Hall</button>
              <button id="pb7-road-accept" type="button">Accept approved road contract</button>
              <button id="pb7-road-cancel" type="button">Cancel road survey</button>
              <button id="pb7-read-news" type="button">Read market news</button>
              <button id="pb7-prospect" type="button">Prospect selected tile</button>
              <button id="pb7-select-prospect-1" type="button" hidden>Review Prospect 1</button>
              <button id="pb7-select-prospect-2" type="button" hidden>Review Prospect 2</button>
              <button id="pb7-lease" type="button">Lease mine land</button>
              <button id="pb7-buy-land" type="button">Buy mine land</button>
              <button id="pb7-buy-warehouse-land" type="button">Buy warehouse land</button>
              <button id="pb7-build-mine" type="button">Build mine</button>
              <button id="pb7-load-mine" type="button">Load mine output</button>
              <button id="pb7-upgrade-mine" type="button">Upgrade mine</button>
              <button id="pb7-build-warehouse" type="button">Build warehouse</button>
              <button id="pb7-unload-warehouse" type="button">Store truck cargo</button>
              <button id="pb7-load-warehouse" type="button">Load from warehouse</button>
              <button id="pb7-upgrade-warehouse" type="button">Upgrade warehouse</button>
            </div>
          </section>

          <article
            id="pb7-newspaper-reader"
            className="expanded-newspaper"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pb7-newspaper-title"
            hidden
          >
            <header className="expanded-news-masthead">
              <div>
                <p className="expanded-news-kicker">Serving Pinebarrow miners and merchants</p>
                <h2 id="pb7-newspaper-title">The Pinebarrow Daily</h2>
                <p id="pb7-newspaper-edition">Day 1 · Daily Edition</p>
              </div>
              <button id="pb7-newspaper-close" className="newspaper-close" type="button" aria-label="Close newspaper">×</button>
            </header>

            <section className="newspaper-lead-story" aria-labelledby="pb7-newspaper-headline">
              <span id="pb7-newspaper-tag" className="newspaper-section-tag">Market Wire</span>
              <h3 id="pb7-newspaper-headline">Town merchants open for business</h3>
              <p id="pb7-newspaper-deck">Today&apos;s orders are setting the price paid at the Market.</p>
            </section>

            <div className="newspaper-reader-grid">
              <section className="newspaper-market-section" aria-labelledby="pb7-price-board-title">
                <div className="newspaper-section-heading">
                  <div>
                    <span>Market close</span>
                    <h3 id="pb7-price-board-title">Pinebarrow Price Board</h3>
                  </div>
                  <small>Price paid per clean ton</small>
                </div>
                <div id="pb7-newspaper-prices" className="stock-ad-grid" />
              </section>

              <aside className="newspaper-column-stack">
                <section className="new-business-ad" aria-labelledby="pb7-business-name">
                  <span>New business &amp; contracts</span>
                  <h3 id="pb7-business-name">Main Street Buyers</h3>
                  <p id="pb7-business-story">Local orders are creating today&apos;s strongest market.</p>
                  <strong id="pb7-business-order">Now buying</strong>
                </section>

                <section className="crowe-watch" aria-labelledby="pb7-crowe-title">
                  <span>Crowe Watch · Investigation</span>
                  <h3 id="pb7-crowe-title">The old prospector keeps buying</h3>
                  <p id="pb7-crowe-story">Silas Crowe has been visiting deed holders after dark.</p>
                  <strong id="pb7-crowe-waste">Your discarded dirt: 0.0 t</strong>
                </section>
              </aside>
            </div>

            <section className="newspaper-resource-guide" aria-labelledby="pb7-resource-guide-title">
              <div className="newspaper-section-heading">
                <div>
                  <span>Prospector&apos;s field guide</span>
                  <h3 id="pb7-resource-guide-title">Where the other materials are found</h3>
                </div>
                <small>Survey deeper, then upgrade the drill</small>
              </div>
              <div id="pb7-resource-guide" className="resource-band-grid" />
              <p className="resource-flow-note">
                A survey sets the mine&apos;s starting seam. Drill Levels 3, 5, and 7 reach the next material in that forest-depth band; every level also improves output and storage. Post truck cargo on the Marketplace or assign a matching mine to a repeating company contract. The Shaker removes 85% of dirt before it consumes storage or hauling space.
              </p>
            </section>
          </article>

          <article
            id="pb7-market-screen"
            className="market-terminal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pb7-market-title"
            hidden
          >
            <header className="market-terminal-header">
              <div>
                <p className="eyebrow">Pinebarrow mercantile exchange</p>
                <h2 id="pb7-market-title">Market</h2>
                <p>List truck cargo at your own asking price. Company orders are tracked separately in Contract Management.</p>
              </div>
              <button id="pb7-market-close" className="newspaper-close" type="button" aria-label="Return to Market services">×</button>
            </header>

            <nav className="market-tabs" aria-label="Market sections">
              <button id="pb7-market-tab-exchange" type="button" aria-pressed="true">Marketplace</button>
              <button id="pb7-market-tab-contracts" type="button" aria-pressed="false">Contract management</button>
            </nav>

            <section id="pb7-exchange-panel" className="market-panel" aria-labelledby="pb7-exchange-title">
              <div className="market-panel-heading">
                <div>
                  <span>Grand Exchange</span>
                  <h3 id="pb7-exchange-title">Post a sell offer</h3>
                </div>
                <small>Orders fill over game time when buyers meet your price.</small>
              </div>
              <div id="pb7-exchange-board" className="exchange-board" />
              <div className="exchange-order-form">
                <label htmlFor="pb7-exchange-material"><span>Ore in truck</span><select id="pb7-exchange-material" /></label>
                <label htmlFor="pb7-exchange-quantity"><span>Quantity (tons)</span><input id="pb7-exchange-quantity" type="number" min="0.1" step="0.1" defaultValue="0.1" /></label>
                <label htmlFor="pb7-exchange-price"><span>Ask per ton</span><input id="pb7-exchange-price" type="number" min="1" step="1" defaultValue="52" /></label>
                <button id="pb7-exchange-offer" type="button">Place sell offer</button>
              </div>
              <p id="pb7-exchange-hint" className="market-feedback" aria-live="polite">Choose material carried in your truck.</p>
              <div id="pb7-exchange-orders" className="exchange-order-list" />
            </section>

          </article>

          <article
            id="pb7-management-screen"
            className="operations-terminal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pb7-management-title"
            hidden
          >
            <header className="operations-header">
              <div>
                <p className="eyebrow">Pinebarrow company ledger</p>
                <h2 id="pb7-management-title">Company Operations</h2>
                <p>See every site, shipment, bottleneck, and commercial obligation without searching the map.</p>
              </div>
              <button id="pb7-management-close" className="newspaper-close" type="button" aria-label="Return to building services">×</button>
            </header>

            <div id="pb7-management-summary" className="operations-summary" aria-label="Company operations summary" />

            <nav className="operations-tabs" aria-label="Company management sections">
              <button id="pb7-management-tab-mines" type="button" aria-pressed="true"><span aria-hidden="true">⛏</span> Mines</button>
              <button id="pb7-management-tab-warehouses" type="button" aria-pressed="false"><span aria-hidden="true">▤</span> Warehouses</button>
              <button id="pb7-management-tab-contracts" type="button" aria-pressed="false"><span aria-hidden="true">◆</span> Contracts</button>
            </nav>

            <section id="pb7-mine-management-panel" className="operations-panel" aria-labelledby="pb7-mine-management-title">
              <div className="operations-panel-heading">
                <div>
                  <span>Extraction network</span>
                  <h3 id="pb7-mine-management-title">Mine Management</h3>
                </div>
                <small>Production, storage, crews, assigned warehouses, hauling, and upgrade bottlenecks.</small>
              </div>
              <div id="pb7-mine-management-board" className="management-card-grid" />
            </section>

            <section id="pb7-warehouse-management-panel" className="operations-panel" aria-labelledby="pb7-warehouse-management-title" hidden>
              <div className="operations-panel-heading">
                <div>
                  <span>Storage network</span>
                  <h3 id="pb7-warehouse-management-title">Warehouse Management</h3>
                </div>
                <small>Capacity, inventory, connected mines, and transfer readiness.</small>
              </div>
              <div id="pb7-warehouse-management-board" className="management-card-grid" />
            </section>

            <section id="pb7-contract-management-panel" className="operations-panel" aria-labelledby="pb7-contract-management-title" hidden>
              <div className="operations-panel-heading">
                <div>
                  <span>Commercial dispatch</span>
                  <h3 id="pb7-contract-management-title">Contract Management</h3>
                </div>
                <small>Track delivery, remaining tonnage, total reward, assigned mine, warehouse, and next truck cycle.</small>
              </div>
              <div id="pb7-management-contract-board" className="contract-board management-contract-board" />
            </section>
          </article>
        </div>
      </div>
      <GameEngineLoader />
    </main>
  );
}
