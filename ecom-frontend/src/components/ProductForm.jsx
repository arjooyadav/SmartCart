import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, MAX_DISCOUNT, discountedPrice, formatPrice } from "../config";

const empty = {
  name: "", brand: "", description: "", price: "", category: "",
  stockQuantity: "", releaseDate: new Date().toISOString().slice(0, 10), productAvailable: true, discountPercent: "0",
};

// Defined outside the form component so inputs keep focus while typing.
const Field = ({ label, error, children, className = "" }) => (
  <label className={`field ${className}`}>
    <span>{label}</span>
    {children}
    {error && <small className="field-error">{error}</small>}
  </label>
);

// Shared by "Add product" and "Edit product".
const ProductForm = ({ title, subtitle, initial, currentImage, requireImage, submitLabel, onSubmit, onCancel }) => {
  const [product, setProduct] = useState(() => ({ ...empty, ...initial }));
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (initial) setProduct({ ...empty, ...initial }); }, [initial]);

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : currentImage), [image, currentImage]);
  useEffect(() => () => image && URL.revokeObjectURL(preview), [image, preview]);

  // keep a category stored in another case (e.g. "laptop") selectable
  const categories = useMemo(() => {
    const match = CATEGORIES.find((c) => c.toLowerCase() === (product.category || "").toLowerCase());
    return product.category && !match ? [...CATEGORIES, product.category] : CATEGORIES;
  }, [product.category]);
  const categoryValue = categories.find((c) => c.toLowerCase() === (product.category || "").toLowerCase()) || "";

  const set = (e) => setProduct({ ...product, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!product.name.trim()) e.name = "Enter a product name.";
    if (!product.brand.trim()) e.brand = "Enter a brand.";
    if (!(Number(product.price) > 0)) e.price = "Enter a price above 0.";
    if (!categoryValue) e.category = "Choose a category.";
    if (product.stockQuantity === "" || Number(product.stockQuantity) < 0) e.stockQuantity = "Enter the stock (0 or more).";
    const discount = product.discountPercent === "" ? 0 : Number(product.discountPercent);
    if (Number.isNaN(discount) || discount < 0 || discount > MAX_DISCOUNT) e.discountPercent = `Enter 0 to ${MAX_DISCOUNT}.`;
    if (requireImage && !image) e.image = "Choose a product image.";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const stock = parseInt(product.stockQuantity, 10);
    const payload = {
      ...product,
      category: categoryValue,
      price: Number(product.price),
      stockQuantity: stock,
      discountPercent: product.discountPercent === "" ? 0 : Number(product.discountPercent),
      productAvailable: stock > 0 && product.productAvailable, // can't sell what we don't have
    };
    setSaving(true);
    try {
      await onSubmit(payload, image);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page narrow">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="muted">{subtitle}</p>}

      <form className="panel form-grid" onSubmit={submit} noValidate>
        <Field label="Name" error={errors.name}>
          <input name="name" value={product.name} onChange={set} placeholder="e.g. Aero Book 14" />
        </Field>
        <Field label="Brand" error={errors.brand}>
          <input name="brand" value={product.brand} onChange={set} placeholder="e.g. Novatech" />
        </Field>
        <Field label="Description" className="span-2">
          <textarea name="description" rows="3" value={product.description || ""} onChange={set} placeholder="What should shoppers know?" />
        </Field>
        <Field label="Price (₹)" error={errors.price}>
          <input name="price" type="number" min="0" step="0.01" value={product.price} onChange={set} />
        </Field>
        <Field label="Category" error={errors.category}>
          <select name="category" value={categoryValue} onChange={set}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Stock quantity" error={errors.stockQuantity}>
          <input name="stockQuantity" type="number" min="0" value={product.stockQuantity} onChange={set} />
        </Field>
        <Field label={`Discount (%, 0-${MAX_DISCOUNT})`} error={errors.discountPercent}>
          <input name="discountPercent" type="number" min="0" max={MAX_DISCOUNT} value={product.discountPercent ?? "0"} onChange={set} />
          {Number(product.price) > 0 && Number(product.discountPercent) > 0 && (
            <small className="muted">
              Shoppers pay {formatPrice(discountedPrice({ price: Number(product.price), discountPercent: Number(product.discountPercent) }))} instead of {formatPrice(product.price)}
            </small>
          )}
        </Field>
        <Field label="Release date">
          <input name="releaseDate" type="date" value={product.releaseDate || ""} onChange={set} />
        </Field>

        <Field label={requireImage ? "Image" : "Image (leave empty to keep the current one)"} error={errors.image} className="span-2">
          <div className="image-picker">
            {preview ? <img src={preview} alt="Preview" /> : <div className="image-empty"><i className="bi bi-image" /></div>}
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0] || null)} />
          </div>
        </Field>

        <label className="check span-2">
          <input type="checkbox" checked={product.productAvailable}
            onChange={(e) => setProduct({ ...product, productAvailable: e.target.checked })} />
          <span>Available to shoppers <small className="muted">(products with 0 stock are always unavailable)</small></span>
        </label>

        <div className="form-actions span-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : submitLabel}</button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
