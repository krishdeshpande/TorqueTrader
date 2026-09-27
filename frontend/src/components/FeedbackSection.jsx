import { useState } from 'react';
import { submitFeedback } from '../api';
import { toast } from '../context/ToastContext';
import { Icons } from './Icons';
import './FeedbackSection.css';

const CATEGORIES = [
  'Feature Request',
  'Bug Report',
  'Vehicle Advisory Feedback',
  'Pricing & Marketplace',
  'General Suggestion'
];

export default function FeedbackSection() {
  const [category, setCategory] = useState('Feature Request');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter your feedback or suggestion.');
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({
        category,
        rating,
        message: message.trim(),
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        page_url: window.location.href,
      });

      setSubmitted(true);
      toast.success('Feedback sent to the TorqueTrader founding team!');
    } catch (err) {
      toast.error('Could not submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="feedback-section-root">
      <div className="container">
        <div className="feedback-container-card">
          <div className="feedback-header-col">
            <span className="badge badge-gray" style={{ marginBottom: 8 }}>
              PLATFORM IMPROVEMENT
            </span>
            <h3 className="feedback-title">Help Us Build TorqueTrader Better</h3>
            <p className="feedback-desc">
              Notice a bug, want a new feature, or have feedback on our automotive advisory? Share your thoughts directly with our founding engineering team.
            </p>
            <div className="feedback-founder-note">
              {Icons.shield} Every submission is reviewed directly by our founder.
            </div>
          </div>

          <div className="feedback-form-col">
            {submitted ? (
              <div className="feedback-success-box">
                <div className="success-icon-wrap">{Icons.check}</div>
                <h4 className="success-head">Thank You for Your Feedback!</h4>
                <p className="success-sub">
                  Your suggestion has been logged and sent directly to our team inbox.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                >
                  Submit Another Note
                </button>
              </div>
            ) : (
              <form className="feedback-form" onSubmit={handleSubmit}>
                {/* Category Pills */}
                <div className="feedback-field-group">
                  <label className="feedback-field-label">Feedback Category</label>
                  <div className="category-pills-row">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`cat-pill-btn ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Row */}
                <div className="feedback-field-group">
                  <div className="rating-label-row">
                    <label className="feedback-field-label">Your Experience Rating</label>
                    <span className="rating-score-text">{rating} / 5</span>
                  </div>
                  <div className="rating-buttons-row">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`rating-number-btn ${rating >= val ? 'selected' : ''}`}
                        onClick={() => setRating(val)}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="feedback-field-group">
                  <label className="feedback-field-label">Your Feedback / Suggestion *</label>
                  <textarea
                    rows={3}
                    className="input"
                    placeholder="Tell us what worked well, what was confusing, or what features you'd like to see..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                {/* Optional Name & Email */}
                <div className="feedback-grid-2">
                  <div className="feedback-field-group">
                    <label className="feedback-field-label">Your Name (Optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Rahul S."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="feedback-field-group">
                    <label className="feedback-field-label">Email (For Follow-Up, Optional)</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary feedback-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Sending Feedback...' : 'Send Feedback to Founder'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
