import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Home({ user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Redirect to login if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch user details from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: isSidebarOpen ? "250px" : "0px",
          transition: "width 0.3s ease",
          overflow: "hidden",
        }}
      >
        {isSidebarOpen && <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.3s ease",
          marginLeft: isSidebarOpen ? "250px" : "0px",
        }}
      >
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div style={{ padding: "20px", textAlign: "center" }}>
          {loading ? (
            <h1 className="text-2xl font-bold">Loading...</h1>
          ) : (
            <>
              <h1 className="text-3xl font-bold">
                Welcome, {userData?.name || "User"}!
              </h1>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
