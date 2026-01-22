// app-airtable.js - MULTI-PAGE VERSION
const AIRTABLE_TOKEN = 'pat3O0ibg4EKppGFd.404fe41eea77ee6e66e2d8e72179250447c20021f4aed351a51134c04d6a4cdb';
const AIRTABLE_BASE_ID = 'appyCd1RKcaY8q1We';
const AIRTABLE_TABLE = 'Products';

// FIX 1: Load existing selections from localStorage so they persist across page refreshes
let selectedProducts = new Set(JSON.parse(localStorage.getItem('selectedProducts') || '[]'));

// Get current page category from URL or page ID
function getCurrentCategory() {
    // Check if we're on a category page
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '').replace('-', '_');
    
    // If it's index.html or empty, return null (home page)
    if (path === '/' || path.endsWith('index.html') || path === '') {
        return null;
    }
    
    // Map page names to categories
    const pageToCategory = {
        'medical': 'medical',
        'life': 'life',
        'funeral': 'funeral',
        'hospital_cash': 'hospital_cash',
        'business_insurance': 'business_insurance',
        'workers_compensation': 'workers_compensation',
        'public_liability': 'public_liability',
        'assets_insurance': 'assets_insurance',
        'motor_insurance': 'motor_insurance',
        'hospital_insurance': 'hospital_insurance'
    };
    
    return pageToCategory[pageName] || null;
}

// Load everything when page loads
document.addEventListener('DOMContentLoaded', async function() {
    const currentCategory = getCurrentCategory();
    await loadProducts(currentCategory);
    setupEventListeners();
    updatePageHeader(currentCategory);
    setupBreadcrumb(currentCategory);
    // FIX 2: Ensure the counter shows the correct number immediately on load
    updateSelectedCount();
});

async function loadProducts(filterCategory = null) {
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
        
        // Simple transformation - FIXED: Use record.id as fallback
        window.allProducts = data.records.map((record, index) => {
            const fields = record.fields;
            
            let premiums = [];
            if (fields['Premiums JSON']) {
                try {
                    premiums = JSON.parse(fields['Premiums JSON'].replace(/(\w+):/g, '"$1":'));
                } catch(e) {}
            }
            
            // FIX 3: Keep ID as a string to avoid type-mismatch with Airtable "rec..." IDs
            const productId = fields.ID && fields.ID !== 0 ? String(fields.ID) : 
                              record.id ? record.id : 
                              String(index + 1);
            
            return {
                id: productId, 
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
                // Simple price columns support
                plan_tiers: fields['Plan Tiers'] || '',
                basic_price: fields['Basic Price'] || null,
                standard_price: fields['Standard Price'] || null,
                premium_price: fields['Premium Price'] || null,
                price_notes: fields['Price Notes'] || ''
            };
        });
        
        console.log(`Loaded ${window.allProducts.length} products`);
        
        // Filter by category if specified
        if (filterCategory) {
            window.filteredProducts = window.allProducts.filter(p => p.category === filterCategory);
            console.log(`Filtered to ${window.filteredProducts.length} products in ${filterCategory} category`);
            displayFilteredProducts(filterCategory);
        } else {
            // Home page - show all categories
            displayAllProducts();
        }

        // FIX 4: Re-check the checkboxes for items already in the selected list
        document.querySelectorAll('.compare-checkbox').forEach(cb => {
            if (selectedProducts.has(cb.getAttribute('data-product-id'))) {
                cb.checked = true;
            }
        });
        
    } catch (error) {
        console.error('Failed to load:', error);
        // Fallback to data.js
        loadFallbackData(filterCategory);
    }
}

function loadFallbackData(filterCategory = null) {
    const script = document.createElement('script');
    script.src = 'data.js';
    script.onload = function() {
        console.log('Using fallback data.js');
        if (filterCategory) {
            window.filteredProducts = window.allProducts.filter(p => p.category === filterCategory);
            displayFilteredProducts(filterCategory);
        } else {
            displayAllProducts();
        }
    };
    document.head.appendChild(script);
}

