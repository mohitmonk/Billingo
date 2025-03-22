import { useState } from "react";
import { auth, googleProvider } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/login.css";
import billingoLogo from "../assets/billingo1.png";

const Register = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Registration Successful!");
      navigate("/login");
    } catch (error) {
      alert(error, "Error during registration! Please try again.")
      toast.error("Error during registration! Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Google Sign-In Successful!");
      navigate("/dashboard");
    } catch (error) {
      alert(error, "Google Sign-In Failed! Please try again.")
      toast.error("Google Sign-In Failed! Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="card border-0 shadow rounded-3">
        <div className="card-body p-4">
          <img
            src={billingoLogo}
            alt="Billingo"
            id="logo2"
            style={{ height: "40px", cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          />
          <h5 className="card-title text-center mb-4 fw-bold">Register</h5>

          <form onSubmit={handleRegister}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <label>Full Name</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label>Username</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label>Email address</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label>Password</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <label>Confirm Password</label>
            </div>

            <button className="btn w-100 mb-3" id="button-signin" type="submit">
              Register
            </button>

            <button
              type="button"
              className="btn btn-danger w-100"
              onClick={handleGoogleSignIn}
            >
              <i className="fab fa-google"></i> Sign in with Google
            </button>

            <p className="mt-3 text-center">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;