// Global State
let cart = [];

function openCart() {
  const cartModal = document.getElementById('cart-modal');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');

  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    const cartItem = document.createElement('div');
    cartItem.classList.add('cart-item');
    cartItem.innerHTML = `
      <p>${item.name} - $${item.price}</p>
      <button class="remove-btn" onclick="removeFromCart('${item.name}')">Remove</button>
    `;
    cartItems.appendChild(cartItem);
    total += item.price;
  });

  cartTotal.innerText = `Total: $${total.toFixed(2)}`;
  cartModal.style.display = 'block';
}

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

document.getElementById('cart-close-btn').addEventListener('click', closeCart);

// Removed duplicate addToCart function to avoid conflicts

function removeFromCart(productName) {
  cart = cart.filter(item => item.name !== productName);
  updateCartCount();
  openCart(); // Refresh cart
}

function updateCartCount() {
  document.getElementById('cart-count').innerText = `🛒 (${cart.length})`;
}

const elements = {
  cartModal: document.getElementById('cart-modal'),
  cartEmptyModal: document.getElementById('cart-empty-modal'),
  wishlistModal: document.getElementById('wishlist-modal'),
  authModal: document.getElementById('auth-modal'),
  quickviewModal: document.getElementById('quickview-modal'),
  notification: document.getElementById('notification'),
  loadingSpinner: document.getElementById('loading-spinner'),
  cartCount: document.getElementById('cart-count'),
  wishlistCount: document.getElementById('wishlist-count'),
  cartItems: document.getElementById('cart-items'),
  wishlistItems: document.getElementById('wishlist-items'),
  searchInput: document.getElementById('search-input'),
  searchButton: document.getElementById('search-button'),
  clearSearch: document.getElementById('clear-search'),
  sortSelect: document.getElementById('sort-select')
};

// Initialize App
function init() {
  updateCartUI();
  updateWishlistUI();
  updateUserUI();
  setupEventListeners();
  
  // Initialize product event listeners
  document.querySelectorAll('.product').forEach(product => {
    const id = product.dataset.id;
    const wishlistBtn = product.querySelector('.wishlist-btn');
    
    // Set initial wishlist heart state
    if (state.wishlist.some(item => item.id === id)) {
      wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
      wishlistBtn.classList.add('active');
    }
  });
}

// Data Management
function saveState() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
  localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
  if (state.currentUser) {
    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
  } else {
    localStorage.removeItem('currentUser');
  }
}

// Cart Functions
function addToCart(productId, productName, price, image, quantity = 1) {
  const existingItem = state.cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    state.cart.push({
      id: productId,
      name: productName,
      price: parseFloat(price),
      image: image,
      quantity: quantity,
      size: state.selectedSize,
      color: state.selectedColor
    });
  }
  
  saveState();
  updateCartUI();
  showNotification(`${productName} added to cart`, 'success');
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  saveState();
  updateCartUI();
  showNotification('Item removed from cart', 'success');
}

function updateCartQuantity(productId, newQuantity) {
  const item = state.cart.find(item => item.id === productId);
  if (item) {
    newQuantity = Math.max(1, Math.min(10, parseInt(newQuantity) || 1));
    item.quantity = newQuantity;
    saveState();
    updateCartUI();
  }
}

function updateCartUI() {
  // Update cart count
  const totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);
  elements.cartCount.textContent = totalItems > 0 ? `(${totalItems})` : '';
  
  // Render cart items if modal is open
  if (elements.cartModal.style.display === 'block') {
    renderCartItems();
  }
}

