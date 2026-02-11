// BotsuInsure Enhanced - With Visitor Tracking, Monetization & Advanced Features
const AIRTABLE_TOKEN = 'pat3O0ibg4EKppGFd.404fe41eea77ee6e66e2d8e72179250447c20021f4aed351a51134c04d6a4cdb';
const AIRTABLE_BASE_ID = 'appyCd1RKcaY8q1We';
const PRODUCTS_TABLE = 'Products';
const VISITORS_TABLE = 'Visitors'; // New table for tracking
const LEADS_TABLE = 'Leads'; // New table for leads

// Global State
let selectedProducts = new Set(JSON.parse(localStorage.getItem('selectedProducts') || '[]'));
let allProducts = [];
let filteredProducts = [];
let currentFilters = {
    search: '',
    company: '',
    priceRange: '',
    sortBy: 'featured'
};

// ===== VISITOR TRACKING =====
async function trackVisitor() {
    try {
        // Get visitor info
        const visitorId = localStorage.getItem('visitorId') || generateVisitorId();
        localStorage.setItem('visitorId', visitorId);
        
        const visitorData = {
            'Visitor ID': visitorId,
            'First Visit': new Date().toISOString(),
            'Last Visit': new Date().toISOString(),
            'Page': window.location.pathname,
            'User Agent': navigator.userAgent,
            'Screen Size': `${window.screen.width}x${window.screen.height}`,
            'Referrer': document.referrer || 'Direct',
            'Country': 'Botswana', // Can be enhanced with IP geolocation
            'Device Type': getDeviceType(),
            'Visit Count': 1
        };

        // Check if visitor exists
        const existingVisitor = await checkExistingVisitor(visitorId);
        
        if (existingVisitor) {
            // Update existing visitor
            await updateVisitor(existingVisitor.id, {
                'Last Visit': new Date().toISOString(),
                'Visit Count': (existingVisitor.fields['Visit Count'] || 0) + 1,
                'Page': window.location.pathname
            });
        } else {
            // Create new visitor
            await createVisitor(visitorData);
        }
        
        // Track page view
        await trackPageView(visitorId);
        
    } catch (error) {
        console.log('Tracking error:', error);
    }
}

function generateVisitorId() {
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'Tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'Mobile';
    }
    return 'Desktop';
}

async function checkExistingVisitor(visitorId) {
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${VISITORS_TABLE}?filterByFormula={Visitor ID}='${visitorId}'`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`
                }
            }
        );
        const data = await response.json();
        return data.records && data.records.length > 0 ? data.records[0] : null;
    } catch (error) {
        console.log('Error checking visitor:', error);
        return null;
    }
}

async function createVisitor(visitorData) {
    try {
        await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${VISITORS_TABLE}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: visitorData
                })
            }
        );
    } catch (error) {
        console.log('Error creating visitor:', error);
    }
}

async function updateVisitor(recordId, updateData) {
    try {
        await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${VISITORS_TABLE}/${recordId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: updateData
                })
            }
        );
    } catch (error) {
        console.log('Error updating visitor:', error);
    }
}

async function trackPageView(visitorId) {
    // Track which page they viewed - can be used for analytics
    const pageData = {
        'Visitor ID': visitorId,
        'Page': window.location.pathname,
        'Timestamp': new Date().toISOString(),
        'Category': getCurrentCategory() || 'Home'
    };
    
    // You can create a separate PageViews table if needed
    console.log('Page view tracked:', pageData);
}

