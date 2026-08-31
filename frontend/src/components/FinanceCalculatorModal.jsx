import { useState } from 'react';
import { Icons } from './Icons';

export default function FinanceCalculatorModal({ price = 2500000, title = "Superbike Loan", onClose }) {
  const [downPaymentPct, setDownPaymentPct] = useState(25);
  const [tenureMonths, setTenureMonths] = useState(36);
  const [interestRate, setInterestRate] = useState(10.5);

  const vehiclePrice = Number(price) || 2500000;
  const downPayment = (vehiclePrice * downPaymentPct) / 100;
  const loanPrincipal = vehiclePrice - downPayment;

  // Monthly EMI calculation formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = interestRate / 12 / 100;
  const emi = loanPrincipal > 0
    ? Math.round((loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1))
    : 0;

  const totalPayment = (emi * tenureMonths) + downPayment;
  const totalInterest = (emi * tenureMonths) - loanPrincipal;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <div className="badge badge-gray" style={{ marginBottom: 6 }}>
              {Icons.calc} Superbike Finance
            </div>
            <h2 className="modal-title">Monthly EMI Estimator</h2>
            <p className="modal-subtitle">{title} (Rs {vehiclePrice.toLocaleString('en-IN')})</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            {Icons.close}
          </button>
        </div>

        <div className="modal-body">
          {/* Result summary card */}
          <div className="emi-result-card">
            <div className="emi-headline-label">Estimated Monthly Installment</div>
            <div className="emi-amount-val">Rs {emi.toLocaleString('en-IN')} <span className="emi-per-mo">/ month</span></div>
            <div className="emi-quick-meta">
              <span>Loan Amount: Rs {loanPrincipal.toLocaleString('en-IN')}</span>
              <span>Tenure: {tenureMonths} Months ({tenureMonths / 12} Yrs)</span>
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="calc-controls-grid">
            <div className="calc-field">
              <div className="calc-label-row">
                <label className="form-label">Down Payment</label>
                <span className="calc-val-pill">{downPaymentPct}% (Rs {Math.round(downPayment).toLocaleString('en-IN')})</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                step="5"
                className="calc-slider"
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
              />
              <div className="slider-ticks">
                <span>10%</span>
                <span>30%</span>
                <span>50%</span>
                <span>70%</span>
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-label-row">
                <label className="form-label">Loan Tenure</label>
                <span className="calc-val-pill">{tenureMonths} Months</span>
              </div>
              <div className="tenure-button-group">
                {[12, 24, 36, 48, 60].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`tenure-btn ${tenureMonths === t ? 'active' : ''}`}
                    onClick={() => setTenureMonths(t)}
                  >
                    {t / 12} Yr ({t}m)
                  </button>
                ))}
              </div>
            </div>

            <div className="calc-field">
              <div className="calc-label-row">
                <label className="form-label">Estimated Annual Interest Rate</label>
                <span className="calc-val-pill">{interestRate}% p.a.</span>
              </div>
              <input
                type="range"
                min="8.5"
                max="16.0"
                step="0.25"
                className="calc-slider"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="calc-breakdown-box">
            <div className="calc-row">
              <span className="calc-k">Vehicle Ex-Showroom / Asking Price</span>
              <span className="calc-v">Rs {vehiclePrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="calc-row">
              <span className="calc-k">Upfront Down Payment</span>
              <span className="calc-v">Rs {Math.round(downPayment).toLocaleString('en-IN')}</span>
            </div>
            <div className="calc-row">
              <span className="calc-k">Total Interest over Loan Period</span>
              <span className="calc-v">Rs {Math.round(totalInterest).toLocaleString('en-IN')}</span>
            </div>
            <div className="calc-row calc-row-total">
              <span className="calc-k">Total Cost (Principal + Interest)</span>
              <span className="calc-v">Rs {Math.round(totalPayment).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
