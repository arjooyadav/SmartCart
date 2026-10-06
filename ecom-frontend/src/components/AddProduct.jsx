import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../Context/Context";
import { useToast } from "../Context/ToastContext";
import { createProduct } from "../api/products";
import ProductForm from "./ProductForm";

const AddProduct = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshData } = useContext(AppContext);

  const handleSubmit = async (product, image) => {
    try {
      await createProduct(product, image);
      await refreshData();
      toast(`${product.name} added`);
      navigate("/admin");
    } catch (err) {
      console.error(err);
      toast("Couldn’t add the product. Check that the backend is running.", "error");
    }
  };

  return (
    <ProductForm
      title="Add a product"
      subtitle="It appears on the home page as soon as you save."
      requireImage
      submitLabel="Add product"
      onSubmit={handleSubmit}
      onCancel={() => navigate("/admin")}
    />
  );
};

export default AddProduct;
