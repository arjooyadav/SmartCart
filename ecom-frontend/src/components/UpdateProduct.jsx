import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppContext from "../Context/Context";
import { useToast } from "../Context/ToastContext";
import { fetchProductById, productImageUrl, updateProduct } from "../api/products";
import ProductForm from "./ProductForm";

const UpdateProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshData, imageVersion } = useContext(AppContext);
  const [product, setProduct] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchProductById(id).then(setProduct).catch(() => setFailed(true));
  }, [id]);

  const handleSubmit = async (changes, image) => {
    try {
      await updateProduct(product, changes, image);
      await refreshData();
      toast(`${changes.name} updated`);
      navigate("/admin");
    } catch (err) {
      console.error(err);
      toast("Couldn’t update the product. Check that the backend is running.", "error");
    }
  };

  if (failed) return <div className="page narrow state-box"><h2>Product not found</h2></div>;
  if (!product) return <div className="page narrow"><div className="skeleton tall" /></div>;

  return (
    <ProductForm
      title={`Edit ${product.name}`}
      subtitle="Change details, stock or the photo."
      initial={{
        name: product.name, brand: product.brand, description: product.description, price: product.price,
        category: product.category, stockQuantity: product.stockQuantity,
        releaseDate: product.releaseDate ? String(product.releaseDate).slice(0, 10) : "",
        productAvailable: product.productAvailable,
        discountPercent: String(Number(product.discountPercent) || 0),
      }}
      currentImage={productImageUrl(id, imageVersion)}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
      onCancel={() => navigate("/admin")}
    />
  );
};

export default UpdateProduct;
