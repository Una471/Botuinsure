// app-airtable.js - SIMPLE WORKING VERSION
const AIRTABLE_TOKEN = 'pat3O0ibg4EKppGFd.404fe41eea77ee6e66e2d8e72179250447c20021f4aed351a51134c04d6a4cdb';
const AIRTABLE_BASE_ID = 'appyCd1RKcaY8q1We';
const AIRTABLE_TABLE = 'Products';

let selectedProducts = new Set();

// Load everything when page loads
document.addEventListener('DOMContentLoaded', async function() {
    await loadProducts();
    setupEventListeners();
    addRefreshButton();
});

async function loadProducts() {
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?sort%5B0%5D%5Bfield%5D=ID`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) throw new Error('Airtable error');
        
        const data = await response.json();
        
        // Simple transformation
        window.allProducts = data.records.map(record => {
            const fields = record.fields;
            
            let premiums = [];
            if (fields['Premiums JSON']) {
                try {
                    premiums = JSON.parse(fields['Premiums JSON'].replace(/(\w+):/g, '"$1":'));
                } catch(e) {}
            }
            
            return {
                id: fields.ID || 0,
                name: fields.Name || '',
                category: fields.Category || '',
                company: { 
                    name: fields['Company Name'] || '',
                    logoUrl: fields['Company Logo URL'] || '',
                    logoColor: fields['Logo Color'] || '#6c757d',
                    logoText: fields['Logo Text'] || 'INS'
                },
                sum_assured: fields['Sum Assured'] || null,
                annual_limit: fields['Annual Limit'] || null,
                premiums: premiums,
                waiting_period_natural: fields['Waiting Period Natural'] || '',
                co_payment: fields['Co Payment'] || null,
                hospital_network: fields['Hospital Network'] || '',
                key_features: fields['Key Features'] ? fields['Key Features'].split('\n').filter(f => f.trim()) : [],
                product_image: fields['Product Image URL'] || ''
            };
        });
        
        console.log(`Loaded ${window.allProducts.length} products`);
        displayAllProducts();
        
    } catch (error) {
        console.error('Failed to load:', error);
        // Fallback to data.js
        loadFallbackData();
    }
}

function loadFallbackData() {
    const script = document.createElement('script');
    script.src = 'data.js';
    script.onload = function() {
        console.log('Using fallback data.js');
        displayAllProducts();
    };
    document.head.appendChild(script);
}

function displayAllProducts() {
    if (!window.allProducts || window.allProducts.length === 0) {
        console.log('No products to display');
        return;
    }
    
    displayCategory('medical', 'medicalPlans');
    displayCategory('life', 'lifePlans');
    displayCategory('funeral', 'funeralPlans');
    displayCategory('hospital_cash', 'hospitalCashPlans');
}

function displayCategory(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const products = window.allProducts.filter(p => p.category === category);
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>No products in this category</p></div>';
        return;
    }
    
    products.forEach(product => {
        container.appendChild(createCard(product));
    });
}

function createCard(product) {
    const div = document.createElement('div');
    div.className = 'col-md-4 mb-4';
    
    // Get images
    const productImage = getProductImage(product);
    const logoData = getLogoData(product);
    
    // Price
    let priceHtml = '';
    if (product.premiums && product.premiums.length > 0) {
        const min = Math.min(...product.premiums.map(p => p.monthly_premium).filter(p => p));
        priceHtml = `<div class="price-badge">From P${min}/month</div>`;
    } else {
        priceHtml = '<div class="price-badge text-muted">Premium varies</div>';
    }
    
    // Logo - SIMPLE: Only show one
    let logoHtml = '';
    if (logoData.image) {
        logoHtml = `<div class="company-logo-container"><img src="${logoData.image}" class="company-logo"></div>`;
    } else {
        logoHtml = `<div class="company-logo-container"><div class="company-logo-placeholder" style="background:${logoData.bgColor}">${logoData.text}</div></div>`;
    }
    
    // Features - SIMPLE
    let featuresHtml = '';
    if (product.annual_limit) {
        featuresHtml += `<p><strong>Annual Limit:</strong> P${product.annual_limit.toLocaleString()}</p>`;
    }
    if (product.sum_assured) {
        featuresHtml += `<p><strong>Cover:</strong> ${product.sum_assured}</p>`;
    }
    if (product.waiting_period_natural) {
        featuresHtml += `<p><strong>Waiting Period:</strong> ${product.waiting_period_natural}</p>`;
    }
    if (product.co_payment) {
        featuresHtml += `<p><strong>Co-payment:</strong> ${product.co_payment}</p>`;
    }
    
    div.innerHTML = `
        <div class="card product-card h-100">
            <div class="product-image" style="background-image:url('${productImage}')">
                <div class="product-overlay"></div>
                ${logoHtml}
            </div>
            <div class="card-body">
                <h5 class="product-title">${product.name}</h5>
                <h6 class="product-company">${product.company.name}</h6>
                ${priceHtml}
                <div class="product-features">${featuresHtml}</div>
                <div class="mt-3 d-flex justify-content-between">
                    <button class="btn btn-get-quote" onclick="showLeadForm(${product.id})">
                        <i class="fas fa-quote-right"></i> Get Quote
                    </button>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="compare${product.id}" onclick="toggleCompare(${product.id})">
                        <label class="form-check-label" for="compare${product.id}">
                            <i class="fas fa-balance-scale"></i> Compare
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

function getLogoData(product) {
    // If Airtable has logo URL, use it
    if (product.company.logoUrl && product.company.logoUrl.trim()) {
        return {
            image: product.company.logoUrl,
            bgColor: product.company.logoColor,
            text: product.company.logoText
        };
    }
    
    // Fallback based on company
    const company = product.company.name;
    if (company.includes('Pula')) {
        return { image: 'images/logos/pulamed.png', bgColor: '#4CAF50', text: 'PM' };
    } else if (company.includes('BPOMAS')) {
        return { image: 'images/logos/bpomas.png', bgColor: '#2196F3', text: 'BP' };
    } else if (company.includes('Botsogo')) {
        return { image: 'images/logos/botsogo.png', bgColor: '#FF9800', text: 'BH' };
    } else if (company.includes('Liberty')) {
        return { image: 'images/logos/liberty.png', bgColor: '#9C27B0', text: 'LL' };
    } else if (company.includes('Metropolitan')) {
        return { image: 'images/logos/metropolitan.png', bgColor: '#F44336', text: 'ML' };
    }
    
    return { image: null, bgColor: '#6c757d', text: product.company.name.substring(0,2) };
}

function getProductImage(product) {
    // If Airtable has image, use it
    if (product.product_image && product.product_image.trim()) {
        return product.product_image;
    }
    
    // Fallback
    const name = product.name;
    if (name.includes('Executive')) return 'images/products/pulamed/executive.jpg';
    if (name.includes('Deluxe')) return 'images/products/pulamed/deluxe.jpg';
    if (name.includes('Galaxy')) return 'images/products/pulamed/galaxy.jpg';
    if (name.includes('Flexi')) return 'images/products/pulamed/flexi.jpg';
    if (name.includes('Diamond')) return 'images/products/botsogo/diamond.jpg';
    if (name.includes('Platinum')) return 'images/products/botsogo/platinum.jpg';
    if (name.includes('Ruby')) return 'images/products/botsogo/ruby.jpg';
    if (name.includes('Bronze')) return 'images/products/botsogo/bronze.jpg';
    if (name.includes('Standard')) return 'images/products/bpomas/standard.jpg';
    if (name.includes('High')) return 'images/products/bpomas/high.jpg';
    if (name.includes('Premium')) return 'images/products/bpomas/premium.jpg';
    if (name.includes('Lifeline')) return 'images/products/metropolitan/lifeline.jpg';
    if (name.includes('Term Shield')) return 'images/products/metropolitan/termshield.jpg';
    if (name.includes('Home Secure')) return 'images/products/metropolitan/homesecure.jpg';
    if (name.includes('Boago')) return 'images/products/liberty/boago.jpg';
    if (name.includes('Hospital Cash')) return 'images/products/liberty/hospitalcash.jpg';
    
    return 'images/products/default.jpg';
}

// Rest of your functions
function toggleCompare(id) {
    const checkbox = document.getElementById(`compare${id}`);
    if (checkbox.checked) {
        selectedProducts.add(id);
    } else {
        selectedProducts.delete(id);
    }
    updateSelectedCount();
}

function updateSelectedCount() {
    const count = document.getElementById('selectedCount');
    if (count) count.textContent = selectedProducts.size;
}

function showComparison() {
    if (selectedProducts.size < 2) {
        alert('Select at least 2 plans');
        return;
    }
    
    const products = window.allProducts.filter(p => selectedProducts.has(p.id));
    const modal = new bootstrap.Modal(document.getElementById('compareModal'));
    modal.show();
}

function showLeadForm(id) {
    document.getElementById('selectedProductId').value = id;
    new bootstrap.Modal(document.getElementById('leadModal')).show();
}

function submitLead(e) {
    e.preventDefault();
    alert('Thank you! Insurer will contact you.');
    bootstrap.Modal.getInstance(document.getElementById('leadModal')).hide();
    e.target.reset();
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({behavior:'smooth'});
}

function setupEventListeners() {
    document.getElementById('leadForm').addEventListener('submit', submitLead);
}

function addRefreshButton() {
    const nav = document.querySelector('.navbar .container');
    if (!nav) return;
    
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline-light ms-3';
    btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    btn.onclick = loadProducts;
    nav.appendChild(btn);
}