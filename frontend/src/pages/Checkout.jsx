import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import "../assets/Checkout.css";
import axios from "axios";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const billRef = useRef();
  const [loading, setLoading] = useState(false);

  // Get data from navigation state
  const { cart = {}, customer = null, billUrl = null, totalPrice = 0 } = location.state || {};

  // Get current date and time
  const currentDate = new Date().toLocaleString();

  // Handle Print Bill
  const handlePrint = () => {
    setLoading(true);
    try {
      window.print();
    } catch (error) {
      console.error("Error in handlePrint:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Send via SMS by calling the deployed backend API
  const handleSendSMS = async () => {
    if (!customer || !customer.phone) {
      alert("Customer phone number is not available.");
      return;
    }

    if (!billUrl) {
      alert("Bill URL is not available.");
      return;
    }

    setLoading(true);

    try {
      const phoneNumber = `+91${customer.phone}`; // Adjust country code as needed (e.g., +91 for India)

      // Use environment variable for the backend URL
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://billingo.onrender.com";
      const response = await axios.post(`${backendUrl}/send-sms`, {
        phoneNumber: phoneNumber,
        billUrl: billUrl,
      });

      if (response.status === 200) {
        alert("Bill URL sent via SMS successfully!");
      } else {
        console.error("Backend API error:", response.data);
        alert("Failed to send SMS. Please try again.");
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      alert("Error sending SMS: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="checkout-container">
        <div className="bill-container" ref={billRef}>
          <h1 className="store-name">Billingo</h1>
          <h2 className="bill-title">Bill</h2>
          <div className="bill-header">
            <p><strong>Date:</strong> {currentDate}</p>
            {customer && (
              <div className="customer-details">
                <p><strong>Customer Name:</strong> {customer.name}</p>
                <p><strong>Phone Number:</strong> {customer.phone}</p>
              </div>
            )}
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

        <div className="bill-actions">
          <button className="print-btn" onClick={handlePrint} disabled={loading}>
            {loading ? "Processing..." : "Print Bill"}
          </button>
          <button className="sms-btn" onClick={handleSendSMS} disabled={loading}>
            {loading ? "Processing..." : "Send via SMS"}
          </button>
          <button className="back-button" onClick={() => navigate("/dashboard")} disabled={loading}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Checkout;