function renderCartItems() {
  if (state.cart.length === 0) {
    elements.cartItems.innerHTML = '<p>Your cart is empty</p>';
    document.getElementById('cart-subtotal').textContent = '$0.00';
    document.getElementById('cart-tax').textContent = '$0.00';
    document.getElementById('cart-total').textContent = '$0.00';
    return;
  }
  
  let itemsHTML = '';
  let subtotal = 0;
  
  state.cart.forEach(item => {
    subtotal += item.price * item.quantity;
    itemsHTML += `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.name}</h4>
          <span class="cart-item-price">$${item.price.toFixed(2)}</span>
          ${item.size ? `<span class="cart-item-size">Size: ${item.size}</span>` : ''}
          ${item.color ? `<span class="cart-item-color">Color: ${item.color}</span>` : ''}
          <div class="quantity-control">
            <span>Quantity: </span>
            <input type="number" min="1" max="10" value="${item.quantity}" 
                   class="cart-item-quantity-input" onchange="updateCartQuantity('${item.id}', this.value)">
          </div>
          <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    `;
  });
  
  const shipping = 5.99;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;
  
  elements.cartItems.innerHTML = itemsHTML;
  document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

// Wishlist Functions
function toggleWishlistItem(productId) {
  const product = document.querySelector(`.product[data-id="${productId}"]`);
  if (!product) return;
  
  const index = state.wishlist.findIndex(item => item.id === productId);
  const wishlistBtns = document.querySelectorAll(`.wishlist-btn[onclick*="${productId}"]`);
  
  if (index === -1) {
    state.wishlist.push({
      id: productId,
      name: product.dataset.name,
      price: parseFloat(product.dataset.price),
      image: product.querySelector('.product-image').src,
      category: product.dataset.category
    });
    showNotification('Added to wishlist', 'success');
    wishlistBtns.forEach(btn => {
      btn.innerHTML = '<i class="fas fa-heart"></i>';
      btn.classList.add('active');
    });
  } else {
    state.wishlist.splice(index, 1);
    showNotification('Removed from wishlist', 'success');
    wishlistBtns.forEach(btn => {
      btn.innerHTML = '<i class="far fa-heart"></i>';
      btn.classList.remove('active');
    });
  }
  
  saveState();
  updateWishlistUI();
}

function updateWishlistUI() {
  // Update wishlist count
  elements.wishlistCount.textContent = state.wishlist.length > 0 ? `(${state.wishlist.length})` : '';
  
  // Render wishlist items if modal is open
  if (elements.wishlistModal.style.display === 'block') {
    renderWishlistItems();
  }
}

function renderWishlistItems() {
  if (state.wishlist.length === 0) {
    elements.wishlistItems.innerHTML = '<p>Your wishlist is empty</p>';
    return;
  }
  
  elements.wishlistItems.innerHTML = state.wishlist.map(item => `
    <div class="wishlist-item">
      <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
      <div class="wishlist-item-details">
        <div class="wishlist-item-title">${item.name}</div>
        <div class="wishlist-item-price">$${item.price.toFixed(2)}</div>
        <div class="wishlist-item-actions">
          <button class="wishlist-add-to-cart" onclick="addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price}, '${item.image}')">Add to Cart</button>
          <button class="wishlist-remove" onclick="toggleWishlistItem('${item.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Product Quick View
function quickView(productId) {
  const product = document.querySelector(`.product[data-id="${productId}"]`);
  if (!product) return;
  
  state.currentProduct = {
    id: productId,
    element: product
  };
  state.selectedSize = null;
  state.selectedColor = null;
  state.currentQuantity = 1;
  
  // Reset selections
  document.querySelectorAll('.size-option, .color-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // Set product details
  document.getElementById('quickview-title').textContent = product.querySelector('h4').textContent;
  document.getElementById('quickview-price').textContent = `$${product.dataset.price}`;
  document.getElementById('quickview-image').src = product.querySelector('.product-image').src;
  
  const ratingElement = product.querySelector('.product-rating');
  if (ratingElement) {
    document.getElementById('quickview-rating').innerHTML = ratingElement.innerHTML;
  }
  
  const oldPriceElement = product.querySelector('.old-price');
  document.getElementById('quickview-old-price').style.display = oldPriceElement ? 'inline' : 'none';
  if (oldPriceElement) {
    document.getElementById('quickview-old-price').textContent = oldPriceElement.textContent;
  }
  
  document.getElementById('product-quantity').value = '1';
  
  // Set wishlist button state
  const isInWishlist = state.wishlist.some(item => item.id === productId);
  document.getElementById('quickview-add-to-wishlist').innerHTML = 
    `<i class="${isInWishlist ? 'fas' : 'far'} fa-heart"></i>`;
  
  openModal('quickview');
}

// Modal Functions
function openModal(modalType) {
  // Close all modals first
  closeAllModals();
  
  switch(modalType) {
    case 'cart':
      renderCartItems();
      elements.cartModal.style.display = 'block';
      break;
    case 'wishlist':
      renderWishlistItems();
      elements.wishlistModal.style.display = 'block';
      break;
    case 'auth':
      elements.authModal.style.display = 'block';
      break;
    case 'quickview':
      elements.quickviewModal.style.display = 'block';
      break;
    case 'cart-empty':
      elements.cartEmptyModal.style.display = 'block';
      break;
  }
  
  document.body.style.overflow = 'hidden';
}

function closeModal(modalType) {
  const modal = elements[`${modalType}Modal`];
  if (modal) {
    modal.style.display = 'none';
  }
  
  // If no modals are open, restore scrolling
  if (!document.querySelector('.modal[style*="display: block"]')) {
    document.body.style.overflow = 'auto';
  }
}

function closeAllModals() {
  Object.keys(elements).forEach(key => {
    if (key.endsWith('Modal') && elements[key]) {
      elements[key].style.display = 'none';
    }
  });
  document.body.style.overflow = 'auto';
}

// Search and Sort Functions
function handleSearch() {
  const searchTerm = elements.searchInput.value.trim().toLowerCase();
  
  if (searchTerm) {
    elements.clearSearch.style.display = 'block';
  } else {
    elements.clearSearch.style.display = 'none';
    document.querySelectorAll('.product').forEach(p => p.style.display = 'block');
    return;
  }

  const products = document.querySelectorAll('.product');
  let foundAny = false;

  products.forEach(product => {
    const name = product.dataset.name.toLowerCase();
    const category = product.dataset.category.toLowerCase();
    const brand = product.dataset.brand.toLowerCase();
    
    if (name.includes(searchTerm) || category.includes(searchTerm) || brand.includes(searchTerm)) {
      product.style.display = 'block';
      foundAny = true;
    } else {
      product.style.display = 'none';
    }
  });

  if (!foundAny) {
    showNotification('No products found matching your search', 'error');
  }
}

function clearSearch() {
  elements.searchInput.value = '';
  elements.clearSearch.style.display = 'none';
  document.querySelectorAll('.product').forEach(p => p.style.display = 'block');
}

function sortProducts(sortOption) {
  const productContainer = document.querySelector('.category-products');
  if (!productContainer) return;

  const products = Array.from(productContainer.querySelectorAll('.product'));
  
  products.sort((a, b) => {
    const aPrice = parseFloat(a.dataset.price);
    const bPrice = parseFloat(b.dataset.price);
    const aRating = parseFloat(a.dataset.rating);
    const bRating = parseFloat(b.dataset.rating);
    const aId = parseInt(a.dataset.id);
    const bId = parseInt(b.dataset.id);

    switch(sortOption) {
      case 'price-low':
        return aPrice - bPrice;
      case 'price-high':
        return bPrice - aPrice;
      case 'rating':
        return bRating - aRating;
      case 'newest':
        return bId - aId;
      default:
        return aId - bId;
    }
  });

  products.forEach(product => productContainer.appendChild(product));
}

// Auth Functions
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.getElementById('login-form').style.display = 'style';
  document.getElementById('signup-form').style.display = 'style';
  
  if (tab === 'login') {
    document.querySelector('.auth-tab[onclick*="login"]').classList.add('active');
    document.getElementById('login-form').style.display = 'block';
  } else {
    document.querySelector('.auth-tab[onclick*="signup"]').classList.add('active');
    document.getElementById('signup-form').style.display = 'block';
  }
}

function handleAuth(isLogin) {
  const email = isLogin ? 
    document.getElementById('login-email').value : 
    document.getElementById('signup-email').value;
  const password = isLogin ? 
    document.getElementById('login-password').value : 
    document.getElementById('signup-password').value;
  
  if (isLogin) {
    if (email && password) {
      state.currentUser = { email, name: "User" };
      saveState();
      updateUserUI();
      showNotification('Login successful!', 'success');
      closeModal('auth');
    } else {
      showNotification('Please fill in all fields', 'error');
    }
  } else {
    const name = document.getElementById('signup-name').value;
    if (name && email && password) {
      state.currentUser = { email, name };
      saveState();
      updateUserUI();
      showNotification('Account created successfully!', 'success');
      closeModal('auth');
    } else {
      showNotification('Please fill in all fields', 'error');
    }
  }
}

function handleLogout() {
  state.currentUser = null;
  saveState();
  updateUserUI();
  showNotification('Logged out successfully', 'success');
}

function updateUserUI() {
  const userName = document.getElementById('user-name');
  const loginLink = document.getElementById('login-link');
  const profileLink = document.getElementById('profile-link');
  const ordersLink = document.getElementById('orders-link');
  const logoutLink = document.getElementById('logout-link');
  
  if (state.currentUser) {
    userName.textContent = state.currentUser.name || 'Account';
    loginLink.style.display = 'none';
    profileLink.style.display = 'block';
    ordersLink.style.display = 'block';
    logoutLink.style.display = 'block';
  } else {
    userName.textContent = 'Account';
    loginLink.style.display = 'block';
    profileLink.style.display = 'none';
    ordersLink.style.display = 'none';
    logoutLink.style.display = 'none';
  }
}


function showNotification(message, type = 'success') {
  if (!elements.notification) return;
  
  elements.notification.textContent = message;
  elements.notification.className = 'notification show ' + type;
  
  setTimeout(() => {
    elements.notification.classList.remove('show');
  }, 3000);
}

function showLoading(show) {
  if (!elements.loadingSpinner) return;
  elements.loadingSpinner.style.display = show ? 'flex' : 'none';
}

function calculateCartTotal() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 5.99;
  const tax = subtotal * 0.1;
  return subtotal + shipping + tax;
}

function setupEventListeners() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeAllModals();
      }
    });
  });
  
  elements.searchButton.addEventListener('click', handleSearch);
  elements.searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleSearch();
  });
  elements.clearSearch.addEventListener('click', clearSearch);
  
  
  elements.sortSelect.addEventListener('change', function() {
    sortProducts(this.value);
  });
  
  document.getElementById('quickview-add-to-cart')?.addEventListener('click', function() {
    if (!state.selectedSize) {
      showNotification('Please select a size', 'error');
      return;
    }
    
    const product = state.currentProduct?.element;
    if (!product) return;
    
    addToCart(
      state.currentProduct.id,
      product.dataset.name,
      product.dataset.price,
      product.querySelector('.product-image').src,
      state.currentQuantity
    );
    
    closeModal('quickview');
  });
  
  document.getElementById('quickview-add-to-wishlist')?.addEventListener('click', function() {
    if (!state.currentProduct) return;
    toggleWishlistItem(state.currentProduct.id);
    this.innerHTML = `<i class="${state.wishlist.some(item => item.id === state.currentProduct.id) ? 'fas' : 'far'} fa-heart"></i>`;
  });
  
  document.getElementById('product-quantity')?.addEventListener('change', function() {
    state.currentQuantity = Math.max(1, Math.min(10, parseInt(this.value) || 1));
    this.value = state.currentQuantity;
  });
}

window.openModal = openModal;
window.closeModal = closeModal;
window.switchAuthTab = switchAuthTab;
window.handleAuth = handleAuth;
window.handleLogout = handleLogout;
window.addToCart = addToCart;
window.toggleWishlistItem = toggleWishlistItem;
window.quickView = quickView;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.sortProducts = sortProducts;

window.selectSize = function(element) {
  document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  state.selectedSize = element.textContent;
};

window.selectColor = function(element) {
  document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  state.selectedColor = element.style.backgroundColor;
};

window.changeQuantity = function(change) {
  const input = document.getElementById('product-quantity');
  const newVal = Math.max(1, Math.min(10, parseInt(input.value) + change));
  input.value = newVal;
  state.currentQuantity = newVal;
};

window.showCategory = function(category) {
  document.querySelectorAll('.category').forEach(cat => {
    cat.style.display = 'none';
  });
  
  document.querySelectorAll('.category-bar a').forEach(link => {
    link.classList.remove('active');
  });
  
  const categoryElement = document.getElementById(category);
  if (categoryElement) {
    categoryElement.style.display = 'block';
    document.querySelector(`.category-bar a[href="#${category}"]`).classList.add('active');
    document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  }
};

window.checkout = function() {
  if (state.cart.length === 0) {
    showNotification('Your cart is empty', 'error');
    openModal('cart-empty');
    return;
  }

  if (!state.currentUser) {
    showNotification('Please login to checkout', 'error');
    openModal('auth');
    switchAuthTab('login');
    return;
  }

  showLoading(true);
  
  setTimeout(() => {
    showLoading(false);
    const order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...state.cart],
      total: calculateCartTotal(),
      status: 'processing'
    };
    
    state.cart = [];
    saveState();
    updateCartUI();
    closeModal('cart');
    
    showNotification('Order placed successfully!', 'success');
  }, 1500);
};

window.navigateToShop = function() {
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  closeAllModals();
};

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    closeAllModals();
  }
});
// Enhanced state management
const state = {
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  wishlist: JSON.parse(localStorage.getItem('wishlist')) || [],
  currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
  currentProduct: null,
  selectedSize: null,
  selectedColor: null,
  currentQuantity: 1,
  currentCategory: 'men'
};

// Enhanced filter functionality
function applyFilters() {
  const priceValue = parseInt(document.getElementById('price-slider').value);
  const selectedColors = Array.from(document.querySelectorAll('.color-filter input:checked')).map(c => c.value);
  const selectedSizes = Array.from(document.querySelectorAll('.size-filter input:checked')).map(s => s.value);
  const selectedBrands = Array.from(document.querySelectorAll('.brand-filter-options input:checked')).map(b => b.value);

  document.querySelectorAll('.product').forEach(product => {
    const price = parseInt(product.dataset.price);
    const color = product.dataset.color || '';
    const size = product.dataset.size || '';
    const brand = product.dataset.brand || '';
    
    const matchPrice = price <= priceValue;
    const matchColor = selectedColors.length === 0 || selectedColors.includes(color);
    const matchSize = selectedSizes.length === 0 || selectedSizes.includes(size);
    const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(brand);

    product.style.display = (matchPrice && matchColor && matchSize && matchBrand) ? 'block' : 'none';
  });
}

// Enhanced search functionality
function handleSearch() {
  const term = document.getElementById('search-input').value.toLowerCase();
  document.querySelectorAll('.product').forEach(product => {
    const text = [
      product.dataset.name,
      product.dataset.category,
      product.dataset.brand,
      product.querySelector('h4').textContent
    ].join(' ').toLowerCase();
    product.style.display = text.includes(term) ? 'block' : 'none';
  });
}

// Complete checkout process
function checkout() {
  if (state.cart.length === 0) {
    showNotification('Your cart is empty!', 'error');
    return;
  }
  
  showLoading(true);
  setTimeout(() => {
    state.cart = [];
    saveState();
    updateCartUI();
    showLoading(false);
    showNotification('Order placed successfully!', 'success');
    closeModal('cart');
  }, 1500);
}

// Enhanced initialization
function init() {
  updateCartUI();
  updateWishlistUI();
  updateUserUI();
  
  // Initialize event listeners
  document.getElementById('price-slider').addEventListener('input', function() {
    document.getElementById('price-value').textContent = `$${this.value}`;
    applyFilters();
  });
  
  document.querySelectorAll('.filter-group input').forEach(input => {
    input.addEventListener('change', applyFilters);
  });
  
  // Initialize category display
  showCategory('men');
}

// Add remaining JavaScript functions from previous answer here...

// Start the application
document.addEventListener('DOMContentLoaded', init);
// Ensure cart functions are properly initialized
function initializeCart() {
  // Load cart from localStorage if available
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    state.cart = JSON.parse(savedCart);
  }

  // Update cart UI on page load
  updateCartUI();
}

// Save cart to localStorage whenever it changes
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
}

// Add event listeners for cart actions
function setupCartEventListeners() {
  document.getElementById('cart-open-btn').addEventListener('click', () => openModal('cart'));
  document.getElementById('cart-close-btn').addEventListener('click', () => closeModal('cart'));
}

// Initialize cart functionality
initializeCart();
setupCartEventListeners();
