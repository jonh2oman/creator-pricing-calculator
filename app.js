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
  let products = JSON.parse(localStorage.getItem('pricing_lab_products')) || [];
  let editingProductId = null;

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

    if (editingProductId) {
      // Edit mode
      const idx = products.findIndex(p => p.id === editingProductId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          name,
          inputs,
          rrp: currentResults.rrp,
          updatedAt: new Date().toISOString()
        };
        showToast(`Updated "${name}" in library.`);
      }
    } else {
      // New save
      const newProduct = {
        id: 'prod_' + Date.now(),
        name,
        type: activeTab,
        inputs,
        rrp: currentResults.rrp,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      products.unshift(newProduct);
      editingProductId = newProduct.id;
      showToast(`Saved "${name}" to library.`);
    }

    localStorage.setItem('pricing_lab_products', JSON.stringify(products));
    renderLibraryList();
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
      products = products.filter(p => p.id !== id);
      localStorage.setItem('pricing_lab_products', JSON.stringify(products));
      
      if (editingProductId === id) {
        editingProductId = null;
        productNameInput.value = '';
        btnReset.click();
      }
      
      renderLibraryList();
      showToast(`Deleted "${name}" from library.`);
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
});
