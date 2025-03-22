import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Layout from "../components/Layout";
import "../assets/Checkout.css"; // Create this file for styling

function Checkout() {
  const [cart, setCart] = useState({});
  const navigate = useNavigate(); // For navigating back

  useEffect(() => {
    const cartData = localStorage.getItem("cartData");
    if (cartData) {
      setCart(JSON.parse(cartData)); // Load cart data
    }
  }, []);
// Print Bill Function
  const handlePrint = () => {
    window.print();
  };

  // Placeholder function for SMS
  const handleSendSMS = () => {
    alert("Bill sent via SMS!");
  };
  const totalPrice = Object.values(cart).reduce((acc, item) => acc + item.quantity * item.price, 0);

  return (
    <Layout>
      <div className="checkout-container">
        <h2>Checkout</h2>
        <div className="bill-details">
          {Object.values(cart).length === 0 ? (
            <p>Your cart is empty.</p>
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
          <button className="print-btn" onClick={handlePrint}>Print Bill</button>
          <button className="sms-btn" onClick={handleSendSMS}>Send via SMS</button>
          <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    </Layout>
  );
}

export default Checkout;