// ===== ENHANCED PRODUCT LOADING =====
async function loadProducts(filterCategory = null) {
    try {
        showLoader();
        
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PRODUCTS_TABLE}?sort%5B0%5D%5Bfield%5D=ID`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) throw new Error('Failed to load products');
        
        const data = await response.json();
        
        allProducts = data.records.map((record, index) => {
            const fields = record.fields;
            
            let premiums = [];
            if (fields['Premiums JSON']) {
                try {
                    premiums = JSON.parse(fields['Premiums JSON'].replace(/(\w+):/g, '"$1":'));
                } catch(e) {}
            }
            
            const productId = fields.ID && fields.ID !== 0 ? String(fields.ID) : 
                            record.id ? record.id : 
                            String(index + 1);
            
            return {
                id: productId,
                airtableId: record.id,
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
                product_image: fields['Product Image URL'] || '',
                plan_tiers: fields['Plan Tiers'] || '',
                basic_price: fields['Basic Price'] || null,
                standard_price: fields['Standard Price'] || null,
                premium_price: fields['Premium Price'] || null,
                price_notes: fields['Price Notes'] || '',
                is_premium: fields['Premium Listing'] || false,
                affiliate_link: fields['Affiliate Link'] || null,
                affiliate_commission: fields['Affiliate Commission'] || null,
                rating: fields['Rating'] || 0,
                reviews_count: fields['Reviews Count'] || 0
            };
        });
        
        console.log(`Loaded ${allProducts.length} products`);
        
        if (filterCategory) {
            filteredProducts = allProducts.filter(p => p.category === filterCategory);
            displayProducts(filteredProducts);
        } else {
            displayAllProducts();
        }
        
        hideLoader();
        initializeFilters();
        
    } catch (error) {
        console.error('Error loading products:', error);
        hideLoader();
        showError('Failed to load insurance plans. Please refresh the page.');
    }
}

// ===== ENHANCED PRODUCT DISPLAY =====
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No plans found</h3>
                    <p>Try adjusting your filters or search criteria</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    products.forEach((product, index) => {
        const card = createEnhancedProductCard(product, index);
        container.appendChild(card);
    });
}

function createEnhancedProductCard(product, index) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.style.animationDelay = `${index * 0.1}s`;
    
    // Calculate price display
    let priceDisplay = getPriceDisplay(product);
    
    // Check if selected
    const isSelected = selectedProducts.has(product.id);
    
    // Get product image
    const productImage = getProductImage(product);
    
    col.innerHTML = `
        <div class="product-card fade-in">
            ${product.is_premium ? '<div class="premium-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
            ${product.affiliate_link ? '<div class="affiliate-badge">Verified Partner</div>' : ''}
            
            <div class="product-image" style="background-image: url('${productImage}')">
                <div class="company-logo-container">
                    ${getLogoHTML(product)}
                </div>
            </div>
            
            <div class="card-body">
                <h5 class="product-title">${product.name}</h5>
                <p class="product-company">
                    <i class="fas fa-building"></i> ${product.company.name}
                </p>
                
                ${product.rating > 0 ? `
                    <div class="product-rating mb-2">
                        ${getStarRating(product.rating)}
                        <span class="text-muted small">(${product.reviews_count} reviews)</span>
                    </div>
                ` : ''}
                
                <div class="price-badge">
                    <strong>${priceDisplay.main}</strong>
                    ${priceDisplay.sub ? `<small>${priceDisplay.sub}</small>` : ''}
                </div>
                
                <div class="product-features">
                    ${product.key_features.slice(0, 3).map(feature => `
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>${feature}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="product-actions">
                    <button class="btn-primary-custom" onclick="handleGetQuote('${product.id}', ${product.affiliate_link ? `'${product.affiliate_link}'` : 'null'})">
                        <i class="fas fa-file-alt"></i> Get Quote
                    </button>
                    <button class="btn-compare ${isSelected ? 'active' : ''}" onclick="toggleCompare('${product.id}')">
                        <i class="fas ${isSelected ? 'fa-check' : 'fa-balance-scale'}"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

function getStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star" style="color: #ffd700;"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt" style="color: #ffd700;"></i>';
        } else {
            stars += '<i class="far fa-star" style="color: #ddd;"></i>';
        }
    }
    return stars;
}

function getPriceDisplay(product) {
    let mainPrice = 'Contact for Price';
    let subText = '';
    
    // Helper to prevent double BWP
    const cleanBWP = (val) => {
        let str = String(val);
        return str.includes('BWP') ? str : `BWP ${str}`;
    };
    
    if (product.premiums && product.premiums.length > 0) {
        const prices = product.premiums.map(p => p.price).filter(p => p);
        if (prices.length > 0) {
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            mainPrice = min === max ? cleanBWP(min.toLocaleString()) : `${cleanBWP(min.toLocaleString())} - ${max.toLocaleString()}`;
            subText = 'per month';
        }
    } else if (product.basic_price || product.standard_price || product.premium_price) {
        const prices = [product.basic_price, product.standard_price, product.premium_price].filter(p => p);
        if (prices.length > 0) {
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            mainPrice = min === max ? cleanBWP(min.toLocaleString()) : `${cleanBWP(min.toLocaleString())} - ${max.toLocaleString()}`;
            subText = 'per month';
        }
    }
    
    return { main: mainPrice, sub: subText };
}

function getLogoHTML(product) {
    if (product.company.logoUrl && product.company.logoUrl.trim()) {
        return `<img src="${product.company.logoUrl}" alt="${product.company.name}" class="company-logo">`;
    }
    return `<div class="company-logo-placeholder" style="background: ${product.company.logoColor};">${product.company.logoText}</div>`;
}

function getProductImage(product) {
    return product.product_image || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800';
}

// ===== AFFILIATE & LEAD TRACKING =====
async function handleGetQuote(productId, affiliateLink) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Track click
    await trackAffiliateClick(productId);
    
    if (affiliateLink) {
        // Open affiliate link in new tab
        window.open(affiliateLink, '_blank');
        
        // Also show our lead form for backup
        setTimeout(() => {
            showLeadForm(productId);
        }, 500);
    } else {
        // Show lead form
        showLeadForm(productId);
    }
}

async function trackAffiliateClick(productId) {
    const visitorId = localStorage.getItem('visitorId');
    
    const clickData = {
        'Product ID': productId,
        'Visitor ID': visitorId,
        'Timestamp': new Date().toISOString(),
        'Page': window.location.pathname
    };
    
    console.log('Affiliate click tracked:', clickData);
    // You can create an AffiliateClicks table to track these
}

function showLeadForm(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('selectedProductId').value = productId;
    document.getElementById('selectedProductName').textContent = product.name;
    document.getElementById('selectedProductCompany').textContent = product.company.name;
    
    const modal = new bootstrap.Modal(document.getElementById('leadModal'));
    modal.show();
}

async function submitLead(e) {
    e.preventDefault();
    
    const productId = document.getElementById('selectedProductId').value;
    const name = document.getElementById('leadName').value;
    const phone = document.getElementById('leadPhone').value;
    const email = document.getElementById('leadEmail').value;
    const notes = document.getElementById('leadNotes').value;
    
    const product = allProducts.find(p => p.id === productId);
    
    try {
        // Save to Airtable
        const leadData = {
            'Name': name,
            'Phone': phone,
            'Email': email,
            'Product ID': productId,
            'Product Name': product?.name || '',
            'Company': product?.company.name || '',
            'Category': product?.category || '',
            'Notes': notes,
            'Submitted': new Date().toISOString(),
            'Visitor ID': localStorage.getItem('visitorId'),
            'Source': 'Website',
            'Status': 'New'
        };
        
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${LEADS_TABLE}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: leadData
                })
            }
        );
        
        if (response.ok) {
            // Success
            showNotification('Thank you! Your quote request has been submitted. We\'ll contact you soon.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('leadModal')).hide();
            e.target.reset();
            
            // Send confirmation email (you can integrate with email service)
            sendLeadNotification(leadData);
        } else {
            throw new Error('Failed to submit');
        }
        
    } catch (error) {
        console.error('Error submitting lead:', error);
        showNotification('Sorry, there was an error. Please try again or call us directly.', 'error');
    }
}

function sendLeadNotification(leadData) {
    // This would integrate with an email service like SendGrid, Mailgun, etc.
    console.log('Lead notification would be sent:', leadData);
}

// ===== COMPARISON FUNCTIONALITY =====
function toggleCompare(productId) {
    if (selectedProducts.has(productId)) {
        selectedProducts.delete(productId);
    } else {
        if (selectedProducts.size >= 4) {
            showNotification('You can only compare up to 4 plans at once', 'warning');
            return;
        }
        selectedProducts.add(productId);
    }
    
    localStorage.setItem('selectedProducts', JSON.stringify(Array.from(selectedProducts)));
    updateSelectedCount();
    
    // Update button state
    const btn = event.target.closest('.btn-compare');
    if (btn) {
        if (selectedProducts.has(productId)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-check"></i>';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-balance-scale"></i>';
        }
    }
}

function updateSelectedCount() {
    const badges = document.querySelectorAll('#selectedCount');
    badges.forEach(badge => {
        badge.textContent = selectedProducts.size;
        if (selectedProducts.size > 0) {
            badge.classList.add('pulse-animation');
        } else {
            badge.classList.remove('pulse-animation');
        }
    });
}

function showComparison() {
    if (selectedProducts.size < 2) {
        showNotification('Please select at least 2 plans to compare', 'warning');
        return;
    }
    
    const products = Array.from(selectedProducts)
        .map(id => allProducts.find(p => p.id === id))
        .filter(p => p);
    
    displayComparisonTable(products);
}

function displayComparisonTable(products) {
    const container = document.getElementById('comparisonTable');
    if (!container) return;
    
    let html = '<div class="table-responsive"><table class="table comparison-table">';
    
    // Header
    html += '<thead><tr><th>Feature</th>';
    products.forEach(product => {
        html += `
            <th>
                <div class="text-center">
                    ${getLogoHTML(product)}
                    <div class="mt-2">
                        <strong>${product.name}</strong><br>
                        <small class="text-muted">${product.company.name}</small>
                    </div>
                </div>
            </th>
        `;
    });
    html += '</tr></thead><tbody>';
    
    // Price
    html += '<tr><td><strong><i class="fas fa-dollar-sign"></i> Price</strong></td>';
    products.forEach(product => {
        const price = getPriceDisplay(product);
        html += `<td class="text-center"><strong class="text-primary">${price.main}</strong><br><small>${price.sub}</small></td>`;
    });
    html += '</tr>';
    
    // Features comparison
    const features = [
        { label: 'Coverage', key: 'sum_assured', format: v => v ? `BWP ${v.toLocaleString()}` : 'N/A' },
        { label: 'Annual Limit', key: 'annual_limit', format: v => v ? `BWP ${v.toLocaleString()}` : 'N/A' },
        { label: 'Waiting Period', key: 'waiting_period_natural', format: v => v || 'None' },
        { label: 'Co-payment', key: 'co_payment', format: v => v || 'None' },
        { label: 'Rating', key: 'rating', format: v => getStarRating(v) }
    ];
    
    features.forEach(feature => {
        html += `<tr><td><strong><i class="fas fa-info-circle"></i> ${feature.label}</strong></td>`;
        products.forEach(product => {
            html += `<td class="text-center">${feature.format(product[feature.key])}</td>`;
        });
        html += '</tr>';
    });
    
    // Key benefits
    html += '<tr><td><strong><i class="fas fa-star"></i> Key Benefits</strong></td>';
    products.forEach(product => {
        html += '<td><ul class="text-start small">';
        product.key_features.slice(0, 5).forEach(feature => {
            html += `<li>${feature}</li>`;
        });
        html += '</ul></td>';
    });
    html += '</tr>';
    
    // Actions
    html += '<tr><td><strong><i class="fas fa-hand-pointer"></i> Action</strong></td>';
    products.forEach(product => {
        html += `
            <td class="text-center">
                <button class="btn btn-sm btn-primary" onclick="handleGetQuote('${product.id}', ${product.affiliate_link ? `'${product.affiliate_link}'` : 'null'})">
                    Get Quote
                </button>
                <button class="btn btn-sm btn-outline-danger mt-2" onclick="removeFromComparison('${product.id}')">
                    Remove
                </button>
            </td>
        `;
    });
    html += '</tr>';
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    
    const modal = new bootstrap.Modal(document.getElementById('compareModal'));
    modal.show();
}

function removeFromComparison(productId) {
    selectedProducts.delete(productId);
    localStorage.setItem('selectedProducts', JSON.stringify(Array.from(selectedProducts)));
    updateSelectedCount();
    
    if (selectedProducts.size < 2) {
        bootstrap.Modal.getInstance(document.getElementById('compareModal')).hide();
    } else {
        showComparison();
    }
}

// ===== FILTERS =====
function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const companyFilter = document.getElementById('companyFilter');
    const priceFilter = document.getElementById('priceFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        });
    }
    
    if (companyFilter) {
        companyFilter.addEventListener('change', (e) => {
            currentFilters.company = e.target.value;
            applyFilters();
        });
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', (e) => {
            currentFilters.priceRange = e.target.value;
            applyFilters();
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentFilters.sortBy = e.target.value;
            applyFilters();
        });
    }
}

function applyFilters() {
    let filtered = [...allProducts];
    
    const category = getCurrentCategory();
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    // Search
    if (currentFilters.search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(currentFilters.search) ||
            p.company.name.toLowerCase().includes(currentFilters.search)
        );
    }
    
    // Company
    if (currentFilters.company) {
        filtered = filtered.filter(p => p.company.name === currentFilters.company);
    }
    
    // Price range
    if (currentFilters.priceRange) {
        filtered = filtered.filter(p => {
            const price = getPriceDisplay(p);
            // Implement price range logic
            return true; // Simplified for now
        });
    }
    
    // Sort
    switch (currentFilters.sortBy) {
        case 'price-low':
            filtered.sort((a, b) => {
                const priceA = a.basic_price || a.premiums[0]?.price || 0;
                const priceB = b.basic_price || b.premiums[0]?.price || 0;
                return priceA - priceB;
            });
            break;
        case 'price-high':
            filtered.sort((a, b) => {
                const priceA = a.basic_price || a.premiums[0]?.price || 0;
                const priceB = b.basic_price || b.premiums[0]?.price || 0;
                return priceB - priceA;
            });
            break;
        case 'rating':
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'featured':
        default:
            filtered.sort((a, b) => (b.is_premium ? 1 : 0) - (a.is_premium ? 1 : 0));
            break;
    }
    
    displayProducts(filtered);
}

// ===== UTILITY FUNCTIONS =====
function getCurrentCategory() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '');
    
    const pageToCategory = {
        'medical': 'medical',
        'life': 'life',
        'funeral': 'funeral',
        'health': 'health',
        'property': 'property',
        'liability': 'liability',
        'workers-compensation': 'workers_compensation'
    };
    
    return pageToCategory[pageName] || null;
}

function showLoader() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoader() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

function showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `notification notification-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00c853' : type === 'error' ? '#f44336' : '#0066cc'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showError(message) {
    const container = document.getElementById('productsContainer');
    if (container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle"></i> ${message}
                </div>
            </div>
        `;
    }
}

// ===== HOMEPAGE CATEGORY DISPLAY =====
function displayAllProducts() {
    const container = document.getElementById('compare');
    if (!container) return;
    
    const categories = [
        { id: 'life', name: 'Life Insurance', icon: 'fa-user-shield', color: '#4CAF50', page: 'life.html' },
        { id: 'funeral', name: 'Funeral Insurance', icon: 'fa-cross', color: '#9C27B0', page: 'funeral.html' },
        { id: 'medical', name: 'Medical Aid', icon: 'fa-heartbeat', color: '#2196F3', page: 'medical.html' },
        { id: 'health', name: 'Health Insurance', icon: 'fa-stethoscope', color: '#F44336', page: 'health.html' },
        { id: 'property', name: 'Property Insurance', icon: 'fa-warehouse', color: '#FF9800', page: 'property.html' },
        { id: 'liability', name: 'Liability Insurance', icon: 'fa-users', color: '#3F51B5', page: 'liability.html' },
        { id: 'workers_compensation', name: 'Workers Comp', icon: 'fa-hard-hat', color: '#795548', page: 'workers-compensation.html' }
    ];
    
    let html = '<div class="row mt-5">';
    
    categories.forEach((cat, index) => {
        const count = allProducts.filter(p => p.category === cat.id).length;
        html += `
            <div class="col-md-6 col-lg-4 mb-4" style="animation-delay: ${index * 0.1}s">
                <div class="category-card fade-in" onclick="window.location.href='${cat.page}'">
                    <i class="fas ${cat.icon}" style="color: ${cat.color}"></i>
                    <h5>${cat.name}</h5>
                    <p>${count} plans available</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ===== SCROLL EFFECTS =====
function handleScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    // Track visitor
    await trackVisitor();
    
    // Load products
    const currentCategory = getCurrentCategory();
    await loadProducts(currentCategory);
    
    // Setup event listeners
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
        leadForm.addEventListener('submit', submitLead);
    }
    
    // Update selected count
    updateSelectedCount();
    
    // Scroll effects
    window.addEventListener('scroll', handleScroll);
    
    // Hide loader
    setTimeout(hideLoader, 500);
});

// ===== FLOATING ACTION BUTTON =====
function setupFloatingActions() {
    const floatingDiv = document.createElement('div');
    floatingDiv.className = 'floating-actions';
    floatingDiv.innerHTML = `
        <button class="fab-btn compare" onclick="showComparison()" title="Compare Plans">
            <i class="fas fa-balance-scale"></i>
            ${selectedProducts.size > 0 ? `<span class="fab-badge">${selectedProducts.size}</span>` : ''}
        </button>
        <button class="fab-btn whatsapp" onclick="window.open('https://wa.me/26771234567', '_blank')" title="WhatsApp Us">
            <i class="fab fa-whatsapp"></i>
        </button>
    `;
    document.body.appendChild(floatingDiv);
}

// Setup floating buttons after page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFloatingActions);
} else {
    setupFloatingActions();
}