import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"; // Added doc and updateDoc
import "../assets/Dashboard.css";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaBars, FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify"; // Added toast for error/success messages
import "react-toastify/dist/ReactToastify.css";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs.map((doc) => {
          const product = { id: doc.id, ...doc.data() };
          const firstSize = Object.keys(product.sizes || {})[0] || "";
          return { ...product, selectedSize: firstSize };
        });
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products.");
      }
    };
    fetchProducts();
  }, []);

  // Add to Cart (Increases quantity if already added)
  const addToCart = (product) => {
    const selectedSize = product.selectedSize;
    const sizeDetails = product.sizes[selectedSize];

    // Check if there’s enough stock before adding to cart
    if (sizeDetails.stock < 1) {
      toast.error(`Sorry, ${product.name} (${selectedSize}) is out of stock!`);
      return;
    }

    setCart((prevCart) => ({
      ...prevCart,
      [product.id]: prevCart[product.id]
        ? {
            ...prevCart[product.id],
            quantity: prevCart[product.id].quantity + 1,
          }
        : {
            ...product,
            quantity: 1,
            price: sizeDetails.price,
          },
    }));
  };

  // Increase Quantity
  const increaseQuantity = (productId) => {
    const product = products.find((p) => p.id === productId);
    const selectedSize = cart[productId].selectedSize;
    const sizeDetails = product.sizes[selectedSize];

    // Check if there’s enough stock to increase quantity
    if (cart[productId].quantity >= sizeDetails.stock) {
      toast.error(`Cannot add more ${product.name} (${selectedSize}). Only ${sizeDetails.stock} units in stock!`);
      return;
    }

    setCart((prevCart) => ({
      ...prevCart,
      [productId]: {
        ...prevCart[productId],
        quantity: prevCart[productId].quantity + 1,
      },
    }));
  };

  // Decrease Quantity (Remove if 0)
  const decreaseQuantity = (productId) => {
    setCart((prevCart) => {
      const updatedCart = { ...prevCart };
      if (updatedCart[productId].quantity > 1) {
        updatedCart[productId].quantity -= 1;
      } else {
        delete updatedCart[productId]; // Remove item from cart if quantity reaches 0
      }
      return updatedCart;
    });
  };

  // Toggle Cart Visibility
  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  // Calculate Total Items & Price
  const totalItems = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((acc, item) => acc + item.quantity * item.price, 0);

  // Navigate to Checkout Page after updating stock
  const navigate = useNavigate();
  const handleCheckout = async () => {
    if (totalItems === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    try {
      // Update stock for each product in the cart
      const updatePromises = Object.values(cart).map(async (item) => {
        const productRef = doc(db, "products", item.id);
        const product = products.find((p) => p.id === item.id);
        const selectedSize = item.selectedSize;
        const currentStock = product.sizes[selectedSize].stock;
        const newStock = currentStock - item.quantity;

        // Check if there’s enough stock
        if (newStock < 0) {
          throw new Error(`Insufficient stock for ${item.name} (${selectedSize}). Only ${currentStock} units available.`);
        }

        // Update the stock in Firestore
        await updateDoc(productRef, {
          [`sizes.${selectedSize}.stock`]: newStock,
        });

        // Update the local products state to reflect the new stock
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  sizes: {
                    ...p.sizes,
                    [selectedSize]: {
                      ...p.sizes[selectedSize],
                      stock: newStock,
                    },
                  },
                }
              : p
          )
        );
      });

      // Wait for all stock updates to complete
      await Promise.all(updatePromises);

      // Clear the cart after successful stock update
      setCart({});
      setCartOpen(false);

      // Store cart in localStorage for the checkout page
      localStorage.setItem("cartData", JSON.stringify(cart));

      // Show success message
      toast.success("Stock updated successfully! Proceeding to checkout...");

      // Redirect to checkout page
      navigate("/checkout");
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error(error.message || "Failed to update stock. Please try again.");
    }
  };

  return (
    <div className="main-container">
      <Layout>
        {/* Cart Section */}
        <div className="dashboard-header">
          <button className="cart-button" onClick={toggleCart}>
            <FaShoppingCart className="me-2" size={18} />
            Cart ({totalItems})
          </button>

          {cartOpen && (
            <div className="cart-dropdown">
              {totalItems === 0 ? (
                <p className="empty-cart">Your cart is empty</p>
              ) : (
                Object.values(cart).map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img src={item.image} alt={item.name} className="cart-item-img" />
                    <div>
                      <p className="quant">{item.name} ({item.selectedSize})</p>
                      <p id="quant">₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}</p>
                      <div className="cart-quantity">
                        <button onClick={() => decreaseQuantity(item.id)}>-</button>
                        <span className="quant">{item.quantity}</span>
                        <button onClick={() => increaseQuantity(item.id)}>+</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <p className="cart-total quant">Total: ₹{totalPrice}</p>
              {totalItems > 0 && (
                <button className="checkout-button" onClick={handleCheckout}>
                  Checkout
                </button>
              )}
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="products-container">
          <h2>Products</h2>
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
                    onChange={(e) =>
                      setProducts(
                        products.map((p) =>
                          p.id === product.id ? { ...p, selectedSize: e.target.value } : p
                        )
                      )
                    }
                  >
                    {Object.keys(product.sizes || {}).map((size, index) => (
                      <option key={index} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>

                  {/* Price & Stock */}
                  <p className="product-price">Price: ₹{sizeDetails.price || "N/A"}</p>
                  <p className="product-stock">Stock: {sizeDetails.stock || "N/A"} units</p>

                  {/* Add to Cart */}
                  {cart[product.id] ? (
                    <div className="quantity-control">
                      <button
                        className="quantity-btn"
                        onClick={() => decreaseQuantity(product.id)}
                      >
                        -
                      </button>
                      <span className="quant">{cart[product.id].quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => increaseQuantity(product.id)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button className="add-button" onClick={() => addToCart(product)}>
                      ADD
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Layout>
    </div>
  );
}

export default Dashboard;