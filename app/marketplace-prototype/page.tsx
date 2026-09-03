"use client";

import { useState } from "react";

const buyOrders = [
  { buyer: "County Road & Masonry", price: 48, quantity: 120 },
  { buyer: "Town Works", price: 47, quantity: 180 },
  { buyer: "Masonry Co.", price: 46, quantity: 200 },
  { buyer: "Crowe Works", price: 45, quantity: 110 },
];

export default function MarketplacePrototypePage() {
  const [orderState, setOrderState] = useState("None");
  const [orderSub, setOrderSub] = useState("No active Stone orders");
  const [status, setStatus] = useState("Stone commodity market open.");

  return (
    <main className="prototype-shell">
      <section className="commodity-modal" aria-label="Stone commodity market prototype">
        <header className="commodity-header">
          <svg className="stone-sprite" viewBox="0 0 100 100" aria-hidden="true">
            <polygon points="17,61 36,29 65,31 83,57 68,82 34,84" fill="#96938a" stroke="#d5ceba" strokeWidth="3" />
            <polygon points="36,29 54,17 76,35 65,31" fill="#bbb5a4" />
            <polygon points="17,61 36,50 34,84" fill="#74736b" />
            <polygon points="36,50 65,31 68,82 34,84" fill="#89877d" />
            <polyline points="36,50 54,60 68,82" fill="none" stroke="#cec6b2" strokeWidth="2" />
          </svg>

          <div>
            <h1>STONE</h1>
            <p>Commodity Market</p>
          </div>

          <button
            className="close-button"
            type="button"
            aria-label="Close prototype"
            onClick={() => setStatus("Close pressed — this will return to the Marketplace in the full version.")}
          >
            ×
          </button>
        </header>

        <div className="commodity-body">
          <section className="market-analysis">
            <div className="eyebrow">Current Price</div>
            <div className="price-row">
              <div className="current-price">$49<span>/t</span></div>
              <div className="trend-down">▼ 6%</div>
            </div>

            <div className="eyebrow">Market Trend · 7 Days</div>
            <div className="line-chart" aria-label="Seven-day Stone price trend">
              <svg viewBox="0 0 320 180" preserveAspectRatio="none" role="img">
                <polyline
                  points="0,25 28,36 58,31 87,49 116,43 145,64 175,58 204,79 235,72 264,94 294,89 320,109"
                  fill="none"
                  stroke="#e56542"
                  strokeWidth="5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="chart-axis">
                <span>D-6</span><span>D-5</span><span>D-4</span><span>D-3</span><span>D-2</span><span>D-1</span><span>Today</span>
              </div>
            </div>

            <div className="market-stats">
              <div><span>Supply</span><strong>420 t</strong></div>
              <div><span>Demand</span><strong>610 t</strong></div>
              <div><span>Market</span><strong className="tight">TIGHT</strong></div>
            </div>
          </section>

          <section className="order-book">
            <div className="orders-heading">
              <h2>BUY ORDERS</h2>
              <span>4 active buyers</span>
            </div>

            <div className="order-table-wrap">
              <table>
                <thead>
                  <tr><th>Buyer</th><th>Price</th><th>Quantity</th></tr>
                </thead>
                <tbody>
                  {buyOrders.map((order) => (
                    <tr key={order.buyer}>
                      <td>{order.buyer}</td>
                      <td>${order.price}/t</td>
                      <td>{order.quantity} t</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="market-counters">
              <div>
                <span className="eyebrow">Your Inventory</span>
                <strong>82 t</strong>
                <small>Available Stone</small>
              </div>
              <div>
                <span className="eyebrow">Your Orders</span>
                <strong>{orderState}</strong>
                <small>{orderSub}</small>
              </div>
            </div>
          </section>
        </div>

        <footer className="commodity-footer">
          <div className="action-row">
            <button
              className="sell-button"
              type="button"
              onClick={() => {
                setOrderState("SELL");
                setOrderSub("10 t @ $52/t");
                setStatus("Sell offer created: 10 tons of Stone at $52/t.");
              }}
            >
              Create Sell Offer
            </button>
            <button
              className="buy-button"
              type="button"
              onClick={() => {
                setOrderState("BUY");
                setOrderSub("20 t @ $47/t");
                setStatus("Buy order created: 20 tons of Stone at $47/t.");
              }}
            >
              Create Buy Order
            </button>
          </div>
          <p className="status-line" aria-live="polite">{status}</p>
        </footer>
      </section>

      <style jsx>{`
        :global(html), :global(body) {
          margin: 0;
          min-height: 100%;
          background: #080604;
        }

        :global(body) {
          font-family: Inter, Arial, sans-serif;
        }

        * { box-sizing: border-box; }

        .prototype-shell {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 16px;
          color: #f2e3c9;
          background:
            radial-gradient(circle at 50% 18%, rgba(111, 73, 39, .30), transparent 31%),
            linear-gradient(180deg, #21160f 0%, #0a0705 100%);
        }

        .commodity-modal {
          width: min(1080px, 100%);
          background: linear-gradient(180deg, #25180f, #120d09);
          border: 2px solid #9b7042;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 22px 70px rgba(0,0,0,.62);
        }

        .commodity-header {
          display: grid;
          grid-template-columns: 82px 1fr 52px;
          gap: 16px;
          align-items: center;
          padding: 18px 22px;
          border-bottom: 1px solid #67482e;
        }

        .stone-sprite { width: 76px; height: 76px; }

        h1, h2 { font-family: Georgia, serif; }

        h1 {
          margin: 0;
          color: #efcf97;
          font-size: 40px;
          letter-spacing: .04em;
        }

        .commodity-header p {
          margin: 3px 0 0;
          color: #b9a486;
          font-size: 15px;
        }

        .close-button {
          width: 50px;
          height: 50px;
          border-radius: 7px;
          border: 1px solid #8c633b;
          background: #140f0b;
          color: white;
          font-size: 30px;
          cursor: pointer;
        }

        .commodity-body {
          display: grid;
          grid-template-columns: 36% 64%;
        }

        .market-analysis {
          padding: 18px 20px 16px;
          border-right: 1px solid #66492f;
        }

        .order-book { padding: 18px 20px 16px; min-width: 0; }

        .eyebrow {
          color: #c99d60;
          font-size: 12px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .price-row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          margin: 5px 0 16px;
        }

        .current-price {
          font-size: 64px;
          line-height: .92;
          font-weight: 900;
          letter-spacing: -.04em;
        }

        .current-price span { font-size: .34em; color: #b9a486; }

        .trend-down {
          color: #ea6b47;
          font-size: 20px;
          font-weight: 850;
          padding-bottom: 6px;
        }

        .line-chart {
          position: relative;
          height: 175px;
          margin-top: 9px;
          border: 1px solid #392b21;
          border-radius: 6px;
          overflow: hidden;
          background:
            repeating-linear-gradient(0deg, transparent 0 24%, rgba(255,255,255,.035) 25%),
            repeating-linear-gradient(90deg, transparent 0 19%, rgba(255,255,255,.035) 20%);
        }

        .line-chart svg { width: 100%; height: 100%; }

        .chart-axis {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 5px;
          display: flex;
          justify-content: space-between;
          color: #7e6b56;
          font-size: 9px;
        }

        .market-stats {
          margin-top: 14px;
          border-top: 1px solid #36291f;
        }

        .market-stats > div {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 0;
          border-bottom: 1px solid #36291f;
          font-size: 15px;
        }

        .market-stats strong { font-size: 17px; }
        .tight { color: #ea6b47; }

        .orders-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .orders-heading h2 {
          margin: 0;
          color: #e2bd7f;
          font-size: 29px;
        }

        .orders-heading > span {
          border: 1px solid #6d5237;
          border-radius: 999px;
          padding: 6px 10px;
          color: #c7af8e;
          font-size: 11px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th, td {
          padding: 11px 9px;
          border-bottom: 1px solid #392c22;
          text-align: right;
        }

        th:first-child, td:first-child { text-align: left; }

        th {
          color: #c79b60;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        .market-counters {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 14px;
        }

        .market-counters > div {
          background: #100d0a;
          border: 1px solid #3b2e24;
          border-radius: 7px;
          padding: 13px;
          text-align: center;
        }

        .market-counters strong {
          display: block;
          margin-top: 4px;
          font-size: 25px;
          font-weight: 900;
        }

        .market-counters small {
          display: block;
          margin-top: 2px;
          color: #b9a486;
          font-size: 10px;
        }

        .commodity-footer {
          border-top: 1px solid #66492f;
          background: #110d09;
          padding: 14px 18px 16px;
        }

        .action-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .action-row button {
          min-height: 54px;
          border-radius: 7px;
          font-size: 16px;
          font-weight: 850;
          cursor: pointer;
        }

        .sell-button {
          background: #3a2618;
          border: 1px solid #9b693a;
          color: #f0d09c;
        }

        .buy-button {
          background: #253817;
          border: 1px solid #55762f;
          color: #deedc9;
        }

        .status-line {
          margin: 8px 0 0;
          text-align: center;
          color: #c7ad86;
          font-size: 11px;
        }

        @media (max-width: 760px) {
          .prototype-shell { padding: 6px; align-items: start; }
          .commodity-modal { border-radius: 8px; }
          .commodity-header {
            grid-template-columns: 58px 1fr 44px;
            gap: 10px;
            padding: 12px 14px;
          }
          .stone-sprite { width: 54px; height: 54px; }
          h1 { font-size: 28px; }
          .commodity-header p { font-size: 12px; }
          .close-button { width: 44px; height: 44px; }
          .commodity-body { grid-template-columns: 42% 58%; }
          .market-analysis, .order-book { padding: 12px; }
          .current-price { font-size: 44px; }
          .trend-down { font-size: 15px; padding-bottom: 4px; }
          .line-chart { height: 120px; }
          .market-stats > div { font-size: 12px; padding: 8px 0; }
          .market-stats strong { font-size: 13px; }
          .orders-heading h2 { font-size: 21px; }
          .orders-heading > span { display: none; }
          table { font-size: 11px; }
          th, td { padding: 7px 5px; }
          .market-counters > div { padding: 9px; }
          .market-counters strong { font-size: 18px; }
          .commodity-footer { padding: 10px; }
          .action-row button { min-height: 48px; font-size: 14px; }
        }

        @media (max-width: 520px) {
          .commodity-body { grid-template-columns: 1fr; }
          .market-analysis {
            border-right: 0;
            border-bottom: 1px solid #66492f;
          }
          .line-chart { height: 130px; }
        }
      `}</style>
    </main>
  );
}
