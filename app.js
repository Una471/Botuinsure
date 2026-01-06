// app.js - COMPLETE VERSION - NO API, NO BACKEND NEEDED
let selectedProducts = new Set();

// Load all products on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAllProducts();
    document.getElementById('leadForm').addEventListener('submit', submitLead);
    updateSelectedCount();
});

function loadAllProducts() {
    if (!window.allProducts || window.allProducts.length === 0) {
        console.error('No products loaded');
        document.getElementById('medicalPlans').innerHTML = '<div class="col-12 text-center"><p>No products found</p></div>';
        return;
    }
    
    console.log(`Displaying ${window.allProducts.length} products`);
    
    displayMedicalPlans(window.allProducts.filter(p => p.category === "medical"));
    displayProducts(window.allProducts.filter(p => p.category === "life"), 'lifePlans');
    displayProducts(window.allProducts.filter(p => p.category === "funeral"), 'funeralPlans');
    displayProducts(window.allProducts.filter(p => p.category === "hospital_cash"), 'hospitalCashPlans');
}

function displayMedicalPlans(products) {
    const container = document.getElementById('medicalPlans');
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'col-md-4 mb-4';
    
    const productImage = getProductImage(product.name, product.company.name);
    const logoData = getCompanyLogo(product.company.name);
    
    // Price display
    let priceHtml = '';
    if (product.premiums && product.premiums.length > 0) {
        const minPremium = getMinPremium(product.premiums);
        if (minPremium !== 'N/A') {
            priceHtml = `<div class="price-badge">From P${minPremium}/month</div>`;
        } else {
            priceHtml = `<div class="price-badge text-muted">Premium on request</div>`;
        }
    } else {
        priceHtml = `<div class="price-badge text-muted">Premium varies</div>`;
    }
    
    // Logo HTML
    let logoHtml = '';
    if (logoData.image) {
        logoHtml = `
            <div class="company-logo-container">
                <img src="${logoData.image}" alt="${logoData.name}" class="company-logo">
            </div>
        `;
    } else {
        logoHtml = `
            <div class="company-logo-container">
                <div class="company-logo-placeholder" style="background: ${logoData.bgColor};">
                    ${logoData.text}
                </div>
            </div>
        `;
    }
    
    div.innerHTML = `
        <div class="card product-card h-100">
            <!-- Product Image -->
            <div class="product-image" style="background-image: url('${productImage}')">
                <div class="product-overlay"></div>
                ${logoHtml}
            </div>
            
            <!-- Product Details -->
            <div class="card-body">
                <h5 class="card-title product-title">${product.name}</h5>
                <h6 class="card-subtitle mb-2 product-company">${product.company.name}</h6>
                
                ${priceHtml}
                
                <div class="product-features">
                    ${product.annual_limit ? `<p><strong>Annual Limit:</strong> P${formatNumber(product.annual_limit)}</p>` : ''}
                    ${product.sum_assured ? `<p><strong>Cover:</strong> ${product.sum_assured}</p>` : ''}
                    ${product.waiting_period_natural ? `<p><strong>Waiting Period:</strong> ${product.waiting_period_natural}</p>` : ''}
                    ${product.co_payment ? `<p><strong>Co-payment:</strong> ${product.co_payment}</p>` : ''}
                </div>
                
                <div class="mt-auto">
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <button class="btn btn-get-quote" onclick="showLeadForm(${product.id})">
                            <i class="fas fa-quote-right me-1"></i> Get Quote
                        </button>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input compare-checkbox" 
                                   type="checkbox" 
                                   onclick="toggleCompare(${product.id})" 
                                   id="compare${product.id}">
                            <label class="form-check-label compare-label" for="compare${product.id}">
                                <i class="fas fa-balance-scale me-1"></i> Compare
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

function getCompanyLogo(companyName) {
    const logos = {
        'Pula Medical Aid Fund (Pulamed)': {
            image: 'images/logos/pulamed.png',
            bgColor: '#4CAF50',
            text: 'PM',
            name: 'PulaMed'
        },
        'Botswana Public Officers Medical Aid Scheme (BPOMAS)': {
            image: 'images/logos/bpomas.png',
            bgColor: '#2196F3',
            text: 'BP',
            name: 'BPOMAS'
        },
        'Botsogo Health Plan': {
            image: 'images/logos/botsogo.png',
            bgColor: '#FF9800',
            text: 'BH',
            name: 'Botsogo'
        },
        'Liberty Life Botswana (Pty) Limited': {
            image: 'images/logos/liberty.png',
            bgColor: '#9C27B0',
            text: 'LL',
            name: 'Liberty'
        },
        'Metropolitan Life Botswana': {
            image: 'images/logos/metropolitan.png',
            bgColor: '#F44336',
            text: 'ML',
            name: 'Metro'
        }
    };
    
    for (const [key, value] of Object.entries(logos)) {
        if (companyName.includes(key.split(' ')[0])) {
            return value;
        }
    }
    
    return {
        image: null,
        bgColor: '#6c757d',
        text: 'INS',
        name: 'Insurance'
    };
}

function getProductImage(productName, companyName) {
    const imageMap = {
        'Executive': 'images/products/pulamed/executive.jpg',
        'Deluxe': 'images/products/pulamed/deluxe.jpg',
        'Galaxy': 'images/products/pulamed/galaxy.jpg',
        'Flexi': 'images/products/pulamed/flexi.jpg',
        'Standard Benefit Option': 'images/products/bpomas/standard.jpg',
        'High Benefit Option': 'images/products/bpomas/high.jpg',
        'Premium Benefit Option': 'images/products/bpomas/premium.jpg',
        'Diamond': 'images/products/botsogo/diamond.jpg',
        'Platinum': 'images/products/botsogo/platinum.jpg',
        'Ruby': 'images/products/botsogo/ruby.jpg',
        'Bronze': 'images/products/botsogo/bronze.jpg',
        'Mothusi Life Cover - Lifeline': 'images/products/metropolitan/lifeline.jpg',
        'Mothusi Life Cover - Term Shield': 'images/products/metropolitan/termshield.jpg',
        'Mothusi Life Cover - Home Secure': 'images/products/metropolitan/homesecure.jpg',
        'Boago Funeral Plan': 'images/products/liberty/boago.jpg',
        'Hospital Cash Back Benefit': 'images/products/liberty/hospitalcash.jpg'
    };
    
    for (const [key, value] of Object.entries(imageMap)) {
        if (productName.includes(key)) {
            return value;
        }
    }
    
    if (companyName.includes('Pula') || companyName.includes('Pulamed')) {
        return 'images/products/pulamed/executive.jpg';
    } else if (companyName.includes('BPOMAS')) {
        return 'images/products/bpomas/standard.jpg';
    } else if (companyName.includes('Botsogo')) {
        return 'images/products/botsogo/diamond.jpg';
    } else if (companyName.includes('Metropolitan')) {
        return 'images/products/metropolitan/lifeline.jpg';
    } else if (companyName.includes('Liberty')) {
        return 'images/products/liberty/boago.jpg';
    }
    
    return 'images/products/default.jpg';
}

function getMinPremium(premiums) {
    if (!premiums || premiums.length === 0) return 'N/A';
    
    let min = Infinity;
    premiums.forEach(p => {
        if (p.monthly_premium && p.monthly_premium < min) {
            min = p.monthly_premium;
        }
    });
    
    return min === Infinity ? 'N/A' : min;
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toggleCompare(productId) {
    const checkbox = document.getElementById(`compare${productId}`);
    
    if (checkbox.checked) {
        selectedProducts.add(productId);
    } else {
        selectedProducts.delete(productId);
    }
    
    updateSelectedCount();
}

function updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        countElement.textContent = selectedProducts.size;
        countElement.className = selectedProducts.size >= 2 ? 'text-success fw-bold' : '';
    }
}

function showComparison() {
    if (selectedProducts.size < 2) {
        alert('Please select at least 2 plans to compare by checking their "Compare" boxes.');
        return;
    }
    
    const products = window.allProducts.filter(p => selectedProducts.has(p.id));
    const comparisonHtml = generateComparisonTable(products);
    document.getElementById('comparisonTable').innerHTML = comparisonHtml;
    
    const modal = new bootstrap.Modal(document.getElementById('compareModal'));
    modal.show();
}

function generateComparisonTable(products) {
    if (products.length === 0) {
        return '<div class="alert alert-warning">No products selected.</div>';
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-bordered table-hover comparison-table">
                <thead class="table-primary">
                    <tr>
                        <th class="align-middle" style="width: 20%">Feature</th>
    `;
    
    products.forEach(p => {
        const logoData = getCompanyLogo(p.company.name);
        html += `<th class="text-center" style="width: 40%">
            <strong>${p.name}</strong><br>
            <small class="text-muted">${p.company.name}</small>
        </th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    // Price Row
    html += '<tr><td class="fw-bold">Monthly Premium</td>';
    products.forEach(p => {
        const minPremium = getMinPremium(p.premiums);
        html += `<td class="fw-bold text-success">P${minPremium}/month</td>`;
    });
    html += '</tr>';
    
    // Category-specific fields
    if (products[0].category === 'medical') {
        html += '<tr><td class="fw-bold">Annual Limit</td>';
        products.forEach(p => {
            const limit = p.annual_limit ? `P${formatNumber(p.annual_limit)}` : 'N/A';
            html += `<td>${limit}</td>`;
        });
        html += '</tr>';
        
        html += '<tr><td class="fw-bold">Co-payment</td>';
        products.forEach(p => {
            html += `<td>${p.co_payment || 'N/A'}</td>`;
        });
        html += '</tr>';
        
        html += '<tr><td class="fw-bold">Hospital Network</td>';
        products.forEach(p => {
            const network = p.hospital_network || 'N/A';
            html += `<td class="text-start small">${network.substring(0, 50)}${network.length > 50 ? '...' : ''}</td>`;
        });
        html += '</tr>';
    } else {
        html += '<tr><td class="fw-bold">Cover Amount</td>';
        products.forEach(p => {
            html += `<td>${p.sum_assured || 'N/A'}</td>`;
        });
        html += '</tr>';
    }
    
    // Waiting Period
    html += '<tr><td class="fw-bold">Waiting Period</td>';
    products.forEach(p => {
        html += `<td>${p.waiting_period_natural || 'N/A'}</td>`;
    });
    html += '</tr>';
    
    // Key Features
    html += '<tr><td class="fw-bold">Key Features</td>';
    products.forEach(p => {
        const features = p.key_features || [];
        const featureList = features.slice(0, 2).map(f => `• ${f}`).join('<br>');
        html += `<td class="text-start small">${featureList || 'N/A'}</td>`;
    });
    html += '</tr>';
    
    // Action buttons
    html += '<tr><td class="fw-bold">Get Quote</td>';
    products.forEach(p => {
        html += `
            <td>
                <button class="btn btn-sm btn-outline-primary w-100" onclick="showLeadForm(${p.id})">
                    Request Quote
                </button>
            </td>
        `;
    });
    html += '</tr>';
    
    html += '</tbody></table></div>';
    return html;
}

function showLeadForm(productId) {
    document.getElementById('selectedProductId').value = productId;
    const modal = new bootstrap.Modal(document.getElementById('leadModal'));
    modal.show();
}

function submitLead(event) {
    event.preventDefault();
    
    const leadData = {
        product_id: parseInt(document.getElementById('selectedProductId').value),
        name: document.getElementById('leadName').value,
        phone: document.getElementById('leadPhone').value,
        email: document.getElementById('leadEmail').value
    };
    
    alert('Thank you! The insurer will contact you shortly.');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('leadModal'));
    modal.hide();
    document.getElementById('leadForm').reset();
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}