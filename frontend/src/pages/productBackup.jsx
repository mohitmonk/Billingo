import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import axios from "axios";
import { FaTrash, FaEdit } from "react-icons/fa";
import "../assets/Products.css";
import Layout from "../components/Layout";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", image: null, sizes: {},category: "" });
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({}); // Stores selected size per product

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productList = querySnapshot.docs.map((doc) => {
        const product = { id: doc.id, ...doc.data() };
        const firstSize = Object.keys(product.sizes || {})[0] || "";
        return {
          ...product,
          selectedSize: firstSize, // Automatically set first size
        };
      });
      setProducts(productList);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSizeChange = (productId, size) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId ? { ...product, selectedSize: size } : product
      )
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    setNewProduct((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSizePriceStockChange = (size, field, value) => {
    setNewProduct((prev) => ({
      ...prev,
      sizes: { ...prev.sizes, [size]: { ...prev.sizes[size], [field]: value } },
    }));
  };

  const handleAddSize = () => {
    setNewProduct((prev) => ({
      ...prev,
      sizes: { ...prev.sizes, "": { price: "", stock: "" } },
    }));
  };

  const handleAddOrUpdateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = editProduct ? editProduct.image : null;

      if (newProduct.image) {
        const formData = new FormData();
        formData.append("file", newProduct.image);
        formData.append("upload_preset", "photos");

        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/dyvf3gayv/image/upload",
          formData
        );

        imageUrl = response.data.secure_url;
      }

      if (editProduct) {
        const productRef = doc(db, "products", editProduct.id);
        await updateDoc(productRef, {
          name: newProduct.name,
          image: imageUrl,
          category: newProduct.category,
          sizes: newProduct.sizes,

        });
        setEditProduct(null);
      } else {
        await addDoc(collection(db, "products"), {
          name: newProduct.name,
          image: imageUrl,
          sizes: newProduct.sizes,
        });
      }

      setNewProduct({ name: "", image: null, sizes: {}, category: "" });
      fetchProducts();
    } catch (error) {
      console.error("Error adding/updating product:", error);
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts(products.filter((product) => product.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEditProduct = (product) => {
    setEditProduct(product);
    setNewProduct({
      name: product.name,
      image: null,
      sizes: product.sizes || {},
      category: product.category || "",
    });
  };

  const handleCancelEdit = () => {
    setEditProduct(null);
    setNewProduct({ name: "", image: null, sizes: {}, category: "" });
  };

  return (
    <Layout>
    <div className="products-container">
      <h2>Products</h2>

      {/* Product Grid */}
      <div className="product-grid">
        {products.map((product) => {
          const selectedSize = product.selectedSize;
          const sizeDetails = product.sizes[selectedSize] || {};

          return (
            <div className="product-card" key={product.id}>
            <p className="product-category">{product.category}</p>
              <img src={product.image} alt={product.name} className="product-img" />
              <h3 className="product-title">{product.name}</h3>
              <p className="product-id">ID: {product.id}</p>

              {/* Size Selection */}
              <select
                className="product-size-dropdown"
                value={selectedSize}
                onChange={(e) => handleSizeChange(product.id, e.target.value)}
              >
                {Object.keys(product.sizes || {}).map((size, index) => (
                  <option key={index} value={size}>{size}</option>
                ))}
              </select>

              {/* Show Price & Stock Based on Selected Size */}
              {selectedSize ? (
                <>
                  <p className="product-price">Price: ₹{sizeDetails.price || "N/A"}</p>
                  <p className="product-stock">Stock: {sizeDetails.stock || "N/A"} units</p>
                </>
              ) : (
                <p>No sizes available</p>
              )}

              <div className="product-actions">
                <button onClick={() => handleEditProduct(product)} className="edit-btn">
                  <FaEdit />
                </button>
                <button onClick={() => handleDeleteProduct(product.id)} className="delete-btn">
                  <FaTrash />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Product Form */}
      <div className="add-product-form">
        <h3>{editProduct ? "Edit Product" : "Add New Product"}</h3>
        <form onSubmit={handleAddOrUpdateProduct}>
          <input type="text" name="name" placeholder="Product Name" value={newProduct.name} onChange={handleInputChange} required />

          {/* Sizes with Prices & Stock */}
          <div className="size-price-section">
            {Object.entries(newProduct.sizes).map(([size, { price, stock }], index) => (
              <div key={index} className="size-price-entry">
                <input
                  type="text"
                  placeholder="Size (e.g., 500g, 1L)"
                  value={size}
                  onChange={(e) => {
                    const updatedSizes = { ...newProduct.sizes };
                    updatedSizes[e.target.value] = updatedSizes[size];
                    delete updatedSizes[size];
                    setNewProduct((prev) => ({ ...prev, sizes: updatedSizes }));
                  }}
                  required
                />
                <input type="number" placeholder="Price" value={price} onChange={(e) => handleSizePriceStockChange(size, "price", e.target.value)} required />

                <input type="number" placeholder="Stock" value={stock} onChange={(e) => handleSizePriceStockChange(size, "stock", e.target.value)} required />

                <select name="category" value={newProduct.category} onChange={handleInputChange} required>
                    <option value="">Select Category</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Groceries">Groceries</option>
              </select>
              </div>
            ))}
            <button type="button" onClick={handleAddSize} className="add-size-btn">
              + Add Size
            </button>
          </div>

          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={!!editProduct} />
          <button type="submit" disabled={loading}>{loading ? "Processing..." : editProduct ? "Update Product" : "Add Product"}</button>
          {editProduct && <button type="button" onClick={handleCancelEdit} className="cancel-btn">Cancel</button>}
        </form>
      </div>
    </div>
    </Layout>
  );
};

export default Products;