// ============== displayAllProducts (Home Page) ==============
function displayAllProducts() {
    if (!window.allProducts || window.allProducts.length === 0) {
        console.log('No products to display');
        return;
    }
    
    // Get all unique categories from products
    const allCategories = [...new Set(window.allProducts.map(p => p.category))];
    
    // Display each category
    allCategories.forEach(categoryId => {
        const containerId = categoryId + 'Plans';
        let container = document.getElementById(containerId);
        
        // If container doesn't exist, create it
        if (!container) {
            container = createCategorySection(categoryId);
        }
        
        if (container) {
            const products = window.allProducts.filter(p => p.category === categoryId);
            container.innerHTML = '';
            
            if (products.length === 0) {
                container.innerHTML = '<div class="col-12 text-center"><p>No products in this category</p></div>';
                return;
            }
            
            // Show only first 3-4 products on home page
            const productsToShow = products.slice(0, 3);
            
            productsToShow.forEach(product => {
                container.appendChild(createCard(product));
            });
            
            // Add "View All" button if there are more products
            if (products.length > 3) {
                const viewAllBtn = document.createElement('div');
                viewAllBtn.className = 'col-12 text-center mt-4';
                viewAllBtn.innerHTML = `
                    <a href="pages/${categoryId.replace('_', '-')}.html" class="btn btn-outline-primary">
                        <i class="fas fa-eye"></i> View All ${products.length} ${getCategoryName(categoryId)} Plans
                    </a>
                `;
                container.appendChild(viewAllBtn);
            }
        }
    });
}

