import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Layout from "../components/Layout";
import "../assets/Customer.css"; // Create this file for styling

function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersRef = collection(db, "customers");
        const q = query(customersRef, orderBy("timestamp", "desc")); // Order by timestamp in descending order
        const querySnapshot = await getDocs(q);
        const customersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(customersList);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <Layout>
      <div className="customers-container">
        <h2>Customers</h2>
        {customers.length === 0 ? (
          <p>No customers found.</p>
        ) : (
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{new Date(customer.timestamp.toDate()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default Customers;