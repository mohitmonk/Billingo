import { useState, useEffect, useRef } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, query, where } from "firebase/firestore";
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
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query
  const billRef = useRef();
  const navigate = useNavigate();

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
        ? { ...prevCart[product.id], quantity: prevCart[product.id].quantity + 1 }
        : { ...product, quantity: 1, price: sizeDetails.price },
    }));
  };

  const increaseQuantity = (productId) => {
    const product = products.find((p) => p.id === productId);
    const selectedSize = cart[productId].selectedSize;
    const sizeDetails = product.sizes[selectedSize];
    if (cart[productId].quantity >= sizeDetails.stock) {
      toast.error(`Cannot add more ${product.name} (${selectedSize}). Only ${sizeDetails.stock} in stock!`);
      return;
    }
    setCart((prevCart) => ({
      ...prevCart,
      [productId]: { ...prevCart[productId], quantity: prevCart[productId].quantity + 1 },
    }));
  };

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

  const toggleCart = () => setCartOpen(!cartOpen);

  const totalItems = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((acc, item) => acc + item.quantity * item.price, 0);

  const handleCheckoutClick = () => {
    if (totalItems === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    setShowPhoneModal(true);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!customerPhone.trim() || !/^\d{10}$/.test(customerPhone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, "customers"), where("phone", "==", customerPhone));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const customerData = querySnapshot.docs[0].data();
        setCustomerName(customerData.name);
        setShowPhoneModal(false);
        await proceedToCheckout(customerData.name, customerPhone);
      } else {
        setShowPhoneModal(false);
        setShowCustomerModal(true);
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
      toast.error("Failed to verify phone number.");
    } finally {
      setLoading(false);
    }
  };

  const proceedToCheckout = async (name, phone) => {
    setLoading(true);
    try {
      const q = query(collection(db, "customers"), where("phone", "==", phone));
      const querySnapshot = await getDocs(q);
      let customerExists = !querySnapshot.empty;

      if (!customerExists) {
        await addDoc(collection(db, "customers"), {
          name,
          phone,
          timestamp: new Date(),
        });
      }

      const updatePromises = Object.values(cart).map(async (item) => {
        const productRef = doc(db, "products", item.id);
        const product = products.find((p) => p.id === item.id);
        const selectedSize = item.selectedSize;
        const newStock = product.sizes[selectedSize].stock - item.quantity;
        if (newStock < 0) throw new Error(`Insufficient stock for ${item.name} (${selectedSize}).`);
        await updateDoc(productRef, { [`sizes.${selectedSize}.stock`]: newStock });
        setProducts((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, sizes: { ...p.sizes, [selectedSize]: { ...p.sizes[selectedSize], stock: newStock } } }
              : p
          )
        );
      });
      await Promise.all(updatePromises);

      const cloudinaryUrl = await uploadBillToCloudinary();
      const orderData = await saveOrderToFirestore(cloudinaryUrl, name, phone);

      setCart({});
      setCartOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      toast.success("Order processed successfully!");
      navigate("/checkout", { state: { cart, customer: { name, phone }, billUrl: cloudinaryUrl, totalPrice } });
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error(error.message || "Failed to process checkout.");
    } finally {
      setLoading(false);
    }
  };

  const uploadBillToCloudinary = async () => {
    const canvas = await html2canvas(billRef.current);
    const imageData = canvas.toDataURL("image/png");
    const formData = new FormData();
    formData.append("file", imageData);
    formData.append("upload_preset", "photos");
    const response = await axios.post("https://api.cloudinary.com/v1_1/dyvf3gayv/image/upload", formData);
    return response.data.secure_url;
  };

  const saveOrderToFirestore = async (cloudinaryUrl, name, phone) => {
    const billId = `BILL-${Date.now()}`;
    const orderData = {
      billId,
      customerName: name,
      customerPhone: phone,
      billUrl: cloudinaryUrl,
      items: Object.values(cart),
      total: totalPrice,
      timestamp: new Date(),
    };
    await addDoc(collection(db, "orders"), orderData);
    return orderData;
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    setShowCustomerModal(false);
    await proceedToCheckout(customerName, customerPhone);
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDate = new Date().toLocaleString();

  return (
    <div className="main-container">
      <Layout>
        <div className="bill-container" ref={billRef} style={{ position: "absolute", left: "-9999px" }}>
          <h1 className="store-name">Billingo</h1>
          <h2 className="bill-title">Bill</h2>
          <div className="bill-header">
            <p>
              <strong>Date:</strong> {currentDate}
            </p>
            <div className="customer-details">
              <p>
                <strong>Customer Name:</strong> {customerName || "N/A"}
              </p>
              <p>
                <strong>Phone Number:</strong> {customerPhone || "N/A"}
              </p>
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
                    <th>Qty</th>
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
              <h3 className="total-amount">Total: ₹{totalPrice}</h3>
            </>
          )}
        </div>

        <div className="dashboard-header">
          {!cartOpen && (
            <button className="cart-button" onClick={toggleCart}>
              <FaShoppingCart size={16} /> ({totalItems})
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
                <>
                  {Object.values(cart).map((item) => (
                    <div className="cart-item" key={item.id}>
                      <img src={item.image} alt={item.name} className="cart-item-img" />
                      <div className="cart-item-details">
                        <p>
                          {item.name} ({item.selectedSize})
                        </p>
                        <p>
                          ₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}
                        </p>
                        <div className="cart-quantity">
                          <button onClick={() => decreaseQuantity(item.id)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => increaseQuantity(item.id)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="cart-total">Total: ₹{totalPrice}</p>
                  <button className="checkout-button" onClick={handleCheckoutClick} disabled={loading}>
                    {loading ? "Processing..." : "Checkout"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {showPhoneModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Enter Phone Number</h3>
              <form onSubmit={handlePhoneSubmit}>
                <div className="form-group">
                  <label htmlFor="customerPhone">Phone</label>
                  <input
                    type="tel"
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit phone"
                    pattern="\d{10}"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowPhoneModal(false)} disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}>
                    {loading ? "Checking..." : "Next"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCustomerModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Enter Your Name</h3>
              <form onSubmit={handleCustomerSubmit}>
                <div className="form-group">
                  <label htmlFor="customerName">Name</label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
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

        <div className="products-container">
          <h2>Products</h2>
          {/* Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="clear-search">
              Clear
            </button>
          )}
          </div>
          <div className="product-grid">
            {filteredProducts.length === 0 && searchQuery ? (
              <p>No products found.</p>
            ) : (
              filteredProducts.map((product) => {
                const selectedSize = product.selectedSize;
                const sizeDetails = product.sizes[selectedSize] || {};
                return (
                  <div className="product-card" key={product.id}>
                    <img src={product.image} alt={product.name} className="product-img" />
                    <p className="product-category">{product.category}</p>
                    <h3 className="product-title">{product.name}</h3>
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
                      {Object.keys(product.sizes || {}).map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <p className="product-price">₹{sizeDetails.price || "N/A"}</p>
                    <p className="product-stock">{sizeDetails.stock || 0} left</p>
                    {cart[product.id] ? (
                      <div className="quantity-control">
                        <button onClick={() => decreaseQuantity(product.id)}>-</button>
                        <span>{cart[product.id].quantity}</span>
                        <button onClick={() => increaseQuantity(product.id)}>+</button>
                      </div>
                    ) : (
                      <button className="add-button" onClick={() => addToCart(product)}>
                        Add
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Layout>
    </div>
  );
}

export default Dashboard;
