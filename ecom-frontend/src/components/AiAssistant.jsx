import { useContext, useEffect, useRef, useState } from "react";
import AppContext from "../Context/Context";
import { useToast } from "../Context/ToastContext";
import { askAssistant } from "../api/ai";
import ProductCard from "./ProductCard";

const WELCOME = {
  role: "assistant",
  text: "Hi! I'm the SmartCart AI shopping assistant. Tell me what you need in plain words — " +
        "for example \"a laptop under ₹70,000 for java development and occasional gaming\" — " +
        "and I'll search our actual catalogue and explain why each pick fits.",
  products: [],
};

const AiAssistant = () => {
  const { data, imageVersion, addToCart } = useContext(AppContext);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await askAssistant(text);
      setMessages((m) => [...m, { role: "assistant", text: res.reply, products: res.products || [] }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "I couldn't reach the store's AI service just now — check that the backend is running and try again.", products: [] },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = (product) => {
    const res = addToCart(product);
    toast(res.message, res.ok ? "success" : "error");
  };

  // The assistant's product matches carry their own fresh data (score/reasons), but stock/availability
  // can drift after page load — fall back to the live catalogue copy by id when we have one.
  const freshen = (product) => data.find((p) => String(p.id) === String(product.id)) || product;

  return (
    <>
      <button
        className={`ai-fab ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close AI shopping assistant" : "Open AI shopping assistant"}
      >
        <i className={`bi ${open ? "bi-x-lg" : "bi-stars"}`} />
        {!open && <span>Ask SmartCart AI</span>}
      </button>

      {open && (
        <div className="ai-panel" role="dialog" aria-label="SmartCart AI shopping assistant">
          <div className="ai-panel-header">
            <div>
              <strong><i className="bi bi-stars" /> SmartCart AI</strong>
              <small className="muted">Ask in your own words — I search real stock, not guesses.</small>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><i className="bi bi-x-lg" /></button>
          </div>

          <div className="ai-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg-${m.role}`}>
                <p>{m.text}</p>
                {m.products && m.products.length > 0 && (
                  <div className="ai-products">
                    {m.products.map((match) => (
                      <div className="ai-product" key={match.product.id}>
                        <ProductCard product={freshen(match.product)} imageVersion={imageVersion} onAdd={handleAdd} />
                        {match.reasons && match.reasons.length > 0 && (
                          <ul className="ai-reasons">
                            {match.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="ai-msg ai-msg-assistant">
                <p className="ai-typing"><span /><span /><span /></p>
              </div>
            )}
          </div>

          <form className="ai-input-row" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. wireless headphones under 3000 for gym"
              aria-label="Ask the AI shopping assistant"
              disabled={busy}
            />
            <button className="btn btn-primary" type="submit" disabled={busy || !input.trim()} aria-label="Send">
              <i className="bi bi-send" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiAssistant;
