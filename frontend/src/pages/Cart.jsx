import { FaTrash } from "react-icons/fa";

const Cart = ({ cart, setCart, onCheckout }) => {
  const totalItems = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((acc, item) => acc + item.quantity * item.price, 0);

  const updateQuantity = (productId, change) => {
    setCart((prevCart) => {
      const updatedCart = { ...prevCart };
      if (updatedCart[productId].quantity + change > 0) {
        updatedCart[productId].quantity += change;
      } else {
        delete updatedCart[productId];
      }
      return updatedCart;
    });
  };

  return (
    <div className="cart-dropdown">
      {totalItems === 0 ? <p className="empty-cart">Your cart is empty</p> : (
        Object.values(cart).map((item) => (
          <div className="cart-item" key={item.id}>
            <img src={item.image} alt={item.name} className="cart-item-img" />
            <div>
              <p className="quant">{item.name} ({item.selectedSize})</p>
              <p id="quant">₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}</p>
              <div className="cart-quantity">
                <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                <span className="quant">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)}>+</button>
              </div>
            </div>
            <button onClick={() => updateQuantity(item.id, -item.quantity)} className="remove-btn">
              <FaTrash />
            </button>
          </div>
        ))
      )}
      <p className="cart-total quant">Total: ₹{totalPrice}</p>
      {totalItems > 0 && <button className="checkout-button" onClick={onCheckout}>Checkout</button>}
    </div>
  );
};

export default Cart;