// ============== displayFilteredProducts (Category Page) ==============
function displayFilteredProducts(categoryId) {
    if (!window.filteredProducts || window.filteredProducts.length === 0) {
        const container = document.getElementById('productsContainer');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h3>No products available</h3>
                    <p>There are currently no ${getCategoryName(categoryId)} plans available.</p>
                    <a href="../index.html" class="btn btn-primary">
                        <i class="fas fa-home"></i> Back to Home
                    </a>
                </div>
            `;
        }
        return;
    }
    
    const container = document.getElementById('productsContainer');
    if (container) {
        container.innerHTML = '';
        
        window.filteredProducts.forEach(product => {
            container.appendChild(createCard(product));
        });
    }
}

function updatePageHeader(category) {
    if (!category) return;
    
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    if (pageTitle) {
        const categoryInfo = getCategoryInfo(category);
        pageTitle.innerHTML = `<i class="fas ${categoryInfo.icon}"></i> ${categoryInfo.name}`;
    }
    
    if (pageSubtitle) {
        const productCount = window.filteredProducts ? window.filteredProducts.length : 0;
        pageSubtitle.textContent = `Compare ${productCount} ${getCategoryName(category)} plans from top insurers`;
    }
}

function setupBreadcrumb(category) {
    if (!category) return;
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        const categoryInfo = getCategoryInfo(category);
        breadcrumb.innerHTML = `
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="../index.html"><i class="fas fa-home"></i> Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">${categoryInfo.name}</li>
                </ol>
            </nav>
        `;
    }
}

function createCategorySection(categoryId) {
    const categoryInfo = getCategoryInfo(categoryId);
    
    const containerId = categoryId + 'Plans';
    
    const compareSection = document.getElementById('compare');
    if (!compareSection) return null;
    
    const section = document.createElement('section');
    section.id = categoryId;
    section.className = 'py-5';
    
    const sections = document.querySelectorAll('section');
    if (sections.length % 2 !== 0) {
        section.classList.add('bg-light');
    }
    
    section.innerHTML = `
        <div class="container">
            <h2 class="text-center mb-4">
                <i class="fas ${categoryInfo.icon}"></i> ${categoryInfo.name}
            </h2>
            <div id="${containerId}" class="row"></div>
        </div>
    `;
    
    compareSection.parentElement.insertBefore(section, compareSection);
    
    return document.getElementById(containerId);
}

function getCategoryInfo(categoryId) {
    const categoryInfo = {
        'medical': { name: 'Medical Aid', icon: 'fa-heartbeat', page: 'medical.html' },
        'life': { name: 'Life Insurance', icon: 'fa-user-shield', page: 'life.html' },
        'funeral': { name: 'Funeral Plans', icon: 'fa-cross', page: 'funeral.html' },
        'hospital_cash': { name: 'Hospital Cash', icon: 'fa-hospital', page: 'hospital-cash.html' },
        'business_insurance': { name: 'Business Insurance', icon: 'fa-briefcase', page: 'business-insurance.html' },
        'workers_compensation': { name: 'Workers Compensation', icon: 'fa-hard-hat', page: 'workers-compensation.html' },
        'public_liability': { name: 'Public Liability', icon: 'fa-users', page: 'public-liability.html' },
        'assets_insurance': { name: 'Assets Insurance', icon: 'fa-warehouse', page: 'assets-insurance.html' },
        'motor_insurance': { name: 'Motor Insurance', icon: 'fa-car', page: 'motor-insurance.html' },
        'hospital_insurance': { name: 'Hospital Insurance', icon: 'fa-clinic-medical', page: 'hospital-insurance.html' }
    };
    
    return categoryInfo[categoryId] || { 
        name: categoryId.replace(/_/g, ' ').toUpperCase(), 
        icon: 'fa-shield-alt',
        page: categoryId.replace('_', '-') + '.html'
    };
}

function getCategoryName(categoryId) {
    const info = getCategoryInfo(categoryId);
    return info.name;
}

function createCard(product) {
    const div = document.createElement('div');
    div.className = 'col-md-4 mb-4';
    
    const productImage = getProductImage(product);
    const logoData = getLogoData(product);
    
    let priceHtml = '';
    
    // Check for simple price columns first (for non-technical users)
    if (product.basic_price || product.standard_price || product.premium_price) {
        const prices = [];
        if (product.basic_price) prices.push(product.basic_price);
        if (product.standard_price) prices.push(product.standard_price);
        if (product.premium_price) prices.push(product.premium_price);
        
        if (prices.length > 0) {
            const min = Math.min(...prices);
            priceHtml = `<div class="price-badge">From P${min}/month</div>`;
            
            // Add tier info if available
            if (product.plan_tiers) {
                priceHtml += `<div class="price-tiers mt-2 small text-muted">${product.plan_tiers.replace(/\n/g, '<br>')}</div>`;
            }
        }
    } 
    // Fallback to JSON premiums
    else if (product.premiums && product.premiums.length > 0) {
        const min = Math.min(...product.premiums.map(p => p.monthly_premium).filter(p => p));
        priceHtml = `<div class="price-badge">From P${min}/month</div>`;
    } else {
        priceHtml = '<div class="price-badge text-muted">Contact for quote</div>';
    }
    
    // Add price notes if available
    if (product.price_notes) {
        priceHtml += `<div class="price-notes mt-2 small">${product.price_notes}</div>`;
    }
    
    let logoHtml = '';
    if (logoData.image) {
        logoHtml = `<div class="company-logo-container"><img src="${logoData.image}" class="company-logo"></div>`;
    } else {
        logoHtml = `<div class="company-logo-container"><div class="company-logo-placeholder" style="background:${logoData.bgColor}">${logoData.text}</div></div>`;
    }
    
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
                    <button class="btn btn-get-quote" onclick="showLeadForm('${product.id}')">
                        <i class="fas fa-quote-right"></i> Get Quote
                    </button>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input compare-checkbox" id="compare${product.id}" data-product-id="${product.id}">
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

// ============== SIMPLE COMPARISON FUNCTIONS ==============
// Set up event listeners for comparison checkboxes
document.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('compare-checkbox')) {
        handleCompareCheckbox(e);
    }
});

function handleCompareCheckbox(event) {
    const checkbox = event.target;
    // FIX 5: Remove parseInt to keep IDs as strings
    const productId = checkbox.getAttribute('data-product-id');
    
    if (checkbox.checked) {
        selectedProducts.add(productId);
    } else {
        selectedProducts.delete(productId);
    }
    
    // FIX 6: Save selection to localStorage
    localStorage.setItem('selectedProducts', JSON.stringify(Array.from(selectedProducts)));
    updateSelectedCount();
}

function updateSelectedCount() {
    const count = document.getElementById('selectedCount');
    if (count) {
        count.textContent = selectedProducts.size;
        
        // Update button text
        const compareBtn = document.querySelector('button[onclick="showComparison()"]');
        if (compareBtn) {
            if (selectedProducts.size === 0) {
                compareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Show Comparison';
                compareBtn.classList.remove('btn-success');
                compareBtn.classList.add('btn-primary');
            } else {
                compareBtn.innerHTML = `<i class="fas fa-balance-scale"></i> Compare (${selectedProducts.size})`;
                compareBtn.classList.remove('btn-primary');
                compareBtn.classList.add('btn-success');
            }
        }
    }
}

function showComparison() {
    if (selectedProducts.size < 2) {
        alert('Please select at least 2 plans to compare');
        return;
    }
    
    const selectedIds = Array.from(selectedProducts);
    // FIX 7: Use string matching to ensure we find all products
    const products = window.allProducts.filter(p => selectedIds.includes(String(p.id)));
    
    if (products.length < 2) {
        alert('Error: Could not find selected products in the current list.');
        return;
    }
    
    // Build comparison table
    let comparisonHtml = '<div class="table-responsive"><table class="table comparison-table table-striped">';
    
    // Header row
    comparisonHtml += '<thead><tr>';
    comparisonHtml += '<th style="width: 20%;">Feature</th>';
    products.forEach(product => {
        comparisonHtml += `
            <th style="width: ${80/products.length}%;">
                <div class="text-center">
                    <div class="comparison-product-image mb-3" style="background-image:url('${getProductImage(product)}')">
                        <div class="comparison-logo-container">
                            ${getComparisonLogo(product)}
                        </div>
                    </div>
                    <div class="comparison-product-info">
                        <strong>${product.name}</strong><br>
                        <small class="text-muted">${product.company.name}</small>
                    </div>
                </div>
            </th>
        `;
    });
    comparisonHtml += '</tr></thead><tbody>';
    
    // Price row
    comparisonHtml += '<tr><td><strong><i class="fas fa-money-bill-wave"></i> Monthly Premium</strong></td>';
    products.forEach(product => {
        let priceText = 'Contact for quote';
        
        // Check simple prices first
        if (product.basic_price || product.standard_price || product.premium_price) {
            const prices = [];
            if (product.basic_price) prices.push(product.basic_price);
            if (product.standard_price) prices.push(product.standard_price);
            if (product.premium_price) prices.push(product.premium_price);
            
            if (prices.length > 0) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                priceText = min === max ? `P${min}` : `P${min} - P${max}`;
                
                if (product.plan_tiers) {
                    priceText += `<br><small class="text-muted">${product.plan_tiers.split('\n')[0]}</small>`;
                }
            }
        }
        // Fallback to JSON
        else if (product.premiums && product.premiums.length > 0) {
            const prices = product.premiums.map(p => p.monthly_premium).filter(p => p);
            if (prices.length > 0) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                priceText = min === max ? `P${min}` : `P${min} - P${max}`;
            }
        }
        
        comparisonHtml += `<td><strong class="text-primary">${priceText}</strong></td>`;
    });
    comparisonHtml += '</tr>';
    
    // Other features
    const features = [
        { name: 'Annual Limit', icon: 'fa-calendar-alt', key: 'annual_limit', format: v => v ? `P${v.toLocaleString()}` : 'N/A' },
        { name: 'Sum Assured', icon: 'fa-shield-alt', key: 'sum_assured', format: v => v || 'N/A' },
        { name: 'Waiting Period', icon: 'fa-clock', key: 'waiting_period_natural', format: v => v || 'No waiting period' },
        { name: 'Co-payment', icon: 'fa-hand-holding-usd', key: 'co_payment', format: v => v || 'None' },
        { name: 'Hospital Network', icon: 'fa-hospital', key: 'hospital_network', format: v => v || 'Nationwide' }
    ];
    
    features.forEach(feature => {
        comparisonHtml += `<tr><td><strong><i class="fas ${feature.icon}"></i> ${feature.name}</strong></td>`;
        products.forEach(product => {
            comparisonHtml += `<td>${feature.format(product[feature.key])}</td>`;
        });
        comparisonHtml += '</tr>';
    });
    
    // Key Features
    comparisonHtml += '<tr><td><strong><i class="fas fa-star"></i> Key Features</strong></td>';
    products.forEach(product => {
        let featuresHtml = '';
        if (product.key_features && product.key_features.length > 0) {
            featuresHtml = '<ul class="small mb-0 ps-3">';
            product.key_features.slice(0, 3).forEach(feature => {
                featuresHtml += `<li>${feature}</li>`;
            });
            if (product.key_features.length > 3) {
                featuresHtml += `<li class="text-muted">+${product.key_features.length - 3} more</li>`;
            }
            featuresHtml += '</ul>';
        } else {
            featuresHtml = '<span class="text-muted">N/A</span>';
        }
        comparisonHtml += `<td>${featuresHtml}</td>`;
    });
    comparisonHtml += '</tr>';
    
    // Clear selection button in modal
    comparisonHtml += '<tr><td><strong><i class="fas fa-trash-alt"></i> Clear Selection</strong></td>';
    products.forEach(product => {
        comparisonHtml += `
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromComparison('${product.id}')">
                    <i class="fas fa-times"></i> Remove
                </button>
            </td>
        `;
    });
    comparisonHtml += '</tr>';
    
    comparisonHtml += '</tbody></table></div>';
    document.getElementById('comparisonTable').innerHTML = comparisonHtml;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('compareModal'));
    modal.show();
}

function removeFromComparison(id) {
    selectedProducts.delete(id);
    // FIX 8: Save to localStorage after removing
    localStorage.setItem('selectedProducts', JSON.stringify(Array.from(selectedProducts)));
    
    const checkbox = document.getElementById(`compare${id}`);
    if (checkbox) {
        checkbox.checked = false;
    }
    updateSelectedCount();
    
    // Close modal if less than 2 products left
    if (selectedProducts.size < 2) {
        bootstrap.Modal.getInstance(document.getElementById('compareModal')).hide();
        if (selectedProducts.size === 0) {
            alert('Comparison cleared. Select 2 or more products to compare again.');
        }
    } else {
        // Refresh the comparison table
        showComparison();
    }
}

function getComparisonLogo(product) {
    const logoData = getLogoData(product);
    if (logoData.image) {
        return `<img src="${logoData.image}" alt="${product.company.name}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 8px;">`;
    } else {
        return `<div style="width: 50px; height: 50px; background:${logoData.bgColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 8px;">${logoData.text}</div>`;
    }
}

function getLogoData(product) {
    if (product.company.logoUrl && product.company.logoUrl.trim()) {
        return {
            image: product.company.logoUrl,
            bgColor: product.company.logoColor,
            text: product.company.logoText
        };
    }
    
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
    if (product.product_image && product.product_image.trim()) {
        return product.product_image;
    }
    
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
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
        leadForm.addEventListener('submit', submitLead);
    }
}

// Navigation function
function navigateToCategory(categoryId) {
    const page = getCategoryInfo(categoryId).page;
    window.location.href = `pages/${page}`;
}