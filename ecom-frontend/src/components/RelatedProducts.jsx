import { useContext, useEffect, useState } from "react";
import AppContext from "../Context/Context";
import { useToast } from "../Context/ToastContext";
import { fetchRelatedProducts } from "../api/related";
import ProductCard from "./ProductCard";

const RelatedProducts = ({ productId }) => {
  const { imageVersion, addToCart } = useContext(AppContext);
  const toast = useToast();
  const [related, setRelated] = useState(null); // null = loading, [] = none found

  useEffect(() => {
    setRelated(null);
    fetchRelatedProducts(productId).then(setRelated).catch(() => setRelated([]));
  }, [productId]);

  const handleAdd = (product) => {
    const res = addToCart(product);
    toast(res.message, res.ok ? "success" : "error");
  };

  if (related === null || related.length === 0) return null;

  return (
    <section className="related">
      <h2>You might also like</h2>
      <div className="related-grid">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} imageVersion={imageVersion} onAdd={handleAdd} />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
