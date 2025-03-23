import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Layout from "../components/Layout";
import "../assets/Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const ordersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersList);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <Layout>
      <div className="orders-container">
        <h2>Orders</h2>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Total</th>
                <th>Date</th>
                <th>Bill</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.billId}</td>
                  <td>{order.customerName}</td>
                  <td>{order.customerPhone}</td>
                  <td>₹{order.total}</td>
                  <td>{new Date(order.timestamp.toDate()).toLocaleString()}</td>
                  <td>
                    <a href={order.billUrl} target="_blank" rel="noopener noreferrer">
                      View Bill
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default Orders;