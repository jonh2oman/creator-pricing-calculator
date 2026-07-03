/* ==========================================================================
   Creator Pricing Lab JS Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const calcForms = document.querySelectorAll('.calc-form');
  const body = document.body;

  // Output Dashboard Elements
  const rrpValue = document.getElementById('rrp-value');
  const rrpMarkupText = document.getElementById('rrp-markup');
  const costValue = document.getElementById('cost-value');
  const costSubtext = document.getElementById('cost-subtext');
  const consignmentValue = document.getElementById('consignment-value');
  const consignmentRateText = document.getElementById('consignment-rate');
  const payoutValue = document.getElementById('payout-value');
  const payoutSubtext = document.getElementById('payout-subtext');
  const profitValue = document.getElementById('profit-value');
  const profitMarginPct = document.getElementById('profit-margin-pct');
  const wholesaleValue = document.getElementById('wholesale-value');
  const wholesaleProfit = document.getElementById('wholesale-profit');

  // Chart Elements
  const costChart = document.getElementById('cost-chart');
  const centerRatio = document.getElementById('center-ratio');
  const chartLegend = document.getElementById('chart-legend');

  // Action Elements
  const productNameInput = document.getElementById('product-name-input');
  const btnSave = document.getElementById('btn-save');
  const btnExport = document.getElementById('btn-export');
  const btnReset = document.getElementById('btn-reset');
  const toastElement = document.getElementById('toast');

  // Library Elements
  const libraryList = document.getElementById('library-list');
  const librarySearch = document.getElementById('library-search');
  const savedCount = document.getElementById('saved-count');

  // --- App State ---
  let activeTab = '3dprint';
  let products = [];
  let editingProductId = null;

  // --- Firebase Initialization ---
  const firebaseConfig = {
    apiKey: "AIzaSyAKryJEBbB1Le4xA6-cKiv7V-BqJeWkeLg",
    authDomain: "pricing-calculator-4ebac.firebaseapp.com",
    projectId: "pricing-calculator-4ebac",
    storageBucket: "pricing-calculator-4ebac.firebasestorage.app",
    messagingSenderId: "793929161860",
    appId: "1:793929161860:web:bf46813eb966765a0cf6d1",
    measurementId: "G-8G0W19752G"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  const auth = firebase.auth();
  let currentUser = null;
  let unsubscribeProducts = null;
  let unsubscribeSettings = null;

  // Auth UI Elements
  const authContainer = document.getElementById('auth-container');
  const authUserEmail = document.getElementById('auth-user-email');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnSettingsHeader = document.getElementById('btn-settings');
  
  const modalAuth = document.getElementById('modal-auth');
  const btnSubmitAuth = document.getElementById('btn-submit-auth');
  const btnToggleAuth = document.getElementById('btn-toggle-auth');
  const authTitle = document.getElementById('auth-title');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const authError = document.getElementById('auth-error');
  let isSignUp = false;

  // Listen to Auth State
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      // Logged in
      authUserEmail.textContent = user.email;
      authUserEmail.style.display = 'inline';
      btnLogin.style.display = 'none';
      btnLogout.style.display = 'inline-block';
      btnSettingsHeader.style.display = 'inline-flex';
      
      // Load user products
      unsubscribeProducts = db.collection('users').doc(user.uid).collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        products = [];
        snapshot.forEach(doc => {
          products.push({ id: doc.id, ...doc.data() });
        });
        renderLibraryList();
      });

      // Load user settings
      unsubscribeSettings = db.collection('users').doc(user.uid).collection('settings').doc('global').onSnapshot(doc => {
        if (doc.exists) {
          currentSettings = doc.data();
        } else {
          currentSettings = { bizName: '', bizEmail: '', bizLogo: '' };
        }
      });
      
    } else {
      // Logged out
      authUserEmail.style.display = 'none';
      btnLogin.style.display = 'inline-block';
      btnLogout.style.display = 'none';
      btnSettingsHeader.style.display = 'none';
      
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeSettings) unsubscribeSettings();
      
      products = [];
      currentSettings = { bizName: '', bizEmail: '', bizLogo: '' };
      renderLibraryList();
    }
  });

  // Auth Modal Logic
  btnLogin.addEventListener('click', () => {
    authError.style.display = 'none';
    modalAuth.classList.add('open');
  });

  btnLogout.addEventListener('click', () => {
    auth.signOut();
    showToast('Signed out successfully.');
  });

  btnToggleAuth.addEventListener('click', () => {
    isSignUp = !isSignUp;
    authTitle.textContent = isSignUp ? 'Create Account' : 'Sign In';
    btnSubmitAuth.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    btnToggleAuth.textContent = isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up';
    authError.style.display = 'none';
  });

  btnSubmitAuth.addEventListener('click', () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (!email || !password) return;

    btnSubmitAuth.disabled = true;
    
    const authPromise = isSignUp 
      ? auth.createUserWithEmailAndPassword(email, password)
      : auth.signInWithEmailAndPassword(email, password);
      
    authPromise.then(() => {
      modalAuth.classList.remove('open');
      showToast(isSignUp ? 'Account created!' : 'Signed in successfully!');
      authEmail.value = '';
      authPassword.value = '';
    }).catch(err => {
      authError.textContent = err.message;
      authError.style.display = 'block';
    }).finally(() => {
      btnSubmitAuth.disabled = false;
    });
  });

  // --- Helper Functions ---
  const getInputValue = (id) => parseFloat(document.getElementById(id).value) || 0;
  
  const setInputValue = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  const showToast = (message) => {
    toastElement.textContent = message;
    toastElement.classList.add('show');
    setTimeout(() => {
      toastElement.classList.remove('show');
    }, 3000);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  // --- Theme Specific Details ---
  const themeDetails = {
    '3dprint': {
      color: '#7c4dff',
      name: '3D Print'
    },
    'sticker': {
      color: '#00e5ff',
      name: 'Sticker'
    },
    'custom': {
      color: '#ff9100',
      name: 'Custom Product'
    }
  };

  // --- Calculation Engines ---
  const calculate3DPrint = () => {
    const spoolPrice = getInputValue('print-spool-price');
    const spoolWeight = getInputValue('print-spool-weight') || 1000;
    const printWeight = getInputValue('print-weight');
    
    const laborRate = getInputValue('print-labor-rate');
    const setupTime = getInputValue('print-setup-time');
    const finishTime = getInputValue('print-finish-time');
    
    const printTime = getInputValue('print-time');
    const power = getInputValue('print-power');
    const electricityCost = getInputValue('print-electricity');
    
    const failureRate = getInputValue('print-failure-rate');
    const markup = getInputValue('print-markup');
    const consignmentFeePct = getInputValue('print-consignment');
    const fixedCosts = getInputValue('print-fixed-costs');

    // Formula execution
    const materialCost = (printWeight / spoolWeight) * spoolPrice;
    const laborCost = (setupTime + finishTime) * laborRate;
    const energyCost = (printTime * power / 1000) * electricityCost;
    
    const baseCost = materialCost + laborCost + energyCost + fixedCosts;
    const failureBuffer = baseCost * (failureRate / 100);
    const totalCost = baseCost + failureBuffer;
    
    const profit = totalCost * (markup / 100);
    const targetPayout = totalCost + profit;
    
    const consignmentMultiplier = consignmentFeePct >= 100 ? 0.001 : 1 - (consignmentFeePct / 100);
    const rrp = targetPayout / consignmentMultiplier;
    const consignmentAmount = rrp * (consignmentFeePct / 100);
    const payout = rrp - consignmentAmount;
    const netProfit = payout - totalCost;

    const wholesale = rrp * 0.50;
    const wholesaleProfit = wholesale - totalCost;

    return {
      totalCost,
      rrp,
      profit: netProfit,
      consignmentAmount,
      consignmentFeePct,
      payout,
      wholesale,
      wholesaleProfit,
      breakdown: [
        { name: 'Materials', value: materialCost + (materialCost * failureRate / 100), color: '#a78bfa' },
        { name: 'Labor', value: laborCost + (laborCost * failureRate / 100), color: '#818cf8' },
        { name: 'Power & Wear', value: energyCost + (energyCost * failureRate / 100), color: '#fbbf24' },
        { name: 'Overhead', value: fixedCosts + (fixedCosts * failureRate / 100), color: '#f472b6' },
        { name: 'Consignment', value: consignmentAmount, color: '#f59e0b' },
        { name: 'Profit Margin', value: netProfit, color: '#10b981' }
      ]
    };
  };

  const calculateSticker = () => {
    const sheetCost = getInputValue('sticker-sheet-cost');
    const yieldCount = getInputValue('sticker-yield') || 1;
    const failPct = getInputValue('sticker-fail-pct');
    
    const laborRate = getInputValue('sticker-labor-rate');
    const setupTime = getInputValue('sticker-setup-time');
    const cutTime = getInputValue('sticker-cut-time');
    
    const envelope = getInputValue('sticker-envelope');
    const sleeve = getInputValue('sticker-sleeve');
    
    const markup = getInputValue('sticker-markup');
    const consignmentFeePct = getInputValue('sticker-consignment');
    const fixedCosts = getInputValue('sticker-fixed-costs');

    // Formulas
    const rawMaterialCost = (sheetCost / yieldCount) * (1 + failPct / 100);
    const packagingCost = envelope + sleeve;
    
    const totalLaborTime = setupTime + cutTime;
    const laborCostPerSticker = (totalLaborTime * laborRate) / yieldCount;
    
    const fixedCostsPerSticker = fixedCosts; // Treated as fixed cost overhead per sticker
    
    const totalCost = rawMaterialCost + packagingCost + laborCostPerSticker + fixedCostsPerSticker;
    const profit = totalCost * (markup / 100);
    const targetPayout = totalCost + profit;

    const consignmentMultiplier = consignmentFeePct >= 100 ? 0.001 : 1 - (consignmentFeePct / 100);
    const rrp = targetPayout / consignmentMultiplier;
    const consignmentAmount = rrp * (consignmentFeePct / 100);
    const payout = rrp - consignmentAmount;
    const netProfit = payout - totalCost;
    
    const wholesale = rrp * 0.50;
    const wholesaleProfit = wholesale - totalCost;

    return {
      totalCost,
      rrp,
      profit: netProfit,
      consignmentAmount,
      consignmentFeePct,
      payout,
      wholesale,
      wholesaleProfit,
      breakdown: [
        { name: 'Materials', value: rawMaterialCost, color: '#22d3ee' },
        { name: 'Packaging', value: packagingCost, color: '#38bdf8' },
        { name: 'Labor', value: laborCostPerSticker, color: '#818cf8' },
        { name: 'Overhead', value: fixedCostsPerSticker, color: '#f472b6' },
        { name: 'Consignment', value: consignmentAmount, color: '#f59e0b' },
        { name: 'Profit Margin', value: netProfit, color: '#10b981' }
      ]
    };
  };

  const calculateCustom = () => {
    const material = getInputValue('custom-material-cost');
    const packaging = getInputValue('custom-packaging-cost');
    const laborRate = getInputValue('custom-labor-rate');
    const laborTime = getInputValue('custom-labor-time');
    const fixedCosts = getInputValue('custom-fixed-costs');
    const failPct = getInputValue('custom-failure-rate');
    const markup = getInputValue('custom-markup');
    const consignmentFeePct = getInputValue('custom-consignment');

    const materialCost = material + packaging;
    const laborCost = laborTime * laborRate;
    
    const baseCost = materialCost + laborCost + fixedCosts;
    const failureBuffer = baseCost * (failPct / 100);
    const totalCost = baseCost + failureBuffer;
    
    const profit = totalCost * (markup / 100);
    const targetPayout = totalCost + profit;

    const consignmentMultiplier = consignmentFeePct >= 100 ? 0.001 : 1 - (consignmentFeePct / 100);
    const rrp = targetPayout / consignmentMultiplier;
    const consignmentAmount = rrp * (consignmentFeePct / 100);
    const payout = rrp - consignmentAmount;
    const netProfit = payout - totalCost;
    
    const wholesale = rrp * 0.50;
    const wholesaleProfit = wholesale - totalCost;

    return {
      totalCost,
      rrp,
      profit: netProfit,
      consignmentAmount,
      consignmentFeePct,
      payout,
      wholesale,
      wholesaleProfit,
      breakdown: [
        { name: 'Materials & Pkg', value: materialCost + (materialCost * failPct / 100), color: '#fdba74' },
        { name: 'Labor', value: laborCost + (laborCost * failPct / 100), color: '#fb923c' },
        { name: 'Overhead', value: fixedCosts + (fixedCosts * failPct / 100), color: '#f472b6' },
        { name: 'Consignment', value: consignmentAmount, color: '#f59e0b' },
        { name: 'Profit Margin', value: netProfit, color: '#10b981' }
      ]
    };
  };

  // --- SVG Chart Render ---
  const renderDonutChart = (breakdown, total) => {
    costChart.innerHTML = '';
    
    if (total <= 0) {
      centerRatio.textContent = '0%';
      chartLegend.innerHTML = '<div class="empty-state">No cost data</div>';
      return;
    }

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;
    let legendHtml = '';

    breakdown.forEach((segment) => {
      const percentage = (segment.value / total) * 100;
      if (percentage <= 0) return;

      const strokeLength = (percentage / 100) * circumference;
      const strokeOffset = circumference - ((accumulatedPercent / 100) * circumference);

      // Create SVG circle segment
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', radius.toString());
      circle.setAttribute('stroke', segment.color);
      circle.setAttribute('stroke-dasharray', `${strokeLength} ${circumference}`);
      circle.setAttribute('stroke-dashoffset', strokeOffset.toString());
      
      // Accessibility title
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${segment.name}: ${percentage.toFixed(1)}%`;
      circle.appendChild(title);

      costChart.appendChild(circle);
      accumulatedPercent += percentage;

      // Populate Legend
      legendHtml += `
        <div class="legend-item">
          <div class="legend-info">
            <span class="legend-color" style="background-color: ${segment.color}"></span>
            <span class="legend-name">${segment.name}</span>
          </div>
          <span class="legend-val">${formatCurrency(segment.value)} (${percentage.toFixed(0)}%)</span>
        </div>
      `;
    });

    chartLegend.innerHTML = legendHtml;

    // Calculate markup/margin ratio to display in center
    const profitSegment = breakdown.find(s => s.name === 'Profit Margin');
    const marginPct = profitSegment ? (profitSegment.value / total) * 100 : 0;
    centerRatio.textContent = `${marginPct.toFixed(0)}%`;
  };

  // --- Master Calculator Router ---
  const calculate = () => {
    let result = null;
    let markupValue = 0;

    if (activeTab === '3dprint') {
      result = calculate3DPrint();
      markupValue = getInputValue('print-markup');
    } else if (activeTab === 'sticker') {
      result = calculateSticker();
      markupValue = getInputValue('sticker-markup');
    } else {
      result = calculateCustom();
      markupValue = getInputValue('custom-markup');
    }

    if (!result) return;

    // Update Dashboard UI
    rrpValue.textContent = formatCurrency(result.rrp);
    rrpMarkupText.textContent = `Based on ${markupValue}% Markup`;
    
    costValue.textContent = formatCurrency(result.totalCost);
    
    consignmentValue.textContent = formatCurrency(result.consignmentAmount);
    consignmentRateText.textContent = `${result.consignmentFeePct}% Consignment Fee`;
    
    payoutValue.textContent = formatCurrency(result.payout);
    const payoutRatio = result.rrp > 0 ? (result.payout / result.rrp) * 100 : 0;
    payoutSubtext.textContent = `${payoutRatio.toFixed(0)}% of Retail Price`;
    
    profitValue.textContent = formatCurrency(result.profit);
    const marginPercent = result.rrp > 0 ? (result.profit / result.rrp) * 100 : 0;
    profitMarginPct.textContent = `${marginPercent.toFixed(0)}% Profit Margin`;
    
    wholesaleValue.textContent = formatCurrency(result.wholesale);
    wholesaleProfit.textContent = `Wholesale Profit: ${formatCurrency(result.wholesaleProfit)}`;

    // Render Breakdown Chart (Fits all slices to RRP)
    renderDonutChart(result.breakdown, result.rrp);

    return result;
  };

  // --- Library and Storage Operations ---
  const getProductInputs = (type) => {
    const inputs = {};
    const form = document.getElementById(`form-${type}`);
    const inputElements = form.querySelectorAll('input');
    inputElements.forEach(el => {
      inputs[el.id] = el.value;
    });
    return inputs;
  };

  const loadProductInputs = (product) => {
    const inputs = product.inputs;
    for (const id in inputs) {
      setInputValue(id, inputs[id]);
    }
  };

  const renderLibraryList = (searchFilter = '') => {
    libraryList.innerHTML = '';
    const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchFilter.toLowerCase())
    );

    if (filteredProducts.length === 0) {
      libraryList.innerHTML = `
        <div class="empty-state">
          <p>${searchFilter ? 'No matches found.' : 'No saved products yet.'}</p>
        </div>
      `;
      savedCount.textContent = '0';
      return;
    }

    savedCount.textContent = products.length.toString();

    filteredProducts.forEach(product => {
      const card = document.createElement('div');
      card.className = `saved-card ${editingProductId === product.id ? 'active' : ''}`;
      card.dataset.id = product.id;
      
      const themeType = themeDetails[product.type] || { color: '#ccc', name: 'Custom' };

      card.innerHTML = `
        <div class="saved-info">
          <span class="saved-name">${escapeHtml(product.name)}</span>
          <div class="saved-meta">
            <span class="type-pill type-${product.type}">${themeType.name}</span>
            <span>${new Date(product.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="saved-price">${formatCurrency(product.rrp)}</span>
          <button class="delete-saved-btn" aria-label="Delete saved product" data-id="${product.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      `;

      // Handle card select
      card.addEventListener('click', (e) => {
        // Prevent activation if clicked delete button
        if (e.target.closest('.delete-saved-btn')) return;
        loadProduct(product.id);
      });

      // Handle card delete
      card.querySelector('.delete-saved-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteProduct(product.id);
      });

      libraryList.appendChild(card);
    });
  };

  const saveProduct = () => {
    const name = productNameInput.value.trim();
    if (!name) {
      showToast('Please enter a product name before saving.');
      productNameInput.focus();
      return;
    }

    const currentResults = calculate();
    const inputs = getProductInputs(activeTab);

    if (!currentUser) {
      showToast('Please sign in to save products.');
      return;
    }

    if (editingProductId) {
      // Edit mode
      db.collection('users').doc(currentUser.uid).collection('products').doc(editingProductId).update({
        name,
        inputs,
        rrp: currentResults.rrp,
        updatedAt: new Date().toISOString()
      }).then(() => {
        showToast(`Updated "${name}" in library.`);
      });
    } else {
      // New save
      const newProduct = {
        name,
        type: activeTab,
        inputs,
        rrp: currentResults.rrp,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.collection('users').doc(currentUser.uid).collection('products').add(newProduct).then(docRef => {
        editingProductId = docRef.id;
        showToast(`Saved "${name}" to library.`);
      });
    }
  };

  const loadProduct = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    productNameInput.value = product.name;
    
    // Switch to appropriate product tab
    switchTab(product.type);
    
    // Load and recalculate
    loadProductInputs(product);
    calculate();
    renderLibraryList();
    showToast(`Loaded "${product.name}" settings.`);
  };

  const deleteProduct = (id) => {
    const product = products.find(p => p.id === id);
    const name = product ? product.name : 'Product';
    
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      db.collection('users').doc(currentUser.uid).collection('products').doc(id).delete().then(() => {
        if (editingProductId === id) {
          editingProductId = null;
          productNameInput.value = '';
          btnReset.click();
        }
        showToast(`Deleted "${name}" from library.`);
      });
    }
  };

  // --- UI Tab Management ---
  const switchTab = (tabId) => {
    activeTab = tabId;
    
    // Manage tab styles
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Manage active form visibility
    calcForms.forEach(form => {
      if (form.id === `form-${tabId}`) {
        form.classList.add('active-form');
      } else {
        form.classList.remove('active-form');
      }
    });

    // Update body theme class
    body.className = `theme-${tabId}`;

    // Recalculate values
    calculate();
  };

  // --- Utility Escaper ---
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  // --- Event Listeners ---
  
  // Real-time calculation triggers
  calcForms.forEach(form => {
    form.addEventListener('input', calculate);
    form.addEventListener('change', calculate);
  });

  // Tab switching click handlers
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Only switch if not clicking the already active tab
      if (btn.dataset.tab !== activeTab) {
        // Reset editing state when switching tabs manually unless loading a product
        editingProductId = null;
        productNameInput.value = '';
        switchTab(btn.dataset.tab);
        renderLibraryList();
      }
    });
  });

  // Library actions
  btnSave.addEventListener('click', saveProduct);
  
  librarySearch.addEventListener('input', (e) => {
    renderLibraryList(e.target.value);
  });

  // Reset form inputs to default values
  btnReset.addEventListener('click', () => {
    const form = document.getElementById(`form-${activeTab}`);
    form.reset();
    editingProductId = null;
    productNameInput.value = '';
    calculate();
    renderLibraryList();
    showToast('Form inputs reset to defaults.');
  });

  // Export summary as a beautiful print window
  btnExport.addEventListener('click', () => {
    const name = productNameInput.value.trim() || `${themeDetails[activeTab].name} Pricing Analysis`;
    const results = calculate();

    // Try to open a beautiful printable summary page
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocked! Please allow popups to export the summary sheet.');
      return;
    }

    let itemsHtml = '';
    results.breakdown.forEach(s => {
      const pct = results.rrp > 0 ? ((s.value / results.rrp) * 100).toFixed(0) : 0;
      itemsHtml += `
        <tr>
          <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${s.color};margin-right:8px;vertical-align:middle;"></span>${s.name}</td>
          <td style="text-align:right;font-weight:600;">${formatCurrency(s.value)}</td>
          <td style="text-align:right;color:#666;">${pct}%</td>
        </tr>
      `;
    });

    const is3dPrint = activeTab === '3dprint';
    const isSticker = activeTab === 'sticker';
    
    // Render specific parameters block
    let specParams = '';
    if (is3dPrint) {
      specParams = `
        <div class="meta-section">
          <h3>3D Print Details</h3>
          <div class="meta-grid">
            <div><strong>Model Weight:</strong> ${getInputValue('print-weight')}g</div>
            <div><strong>Print Time:</strong> ${getInputValue('print-time')} hrs</div>
            <div><strong>Printer Power:</strong> ${getInputValue('print-power')}W</div>
            <div><strong>Failure Buffer:</strong> ${getInputValue('print-failure-rate')}%</div>
          </div>
        </div>
      `;
    } else if (isSticker) {
      specParams = `
        <div class="meta-section">
          <h3>Sticker Sheet Details</h3>
          <div class="meta-grid">
            <div><strong>Yield per Sheet:</strong> ${getInputValue('sticker-yield')} stickers</div>
            <div><strong>Materials per Sheet:</strong> ${formatCurrency(getInputValue('sticker-sheet-cost'))}</div>
            <div><strong>Waste Factor:</strong> ${getInputValue('sticker-fail-pct')}%</div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${name} - Creator Pricing Lab Export</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; padding: 2rem; margin: 0; line-height: 1.5; }
          .container { max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .header h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; color: #111827; }
          .header p { margin: 0; color: #6b7280; font-size: 0.875rem; }
          .price-block { background: #f9fafb; border-radius: 6px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; border-left: 4px solid ${themeDetails[activeTab].color}; }
          .price-item { display: flex; flex-direction: column; }
          .price-label { font-size: 0.75rem; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
          .price-value { font-size: 1.75rem; font-weight: 700; color: #111827; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
          .table th { border-bottom: 1px solid #e5e7eb; text-align: left; padding: 0.5rem 0; color: #374151; font-size: 0.875rem; }
          .table td { padding: 0.75rem 0; border-bottom: 1px dashed #f3f4f6; font-size: 0.95rem; }
          .meta-section { background: #fdfdfd; border: 1px solid #f0f0f0; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; }
          .meta-section h3 { margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f0f0f0; padding-bottom: 0.25rem; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.875rem; color: #4b5563; }
          .footer { text-align: center; color: #9ca3af; font-size: 0.75rem; margin-top: 2rem; border-top: 1px solid #e5e7eb; padding-top: 1rem; }
          @media print {
            body { padding: 0; }
            .container { border: none; box-shadow: none; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${name}</h1>
            <p>Generated by Creator Pricing Lab on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="price-block">
            <div class="price-item">
              <span class="price-label">Recommended Retail</span>
              <span class="price-value" style="color: #10b981;">${formatCurrency(results.rrp)}</span>
            </div>
            <div class="price-item" style="text-align: center;">
              <span class="price-label">Creator Payout</span>
              <span class="price-value" style="color: ${themeDetails[activeTab].color};">${formatCurrency(results.payout)}</span>
            </div>
            <div class="price-item" style="text-align: right;">
              <span class="price-label">Production Cost</span>
              <span class="price-value" style="color: #4b5563;">${formatCurrency(results.totalCost)}</span>
            </div>
          </div>

          ${specParams}

          <table class="table">
            <thead>
              <tr>
                <th>Cost/Revenue Item</th>
                <th style="text-align:right;">Amount</th>
                <th style="text-align:right;">Share</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="display:flex; justify-content:space-between; font-size: 0.875rem; background:#f3f4f6; padding:0.75rem; border-radius:4px;">
            <div><strong>Wholesale Price (50%):</strong> ${formatCurrency(results.wholesale)}</div>
            <div><strong>Wholesale Profit:</strong> ${formatCurrency(results.wholesaleProfit)}</div>
          </div>

          <div class="no-print" style="margin-top: 2rem; display: flex; justify-content: center; gap: 1rem;">
            <button onclick="window.print()" style="padding: 0.5rem 1rem; background: ${themeDetails[activeTab].color}; color: #fff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Print Summary</button>
            <button onclick="window.close()" style="padding: 0.5rem 1rem; background: #e5e7eb; color: #374151; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Close Window</button>
          </div>

          <div class="footer">
            Generated with Antigravity Creator Pricing Suite.
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  });

  // Mobile drawer panel toggle
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  const sidebarLibrary = document.getElementById('sidebar-library');
  
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebarLibrary.classList.toggle('open');
    });
  }

  // --- Initial Launch Setup ---
  switchTab('3dprint');
  renderLibraryList();
  // ==========================================================================
  // Quotes and Settings Logic
  // ==========================================================================

  // Elements
  const modalSettings = document.getElementById('modal-settings');
  const modalQuote = document.getElementById('modal-quote');
  const btnSettings = document.getElementById('btn-settings');
  const btnQuote = document.getElementById('btn-quote');
  const closeModals = document.querySelectorAll('.close-modal');

  const inputBizName = document.getElementById('settings-biz-name');
  const inputBizEmail = document.getElementById('settings-biz-email');
  const inputBizLogo = document.getElementById('settings-biz-logo');
  const btnSaveSettings = document.getElementById('btn-save-settings');

  const quoteClientName = document.getElementById('quote-client-name');
  const quoteQuantity = document.getElementById('quote-quantity');
  const discountRadios = document.getElementsByName('discount-mode');
  const discountPercentBox = document.getElementById('discount-percent-box');
  const discountTieredBox = document.getElementById('discount-tiered-box');
  const quoteDiscountPct = document.getElementById('quote-discount-pct');
  const btnAddTier = document.getElementById('btn-add-tier');
  const tierList = document.getElementById('tier-list');
  const btnGeneratePdf = document.getElementById('btn-generate-pdf');

  const previewUnitPrice = document.getElementById('preview-unit-price');
  const previewQty = document.getElementById('preview-qty');
  const previewSubtotal = document.getElementById('preview-subtotal');
  const previewDiscount = document.getElementById('preview-discount');
  const previewTotal = document.getElementById('preview-total');
  const previewEffectiveUnit = document.getElementById('preview-effective-unit');

  let currentSettings = {
    bizName: '',
    bizEmail: '',
    bizLogo: ''
  };


  // State
  let quoteTiers = [{ qty: 50, pct: 10 }];

  // Render Tiers
  const renderTiers = () => {
    tierList.innerHTML = '';
    quoteTiers.forEach((tier, index) => {
      const row = document.createElement('div');
      row.className = 'tier-row';
      row.innerHTML = `
        <span>Qty >= </span>
        <input type="number" style="width: 80px;" value="${tier.qty}" onchange="updateTier(${index}, 'qty', this.value)">
        <span> gets </span>
        <input type="number" style="width: 80px;" value="${tier.pct}" onchange="updateTier(${index}, 'pct', this.value)">
        <span>% off</span>
        <button class="icon-btn" onclick="removeTier(${index})" style="color: var(--danger); padding: 0.25rem;">
          &times;
        </button>
      `;
      tierList.appendChild(row);
    });
    updateQuotePreview();
  };

  window.updateTier = (idx, field, val) => {
    quoteTiers[idx][field] = parseFloat(val) || 0;
    updateQuotePreview();
  };

  window.removeTier = (idx) => {
    quoteTiers.splice(idx, 1);
    renderTiers();
  };

  btnAddTier.addEventListener('click', () => {
    const lastQty = quoteTiers.length > 0 ? quoteTiers[quoteTiers.length - 1].qty : 0;
    quoteTiers.push({ qty: lastQty + 50, pct: 15 });
    renderTiers();
  });

  // Calculate Quote Preview
  const updateQuotePreview = () => {
    const qty = parseFloat(quoteQuantity.value) || 1;
    const baseResults = calculate(); // Get current RRP from the main app logic
    const unitPrice = baseResults ? baseResults.rrp : 0;
    const subtotal = unitPrice * qty;

    let discountMode = 'none';
    discountRadios.forEach(r => { if (r.checked) discountMode = r.value; });

    let discountAmt = 0;
    
    if (discountMode === 'percent') {
      const pct = parseFloat(quoteDiscountPct.value) || 0;
      discountAmt = subtotal * (pct / 100);
    } else if (discountMode === 'tiered') {
      // Find the highest tier met
      let appliedPct = 0;
      const sortedTiers = [...quoteTiers].sort((a, b) => b.qty - a.qty);
      for (const tier of sortedTiers) {
        if (qty >= tier.qty) {
          appliedPct = tier.pct;
          break;
        }
      }
      discountAmt = subtotal * (appliedPct / 100);
    }

    const total = subtotal - discountAmt;
    const effectiveUnit = qty > 0 ? total / qty : 0;

    previewUnitPrice.textContent = formatCurrency(unitPrice);
    previewQty.textContent = qty;
    previewSubtotal.textContent = formatCurrency(subtotal);
    previewDiscount.textContent = `-${formatCurrency(discountAmt)}`;
    previewTotal.textContent = formatCurrency(total);
    previewEffectiveUnit.textContent = `${formatCurrency(effectiveUnit)} / unit`;
  };

  // Listeners for Quote updates
  quoteQuantity.addEventListener('input', updateQuotePreview);
  quoteDiscountPct.addEventListener('input', updateQuotePreview);
  discountRadios.forEach(r => {
    r.addEventListener('change', (e) => {
      discountPercentBox.style.display = e.target.value === 'percent' ? 'flex' : 'none';
      discountTieredBox.style.display = e.target.value === 'tiered' ? 'block' : 'none';
      updateQuotePreview();
    });
  });

  // Modals Open/Close
  btnSettings.addEventListener('click', () => {
    inputBizName.value = currentSettings.bizName || '';
    inputBizEmail.value = currentSettings.bizEmail || '';
    inputBizLogo.value = currentSettings.bizLogo || '';
    modalSettings.classList.add('open');
  });

  btnSaveSettings.addEventListener('click', () => {
    currentSettings = {
      bizName: inputBizName.value.trim(),
      bizEmail: inputBizEmail.value.trim(),
      bizLogo: inputBizLogo.value.trim()
    };
    if (!currentUser) {
      showToast('Please sign in to save settings.');
      return;
    }
    db.collection('users').doc(currentUser.uid).collection('settings').doc('global').set(currentSettings).then(() => {
      modalSettings.classList.remove('open');
      showToast('Settings Saved!');
    });
  });

  if (btnQuote) {
    btnQuote.addEventListener('click', () => {
      renderTiers();
      updateQuotePreview();
      modalQuote.classList.add('open');
    });
  }

  closeModals.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('open');
    });
  });

  // PDF Generation
  btnGeneratePdf.addEventListener('click', () => {
    const qty = parseFloat(quoteQuantity.value) || 1;
    const clientName = quoteClientName.value.trim() || 'Valued Client';
    const prodName = productNameInput.value.trim() || `${themeDetails[activeTab].name} Custom Product`;
    
    // Recalculate everything
    updateQuotePreview();
    
    const unitPrice = previewUnitPrice.textContent;
    const subtotal = previewSubtotal.textContent;
    const discount = previewDiscount.textContent;
    const total = previewTotal.textContent;

    // Generate beautiful HTML for the PDF
    const quoteHtml = `
      <div style="font-family: 'Inter', sans-serif; color: #111827; padding: 40px; background: white; width: 100%; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
          <div>
            ${currentSettings.bizLogo ? `<img src="${currentSettings.bizLogo}" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
            <h1 style="margin: 0; font-size: 24px;">${escapeHtml(currentSettings.bizName || 'Creator Pricing Lab')}</h1>
            <p style="margin: 5px 0 0; color: #6b7280;">${escapeHtml(currentSettings.bizEmail || '')}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 28px; color: #374151; text-transform: uppercase;">Quote</h2>
            <p style="margin: 5px 0 0; color: #6b7280;">Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div style="margin-bottom: 40px;">
          <h3 style="margin: 0 0 10px; font-size: 16px; color: #6b7280; text-transform: uppercase;">Prepared For:</h3>
          <p style="margin: 0; font-size: 18px; font-weight: 600;">${escapeHtml(clientName)}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="text-align: left; padding: 12px; border-bottom: 2px solid #d1d5db;">Description</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #d1d5db;">Quantity</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #d1d5db;">Unit Price</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #d1d5db;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${escapeHtml(prodName)}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">${qty}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">${unitPrice}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">${subtotal}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Subtotal</span>
              <span>${subtotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #10b981;">
              <span>Discount</span>
              <span>${discount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #e5e7eb; font-size: 20px; font-weight: 700;">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
          Thank you for your business! This quote is valid for 30 days.
        </div>
      </div>
    `;

    const opt = {
      margin:       0,
      filename:     `Quote_${clientName.replace(/\s+/g, '_')}_${prodName.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(quoteHtml).save().then(() => {
      showToast('PDF Quote Downloaded!');
      modalQuote.classList.remove('open');
    });
  });

  // Re-trigger preview when recalculating from the main logic
  const originalCalculate = calculate;
  calculate = () => {
    const res = originalCalculate();
    if (modalQuote.classList.contains('open')) {
      updateQuotePreview();
    }
    return res;
  };

});
