import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EditProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
  });

  // Fetch User Data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData({ ...userSnap.data(), email: currentUser.email });
      }
    };
    fetchUserData();
  }, [currentUser]);

  // Handle Input Change
  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission (Update Firestore)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, {
          name: userData.name,
          username: userData.username,
          phone: userData.phone,
        });
      } else {
        await setDoc(userRef, {
          name: userData.name,
          username: userData.username,
          email: currentUser.email,
          phone: userData.phone,
        });
      }

      alert("Profile updated successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={userData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            name="username"
            value={userData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={userData.email}
            disabled
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone Number</label>
          <input
            type="text"
            className="form-control"
            name="phone"
            value={userData.phone}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
