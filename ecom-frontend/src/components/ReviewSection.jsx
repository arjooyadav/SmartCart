import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { useToast } from "../Context/ToastContext";
import { addReview, fetchReviews } from "../api/reviews";

const Stars = ({ value, size = "1rem" }) => (
  <span className="stars" style={{ fontSize: size }} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <i key={n} className={`bi ${n <= Math.round(value) ? "bi-star-fill" : "bi-star"}`} />
    ))}
  </span>
);

const StarPicker = ({ value, onChange }) => (
  <div className="star-picker" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        className={n <= value ? "on" : ""}
        onClick={() => onChange(n)}
      >
        <i className={`bi ${n <= value ? "bi-star-fill" : "bi-star"}`} />
      </button>
    ))}
  </div>
);

const formatDate = (d) => {
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const ReviewSection = ({ productId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [summary, setSummary] = useState(null); // { average, count, reviews }
  const [failed, setFailed] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetchReviews(productId).then(setSummary).catch(() => setFailed(true));
  };

  useEffect(() => {
    setSummary(null);
    setFailed(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return toast("Sign in to leave a review", "error");
    if (rating === 0) return toast("Pick a star rating first", "error");
    setSubmitting(true);
    try {
      await addReview({ productId: Number(productId), userName: user.name, userEmail: user.email, rating, comment: comment.trim() });
      setRating(0);
      setComment("");
      toast("Thanks for your review!");
      load();
    } catch (err) {
      console.error(err);
      toast("Couldn't post your review. Is the backend running?", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (failed) {
    return (
      <section className="reviews">
        <h2>Reviews</h2>
        <p className="muted small">Reviews aren't available right now — the backend may need the review endpoints added.</p>
      </section>
    );
  }
  if (!summary) return <section className="reviews"><div className="skeleton" style={{ height: 160 }} /></section>;

  return (
    <section className="reviews">
      <div className="reviews-head">
        <h2>Reviews</h2>
        {summary.count > 0 ? (
          <div className="reviews-avg">
            <Stars value={summary.average} size="1.1rem" />
            <strong>{summary.average.toFixed(1)}</strong>
            <span className="muted">({summary.count} review{summary.count === 1 ? "" : "s"})</span>
          </div>
        ) : (
          <span className="muted">No reviews yet — be the first.</span>
        )}
      </div>

      {summary.reviews.length > 0 && (
        <ul className="review-list">
          {summary.reviews.map((r) => (
            <li key={r.id} className="review-card">
              <div className="review-card-head">
                <span className="avatar sm" aria-hidden>{(r.userName || "?").charAt(0).toUpperCase()}</span>
                <div>
                  <strong>{r.userName || "Anonymous"}</strong>
                  <Stars value={r.rating} />
                </div>
                <span className="muted small">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p>{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <form className="review-form panel" onSubmit={submit}>
        <strong>{user ? "Write a review" : "Sign in to write a review"}</strong>
        <StarPicker value={rating} onChange={setRating} />
        <textarea
          rows="3"
          placeholder="What did you think of this product?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!user}
        />
        <button className="btn btn-primary btn-sm" disabled={!user || submitting}>
          {submitting ? "Posting…" : "Post review"}
        </button>
      </form>
    </section>
  );
};

export default ReviewSection;
