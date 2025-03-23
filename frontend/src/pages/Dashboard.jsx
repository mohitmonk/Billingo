import { useState, useEffect, useRef } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import "../assets/Dashboard.css";
import html2canvas from "html2canvas";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const billRef = useRef();

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
        delete updatedCart[productId];
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

  // Navigate to Checkout Page
  const navigate = useNavigate();

  // Show the customer details modal when Checkout is clicked
  const handleCheckoutClick = () => {
    if (totalItems === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    setShowCustomerModal(true);
  };

  // Function to capture the bill as an image and upload to Cloudinary
  const uploadBillToCloudinary = async () => {
    try {
      const canvas = await html2canvas(billRef.current);
      const imageData = canvas.toDataURL("image/png");

      const formData = new FormData();
      formData.append("file", imageData);
      formData.append("upload_preset", "photos");

      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dyvf3gayv/image/upload",
        formData
      );

      console.log("Cloudinary upload successful, URL:", response.data.secure_url);
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading bill to Cloudinary:", error);
      throw new Error("Failed to upload bill to Cloudinary: " + error.message);
    }
  };

  // Save order to Firestore
  const saveOrderToFirestore = async (cloudinaryUrl) => {
    try {
      const billId = `BILL-${Date.now()}`;
      const orderData = {
        billId,
        customerName: customerName,
        customerPhone: customerPhone,
        billUrl: cloudinaryUrl,
        items: Object.values(cart),
        total: totalPrice,
        timestamp: new Date(),
      };
      console.log("Saving order to Firestore:", orderData);
      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("Order saved successfully with ID:", docRef.id);
      return orderData;
    } catch (error) {
      console.error("Error saving order to Firestore:", error);
      throw new Error("Failed to save order to Firestore: " + error.message);
    }
  };

  // Handle form submission for customer details
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!customerPhone.trim() || !/^\d{10}$/.test(customerPhone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    try {
      // Save customer details to Firestore
      await addDoc(collection(db, "customers"), {
        name: customerName,
        phone: customerPhone,
        timestamp: new Date(),
      });

      // Update stock for each item in the cart
      const updatePromises = Object.values(cart).map(async (item) => {
        const productRef = doc(db, "products", item.id);
        const product = products.find((p) => p.id === item.id);
        const selectedSize = item.selectedSize;
        const currentStock = product.sizes[selectedSize].stock;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          throw new Error(`Insufficient stock for ${item.name} (${selectedSize}). Only ${currentStock} units available.`);
        }

        await updateDoc(productRef, {
          [`sizes.${selectedSize}.stock`]: newStock,
        });

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

      await Promise.all(updatePromises);

      // Generate and upload the bill to Cloudinary
      const cloudinaryUrl = await uploadBillToCloudinary();

      // Save the order to Firestore
      const orderData = await saveOrderToFirestore(cloudinaryUrl);

      // Clear the cart and modal states after saving the order
      setCart({});
      setCartOpen(false);
      setShowCustomerModal(false);
      setCustomerName("");
      setCustomerPhone("");

      toast.success("Order processed successfully! Proceeding to checkout...");

      // Navigate to checkout page with order data
      navigate("/checkout", {
        state: {
          cart: cart,
          customer: { name: customerName, phone: customerPhone },
          billUrl: cloudinaryUrl,
          totalPrice: totalPrice,
        },
      });
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error(error.message || "Failed to process checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get current date and time for the bill
  const currentDate = new Date().toLocaleString();

  return (
    <div className="main-container">
      <Layout>
        {/* Hidden Bill Container for html2canvas */}
        <div className="bill-container" ref={billRef} style={{ position: "absolute", left: "-9999px" }}>
          <h1 className="store-name">Billingo</h1>
          <h2 className="bill-title">Bill</h2>
          <div className="bill-header">
            <p><strong>Date:</strong> {currentDate}</p>
            <div className="customer-details">
              <p><strong>Customer Name:</strong> {customerName || "N/A"}</p>
              <p><strong>Phone Number:</strong> {customerPhone || "N/A"}</p>
            </div>
          </div>

          {Object.values(cart).length === 0 ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            <>
              <table className="bill-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Size</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(cart).map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.selectedSize}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price}</td>
                      <td>₹{item.quantity * item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3 className="total-amount">Grand Total: ₹{totalPrice}</h3>
            </>
          )}
        </div>

        {/* Cart Section */}
        <div className="dashboard-header">
          {!cartOpen && (
            <button className="cart-button" onClick={toggleCart}>
              <FaShoppingCart className="me-2" size={18} />
              Cart ({totalItems})
            </button>
          )}

          {cartOpen && (
            <div className="cart-dropdown">
              <button className="close-cart-button" onClick={toggleCart}>
                Close
              </button>
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
                <button className="checkout-button" onClick={handleCheckoutClick} disabled={loading}>
                  {loading ? "Processing..." : "Checkout"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Customer Details Modal */}
        {showCustomerModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Enter Your Details</h3>
              <form onSubmit={handleCustomerSubmit}>
                <div className="form-group">
                  <label htmlFor="customerName">Name</label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="customerPhone">Phone Number</label>
                  <input
                    type="tel"
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter your 10-digit phone number"
                    pattern="\d{10}"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowCustomerModal(false)} disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

                  <p className="product-price">Price: ₹{sizeDetails.price || "N/A"}</p>
                  <p className="product-stock">Stock: {sizeDetails.stock || "N/A"} units</p>

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