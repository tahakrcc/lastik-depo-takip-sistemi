/**
 * Application Logic
 */

const app = {
    currentPage: 'dashboard',
    cachedStocks: [],

    init: () => {
        const loggedIn = localStorage.getItem('isLoggedIn');
        if (loggedIn === 'true') {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            const username = localStorage.getItem('username');
            if(username) {
                document.querySelector('.user-info').innerText = 'Kullanıcı: ' + username;
            }
            app.applyPermissions();
            app.bindNavigation();
            app.loadPage('dashboard');
            app.updateNotifications();
        } else {
            document.getElementById('login-container').style.display = 'flex';
            document.getElementById('app-container').style.display = 'none';
        }
    },

    login: async () => {
        const u = document.getElementById('login-username').value;
        const p = document.getElementById('login-password').value;
        const err = document.getElementById('login-error');
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('app-container').style.display = 'flex';
                err.style.display = 'none';
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('username', data.username);
                localStorage.setItem('permissions', JSON.stringify(data.permissions || []));
                app.init(); 
            } else {
                err.innerText = data.error || 'Hatalı kullanıcı adı veya şifre!';
                err.style.display = 'block';
            }
        } catch (e) {
            err.innerText = 'Sunucuya bağlanılamadı!';
            err.style.display = 'block';
        }
    },

    togglePassword: () => {
        const pInput = document.getElementById('login-password');
        const icon = document.getElementById('toggle-password-icon');
        if (pInput.type === 'password') {
            pInput.type = 'text';
            icon.classList.remove('bx-show');
            icon.classList.add('bx-hide');
        } else {
            pInput.type = 'password';
            icon.classList.remove('bx-hide');
            icon.classList.add('bx-show');
        }
    },

    logout: () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('permissions');
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
    },

    shutdownServer: async () => {
        const confirmed = await app.showConfirm("Sistemi Kapat", "Sunucuyu tamamen kapatmak istediğinize emin misiniz? (Tekrar açmak için .exe dosyasına veya kısayola çift tıklamanız gerekir)");
        if (confirmed) {
            try {
                await fetch('/api/system/shutdown', { method: 'POST' });
            } catch (e) {
                // If the server goes down instantly, fetch might throw, which is fine.
            }
            app.showToast("Sistem başarıyla kapatıldı. Bu sekmeyi kapatabilirsiniz.", "success");
            // Optionally redirect or show a closed message
            document.body.innerHTML = '<div style="display:flex; height:100vh; align-items:center; justify-content:center; flex-direction:column; background:#f4f7fa; font-family:Inter,sans-serif;"><i class=\'bx bx-power-off\' style="font-size:64px; color:#ef4444; margin-bottom:20px;"></i><h2>Sistem Kapatıldı</h2><p style="color:#666; margin-top:10px;">Sunucu güvenli bir şekilde kapatıldı. Bu sekmeyi artık kapatabilirsiniz.</p></div>';
        }
    },

    bindNavigation: () => {
        const navLinks = document.querySelectorAll('.nav-list a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-target');
                if (target) {
                    app.navigateTo(target);
                }
            });
        });
    },

    toggleForm: (containerId, iconId) => {
        const container = document.getElementById(containerId);
        const icon = document.getElementById(iconId);
        if (container.style.display === 'none') {
            container.style.display = 'block';
            icon.classList.replace('bx-chevron-down', 'bx-chevron-up');
        } else {
            container.style.display = 'none';
            icon.classList.replace('bx-chevron-up', 'bx-chevron-down');
        }
    },

    navigateTo: (targetPage) => {
        if (targetPage === app.currentPage) return;
        document.querySelectorAll('.nav-list a').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-list a[data-target="${targetPage}"]`);
        if(activeLink) activeLink.classList.add('active');

        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(`page-${targetPage}`).classList.add('active');

        app.currentPage = targetPage;
        app.loadPage(targetPage);
    },

    loadPage: async (pageId) => {
        if (pageId === 'dashboard') await app.renderDashboard();
        if (pageId === 'stock') await app.renderStockPage();
        if (pageId === 'history') await app.renderHistoryPage();
        if (pageId === 'fast-out') await app.renderFastOutPage();
        if (pageId === 'sales') await app.renderSalesPage();
        if (pageId === 'admin') {
            app.renderAdminPage();
            app.loadPersonnelList();
        }
        
        if (pageId === 'movement') await app.renderMovementPage();
    },

    // 1. DASHBOARD
    renderDashboard: async () => {
        const [inMoves, outMoves, allSales] = await Promise.all([
            MockAPI.getMovements('IN'),
            MockAPI.getMovements('OUT'),
            MockAPI.getSales()
        ]);

        const totalSalesCount = allSales.length;
        const totalRevenue = allSales.reduce((sum, sale) => sum + (parseFloat(sale.price) || 0), 0);

        document.getElementById('dash-total-sales').innerText = totalSalesCount;
        document.getElementById('dash-total-revenue').innerText = totalRevenue.toLocaleString('tr-TR') + ' ₺';

        const renderRows = (moves, tableId, badgeClass, badgeText) => {
            const tbody = document.getElementById(tableId);
            tbody.innerHTML = '';
            if (moves.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">Kayıt yok.</td></tr>';
                return;
            }
            moves.slice(0, 5).forEach(m => {
                tbody.innerHTML += `
                    <tr>
                        <td style="color:#666;">${m.date}</td>
                        <td>
                            <div style="font-weight: 500;">${m.sku}</div>
                            <div style="font-size: 12px; color: #666;">${m.brand} ${m.model}</div>
                        </td>
                        <td>${m.warehouse}</td>
                        <td><span class="badge ${badgeClass}">${m.type === 'IN' ? '+' : '-'}${m.qty}</span></td>
                    </tr>
                `;
            });
        };
        renderRows(inMoves, 'dash-in-body', 'badge-in');
        renderRows(outMoves, 'dash-out-body', 'badge-out');
    },

    // 2. STOCK LIST
    renderStockPage: async () => {
        app.cachedStocks = await MockAPI.getStocks();
        const meta = await MockAPI.getMetadata();
        
        const brandSel = document.getElementById('brandFilter');
        brandSel.innerHTML = '<option value="ALL">Tüm Markalar</option>' + meta.brands.map(b => `<option value="${b}">${b}</option>`).join('');
        
        const sizeSel = document.getElementById('sizeFilter');
        sizeSel.innerHTML = '<option value="ALL">Tüm Ebatlar</option>' + meta.sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        
        const whSel = document.getElementById('warehouseFilter');
        whSel.innerHTML = '<option value="ALL">Tüm Şubeler</option>' + meta.warehouses.map(w => `<option value="${w}">${w}</option>`).join('');

        const seasonSel = document.getElementById('seasonFilter');
        seasonSel.innerHTML = '<option value="ALL">Tüm Mevsimler</option>' + meta.seasons.map(s => `<option value="${s}">${s}</option>`).join('');

        app.filterStock();
    },

    filterStock: () => {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const wh = document.getElementById('warehouseFilter').value;
        const br = document.getElementById('brandFilter').value;
        const sz = document.getElementById('sizeFilter').value;
        const se = document.getElementById('seasonFilter').value;

        const filtered = app.cachedStocks.filter(s => {
            const mSearch = (s.sku && s.sku.toLowerCase().includes(search)) || (s.model && s.model.toLowerCase().includes(search));
            const mWh = wh === 'ALL' || s.warehouse === wh;
            const mBr = br === 'ALL' || s.brand === br;
            const mSz = sz === 'ALL' || s.size === sz;
            const mSe = se === 'ALL' || s.season === se;
            return mSearch && mWh && mBr && mSz && mSe;
        });

        app.renderStockTable(filtered);
    },

    renderStockTable: (data) => {
        const tbody = document.getElementById('stock-table-body');
        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #999;">Ürün bulunamadı.</td></tr>';
            return;
        }

        data.forEach(stock => {
            let dotClass = 'dot-ok';
            let tooltip = 'Yeterli';
            if (stock.qty === 0) { dotClass = 'dot-out'; tooltip = 'Tükendi'; }
            else if (stock.qty <= stock.minQty) { dotClass = 'dot-low'; tooltip = `Kritik Eşik (Min: ${stock.minQty})`; }

            tbody.innerHTML += `
                <tr>
                    <td title="${tooltip}"><span class="status-dot ${dotClass}"></span></td>
                    <td>
                        <div style="font-weight: 500;">${stock.sku}</div>
                        <div style="font-size: 12px; color: #666;">${stock.model || '-'}</div>
                    </td>
                    <td>
                        <div>${stock.size || '-'}</div>
                        <div style="font-size: 12px; color: #666;">${stock.brand || '-'}</div>
                    </td>
                    <td>
                        <div>${stock.season || '-'}</div>
                        <div style="font-size: 12px; color: #666;">DOT: ${stock.dot || '-'}</div>
                    </td>
                    <td>
                        <div>${stock.warehouse}</div>
                        <div style="font-size: 12px; color: #666;">${stock.location || '-'}</div>
                    </td>
                    <td style="font-weight: 600; font-size: 14px;">${stock.qty}</td>
                    <td style="text-align:right;">
                        <button class="icon-btn" style="color: var(--primary);" onclick="app.openEditModal('${stock.sku}', '${stock.warehouse}')" title="Düzenle">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="icon-btn" style="color: #e74c3c;" onclick="app.deleteStock('${stock.sku}', '${stock.warehouse}')" title="Sil">
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    },

    // 3. ADD/OUT PRODUCT FORM (STOK GİRİŞ ÇIKIŞ)
    renderMovementPage: async () => {
        const meta = await MockAPI.getMetadata();
        
        document.getElementById('f_brand').innerHTML = '<option value="" disabled selected>Seçiniz</option>' + meta.brands.map(b => `<option value="${b}">${b}</option>`).join('');
        document.getElementById('f_model').innerHTML = '<option value="" disabled selected>Seçiniz</option>' + meta.models.map(m => `<option value="${m}">${m}</option>`).join('');
        document.getElementById('f_size').innerHTML = '<option value="" disabled selected>Seçiniz</option>' + meta.sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        document.getElementById('f_warehouse').innerHTML = '<option value="" disabled selected>Seçiniz</option>' + meta.warehouses.map(w => `<option value="${w}">${w}</option>`).join('');
        document.getElementById('f_season').innerHTML = '<option value="" disabled selected>Seçiniz</option>' + meta.seasons.map(s => `<option value="${s}">${s}</option>`).join('');

        // Initialize Fast Out section as well
        app.cachedStocks = await MockAPI.getStocks();
        document.getElementById('fastOutSearch').value = '';
        document.getElementById('fastOutForm').style.display = 'none';
        app.filterFastOut();
    },

    handleMovementSubmit: async (e) => {
        e.preventDefault();
        const type = 'IN';
        const movement = {
            type: type,
            sku: document.getElementById('f_sku').value.toUpperCase(),
            brand: document.getElementById('f_brand').value,
            model: document.getElementById('f_model').value,
            size: document.getElementById('f_size').value,
            season: document.getElementById('f_season').value,
            dot: document.getElementById('f_dot').value,
            minQty: document.getElementById('f_minQty').value,
            warehouse: document.getElementById('f_warehouse').value,
            location: document.getElementById('f_location').value,
            qty: document.getElementById('f_qty').value
        };

        await MockAPI.processMovement(movement);
        document.getElementById('movementForm').reset();
        await app.updateNotifications();
        app.showToast("Yeni ürün başarıyla depoya eklendi.", "success");
        app.navigateTo('dashboard');
    },

    // 4. FAST OUT
    filterFastOut: () => {
        const search = document.getElementById('fastOutSearch').value.toLowerCase();
        const filtered = app.cachedStocks.filter(s => {
            return (s.sku && s.sku.toLowerCase().includes(search)) || 
                   (s.model && s.model.toLowerCase().includes(search)) ||
                   (s.brand && s.brand.toLowerCase().includes(search));
        });

        const tbody = document.getElementById('fast-out-body');
        tbody.innerHTML = '';
        if(filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #999;">Ürün bulunamadı.</td></tr>';
            return;
        }

        filtered.forEach(stock => {
            if(stock.qty <= 0) return; // Hide out of stock items for fast out
            tbody.innerHTML += `
                <tr onclick="app.selectFastOutItem('${stock.sku}', '${stock.warehouse}', '${stock.brand}', '${stock.model}', ${stock.qty})">
                    <td style="text-align: center;"><i class='bx bx-check-circle' style="font-size: 20px; color: var(--border-light);" id="check_${stock.sku}_${stock.warehouse.replace(/\s/g,'')}"></i></td>
                    <td>
                        <div style="font-weight: 500;">${stock.sku}</div>
                    </td>
                    <td>${stock.brand || '-'} ${stock.model || '-'}</td>
                    <td>${stock.warehouse}</td>
                    <td style="font-weight: 600;">${stock.qty}</td>
                </tr>
            `;
        });
    },

    selectFastOutItem: (sku, warehouse, brand, model, maxQty) => {
        // Reset all checks
        document.querySelectorAll('#fast-out-body .bx-check-circle').forEach(icon => {
            icon.style.color = 'var(--border-light)';
        });
        // Select current
        const whClean = warehouse.replace(/\s/g,'');
        const icon = document.getElementById(`check_${sku}_${whClean}`);
        if(icon) icon.style.color = 'var(--success-text)';

        // Show form
        document.getElementById('fastOutForm').style.display = 'block';
        document.getElementById('selected-product-title').innerText = `Seçilen Ürün: ${sku} - ${brand} ${model} (${warehouse})`;
        document.getElementById('fo_sku').value = sku;
        document.getElementById('fo_warehouse').value = warehouse;
        document.getElementById('fo_qty').max = maxQty;
        document.getElementById('fo_qty').value = 1;
    },

    handleFastOutSubmit: async (e) => {
        e.preventDefault();
        const sku = document.getElementById('fo_sku').value;
        const warehouse = document.getElementById('fo_warehouse').value;
        const qty = document.getElementById('fo_qty').value;

        const movement = {
            type: 'OUT',
            sku: sku,
            warehouse: warehouse,
            qty: qty
        };

        await MockAPI.processMovement(movement);
        document.getElementById('fastOutForm').style.display = 'none';
        await app.updateNotifications();
        app.showToast("Ürün başarıyla çıkış yapıldı.", "success");
        app.renderFastOutPage(); // refresh
    },

    // 5. HISTORY PAGE
    cachedHistory: [],
    renderHistoryPage: async () => {
        app.cachedHistory = await MockAPI.getMovements('ALL');
        
        try {
            const meta = await MockAPI.getMetadata();
            const whSel = document.getElementById('historyWarehouseFilter');
            if (whSel) {
                whSel.innerHTML = '<option value="ALL">Tüm Şubeler</option>' + meta.warehouses.map(w => `<option value="${w}">${w}</option>`).join('');
            }
        } catch(e) { console.warn(e); }

        app.filterHistory();
    },

    filterHistory: () => {
        const search = document.getElementById('historySearchInput') ? document.getElementById('historySearchInput').value.toLowerCase() : '';
        const typeFilter = document.getElementById('historyTypeFilter') ? document.getElementById('historyTypeFilter').value : 'ALL';
        const whFilter = document.getElementById('historyWarehouseFilter') ? document.getElementById('historyWarehouseFilter').value : 'ALL';

        const filtered = app.cachedHistory.filter(m => {
            const matchSearch = (m.sku && m.sku.toLowerCase().includes(search)) || 
                                (m.brand && m.brand.toLowerCase().includes(search)) ||
                                (m.model && m.model.toLowerCase().includes(search));
            const matchType = typeFilter === 'ALL' || m.type === typeFilter;
            const matchWh = whFilter === 'ALL' || m.warehouse === whFilter;
            return matchSearch && matchType && matchWh;
        });

        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #999;">Kayıt bulunamadı.</td></tr>';
            return;
        }

        filtered.forEach(m => {
            let bClass = '';
            let bText = '';
            if (m.type === 'IN') { bClass = 'badge-in'; bText = 'Giriş'; }
            else if (m.type === 'OUT') { bClass = 'badge-out'; bText = 'Çıkış'; }
            else if (m.type === 'SALE') { bClass = 'badge-sale'; bText = 'Satış'; }
            else if (m.type === 'EDIT') { bClass = 'badge-edit'; bText = 'Düzenleme'; }

            tbody.innerHTML += `
                <tr>
                    <td>${m.date}</td>
                    <td><span class="badge ${bClass}">${bText}</span></td>
                    <td>${m.sku}</td>
                    <td>${m.brand} ${m.model}</td>
                    <td>${m.warehouse}</td>
                    <td style="font-weight: 600;">${m.qty}</td>
                </tr>
            `;
        });
    },

    // 6. BULK UPLOAD MOCK
    simulateBulkUpload: () => {
        document.getElementById('uploadModal').classList.add('active');
    },
    confirmBulkUpload: async () => {
        await MockAPI.bulkUpload(5);
        document.getElementById('uploadModal').classList.remove('active');
        await app.updateNotifications();
        app.showToast("Excel dosyası başarıyla içe aktarıldı (5 yeni kayıt).", "success");
        app.loadPage('stock');
    },

    // 7. NOTIFICATIONS
    updateNotifications: async () => {
        const stocks = await MockAPI.getStocks();
        const notifList = document.getElementById('notifList');
        const badge = document.getElementById('notifBadge');
        
        let html = '';
        let count = 0;

        stocks.forEach(s => {
            if (s.qty === 0) {
                html += `<div class="notif-item danger"><i class='bx bx-error-alt'></i> <div><strong>Tükendi:</strong> ${s.sku} - ${s.model} (${s.warehouse}) stoklarda bitti!</div></div>`;
                count++;
            } else if (s.qty <= s.minQty) {
                html += `<div class="notif-item warning"><i class='bx bx-alarm-exclamation'></i> <div><strong>Kritik Eşik:</strong> ${s.sku} - Sadece ${s.qty} adet kaldı.</div></div>`;
                count++;
            }
        });

        if(count === 0) {
            notifList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Yeni bildirim yok.</div>';
            badge.style.display = 'none';
        } else {
            notifList.innerHTML = html;
            badge.innerText = count > 9 ? '9+' : count;
            badge.style.display = 'flex';
        }
    },

    toggleNotifications: () => {
        document.getElementById('notifDropdown').classList.toggle('active');
    },

    showToast: (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'bx-info-circle';
        if (type === 'success') icon = 'bx-check-circle';
        if (type === 'error') icon = 'bx-x-circle';
        if (type === 'warning') icon = 'bx-error';

        toast.innerHTML = `
            <i class='bx ${icon}'></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    exportToCSV: (tableId) => {
        const table = document.getElementById(tableId);
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
        for (let i = 0; i < table.rows.length; i++) {
            let row = [], cols = table.rows[i].querySelectorAll("td, th");
            for (let j = 0; j < cols.length; j++) {
                let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, " ");
                row.push('"' + data + '"');
            }
            csvContent += row.join(",") + "\r\n";
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${tableId}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // 8. ADMIN UI
    renderAdminPage: async () => {
        const meta = await MockAPI.getMetadata();
        const renderList = (category, items) => {
            const ul = document.getElementById(`admin-list-${category}`);
            if(!ul) return;
            ul.innerHTML = items.map(item => `
                <li>
                    <span>${item}</span>
                    <button onclick="app.adminRemove('${category}', '${item}')"><i class='bx bx-trash'></i></button>
                </li>
            `).join('');
        };

        renderList('brands', meta.brands);
        renderList('models', meta.models);
        renderList('sizes', meta.sizes);
        renderList('warehouses', meta.warehouses);
    },

    showPrompt: (title) => {
        return new Promise((resolve) => {
            const modal = document.getElementById('promptModal');
            const titleEl = document.getElementById('promptModalTitle');
            const inputEl = document.getElementById('promptModalInput');
            const cancelBtn = document.getElementById('promptModalCancel');
            const confirmBtn = document.getElementById('promptModalConfirm');

            titleEl.innerText = title;
            inputEl.value = '';
            modal.classList.add('active');
            inputEl.focus();

            const cleanup = () => {
                modal.classList.remove('active');
                cancelBtn.onclick = null;
                confirmBtn.onclick = null;
                inputEl.onkeypress = null;
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(null);
            };

            confirmBtn.onclick = () => {
                cleanup();
                resolve(inputEl.value);
            };

            inputEl.onkeypress = (e) => {
                if(e.key === 'Enter') {
                    cleanup();
                    resolve(inputEl.value);
                }
            };
        });
    },

    showConfirm: (title, text) => {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmModalTitle');
            const textEl = document.getElementById('confirmModalText');
            const cancelBtn = document.getElementById('confirmModalCancel');
            const confirmBtn = document.getElementById('confirmModalConfirm');

            titleEl.innerText = title;
            textEl.innerText = text;
            modal.classList.add('active');

            const cleanup = () => {
                modal.classList.remove('active');
                cancelBtn.onclick = null;
                confirmBtn.onclick = null;
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };

            confirmBtn.onclick = () => {
                cleanup();
                resolve(true);
            };
        });
    },

    adminPromptAdd: async (category, promptText) => {
        const val = await app.showPrompt(promptText);
        if(val && val.trim() !== '') {
            const success = await MockAPI.addMetadataItem(category, val.trim());
            if(success) {
                app.showToast("Eklendi.", "success");
                app.renderAdminPage();
            }
        }
    },

    adminRemove: async (category, item) => {
        const confirmed = await app.showConfirm("Silme Onayı", `"${item}" öğesini silmek istediğinize emin misiniz?`);
        if(confirmed) {
            await MockAPI.removeMetadataItem(category, item);
            app.showToast("Silindi.", "success");
            app.renderAdminPage();
        }
    },

    // 9. EDIT / DELETE STOCK
    openEditModal: async (sku, warehouse) => {
        const stock = app.cachedStocks.find(s => s.sku === sku && s.warehouse === warehouse);
        if(!stock) return;

        const meta = await MockAPI.getMetadata();
        
        document.getElementById('e_brand').innerHTML = '<option value="" disabled selected>Seçiniz</option>' + meta.brands.map(b => `<option value="${b}">${b}</option>`).join('');
        document.getElementById('e_model').innerHTML = '<option value="" disabled selected>Seçiniz</option>' + meta.models.map(m => `<option value="${m}">${m}</option>`).join('');
        document.getElementById('e_size').innerHTML = '<option value="" disabled selected>Seçiniz</option>' + meta.sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        document.getElementById('e_season').innerHTML = '<option value="" disabled selected>Seçiniz</option>' + meta.seasons.map(s => `<option value="${s}">${s}</option>`).join('');

        document.getElementById('e_sku').value = stock.sku;
        document.getElementById('e_warehouse').value = stock.warehouse;
        
        document.getElementById('e_brand').value = stock.brand || '';
        document.getElementById('e_model').value = stock.model || '';
        document.getElementById('e_size').value = stock.size || '';
        document.getElementById('e_season').value = stock.season || '';
        document.getElementById('e_dot').value = stock.dot || '';
        document.getElementById('e_location').value = stock.location || '';
        document.getElementById('e_qty').value = stock.qty;
        document.getElementById('e_minQty').value = stock.minQty;

        document.getElementById('editStockModal').classList.add('active');
    },

    closeEditModal: () => {
        document.getElementById('editStockModal').classList.remove('active');
    },

    saveEditStock: async (e) => {
        e.preventDefault();
        const sku = document.getElementById('e_sku').value;
        const warehouse = document.getElementById('e_warehouse').value;
        
        const newDetails = {
            brand: document.getElementById('e_brand').value,
            model: document.getElementById('e_model').value,
            size: document.getElementById('e_size').value,
            season: document.getElementById('e_season').value,
            dot: document.getElementById('e_dot').value,
            location: document.getElementById('e_location').value,
            qty: document.getElementById('e_qty').value,
            minQty: document.getElementById('e_minQty').value,
        };

        const success = await MockAPI.updateStock(sku, warehouse, newDetails);
        if(success) {
            app.closeEditModal();
            app.showToast("Ürün başarıyla güncellendi.", "success");
            app.renderStockPage();
        } else {
            app.showToast("Ürün güncellenirken bir hata oluştu.", "error");
        }
    },

    deleteStock: async (sku, warehouse) => {
        const confirmed = await app.showConfirm("Ürünü Sil", `Bu ürünü (${sku}) depodan tamamen silmek istediğinize emin misiniz?`);
        if(confirmed) {
            const success = await MockAPI.deleteStock(sku, warehouse);
            if(success) {
                app.showToast("Ürün depodan silindi.", "success");
                app.renderStockPage();
            }
        }
    },

    // 7. SALES MODULE
    cachedSales: [],
    renderSalesPage: async () => {
        app.cachedSales = await MockAPI.getSales();
        app.filterSales();
    },

    filterSales: () => {
        const search = document.getElementById('salesSearchInput').value.toLowerCase();
        const whFilter = document.getElementById('salesWarehouseFilter') ? document.getElementById('salesWarehouseFilter').value : 'ALL';
        const dateFilter = document.getElementById('salesDateFilter') ? document.getElementById('salesDateFilter').value : 'ALL';
        
        const tbody = document.getElementById('sales-tbody');
        tbody.innerHTML = '';

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        // Start of week (Monday)
        const day = now.getDay() || 7; 
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1).getTime();
        
        // Start of month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const filtered = app.cachedSales.filter(s => {
            const matchName = s.customerName.toLowerCase().includes(search);
            const matchPhone = s.customerPhone.includes(search);
            const matchSku = s.sku.toLowerCase().includes(search);
            const matchBrand = (s.brand || '').toLowerCase().includes(search);
            const matchSearch = matchName || matchPhone || matchSku || matchBrand;

            const matchWh = whFilter === 'ALL' || s.warehouse === whFilter;

            let matchDate = true;
            if (dateFilter !== 'ALL') {
                // Parse date "DD.MM.YYYY HH:MM" to timestamp
                const parts = s.date.split(' ');
                const dateParts = parts[0].split('.');
                const timeParts = parts[1] ? parts[1].split(':') : [0,0];
                const sDate = new Date(dateParts[2], parseInt(dateParts[1])-1, dateParts[0], timeParts[0], timeParts[1]).getTime();

                if (dateFilter === 'TODAY') matchDate = sDate >= startOfDay;
                else if (dateFilter === 'WEEK') matchDate = sDate >= startOfWeek;
                else if (dateFilter === 'MONTH') matchDate = sDate >= startOfMonth;
            }

            return matchSearch && matchWh && matchDate;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Kayıt bulunamadı.</td></tr>';
            return;
        }

        filtered.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td style="color:#666;">${s.date}</td>
                    <td>
                        <div style="font-weight: 500;">${s.customerName}</div>
                        <div style="font-size: 12px; color: #666;"><i class='bx bx-phone'></i> ${s.customerPhone}</div>
                    </td>
                    <td>
                        <div style="font-weight: 500;">${s.sku}</div>
                        <div style="font-size: 12px; color: #666;">${s.brand} ${s.model}</div>
                    </td>
                    <td><span class="badge badge-out">${s.qty} Adet</span></td>
                    <td style="font-weight: 600; color: #10b981;">${parseFloat(s.price).toLocaleString('tr-TR')} ₺</td>
                </tr>
            `;
        });
    },

    openNewSaleModal: () => {
        document.getElementById('saleCustomerName').value = '';
        document.getElementById('saleCustomerPhone').value = '';
        document.getElementById('saleQty').value = '1';
        document.getElementById('salePrice').value = '';
        document.getElementById('saleStockSearch').value = '';

        app.saleBackToStep1();
        app.filterSaleStock(); // Load current stocks into table
        document.getElementById('newSaleModal').classList.add('active');
    },

    filterSaleStock: () => {
        const search = document.getElementById('saleStockSearch').value.toLowerCase();
        const tbody = document.getElementById('sale-stock-body');
        tbody.innerHTML = '';

        // Only show items that are in stock (qty > 0)
        const available = app.cachedStocks.filter(s => s.qty > 0 && 
            (s.sku.toLowerCase().includes(search) || 
             (s.brand || '').toLowerCase().includes(search) || 
             (s.model || '').toLowerCase().includes(search))
        );

        if (available.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;">Uygun stok bulunamadı.</td></tr>';
            return;
        }

        available.forEach(s => {
            const escapedBrand = (s.brand || '').replace(/'/g, "\\'");
            const escapedModel = (s.model || '').replace(/'/g, "\\'");
            tbody.innerHTML += `
                <tr style="cursor:pointer;" onclick="app.selectSaleStock('${s.sku}', '${s.warehouse}', ${s.qty}, '${escapedBrand}', '${escapedModel}')">
                    <td><button class="btn btn-outline btn-small"><i class='bx bx-check'></i></button></td>
                    <td style="font-weight:500;">${s.sku}</td>
                    <td>${s.brand} ${s.model}</td>
                    <td><span class="badge" style="background:#f3f4f6; color:#374151;">${s.warehouse}</span></td>
                    <td style="font-weight:600; color:#10b981;">${s.qty}</td>
                </tr>
            `;
        });
    },

    selectSaleStock: (sku, warehouse, maxQty, brand, model) => {
        document.getElementById('saleSku').value = sku;
        document.getElementById('saleWarehouse').value = warehouse;
        document.getElementById('saleMaxQty').value = maxQty;
        document.getElementById('saleQty').max = maxQty;
        document.getElementById('sale-selected-product').innerText = `Seçilen Ürün: ${sku} - ${brand} ${model} (${warehouse} - Maks: ${maxQty} adet)`;
        
        document.getElementById('saleStep1').style.display = 'none';
        document.getElementById('saleStep2').style.display = 'block';
    },

    saleBackToStep1: () => {
        document.getElementById('saleStep2').style.display = 'none';
        document.getElementById('saleStep1').style.display = 'block';
    },

    closeNewSaleModal: () => {
        document.getElementById('newSaleModal').classList.remove('active');
    },

    handleNewSaleSubmit: async () => {
        const cName = document.getElementById('saleCustomerName').value.trim();
        const cPhone = document.getElementById('saleCustomerPhone').value.trim();
        const sku = document.getElementById('saleSku').value.trim();
        const warehouse = document.getElementById('saleWarehouse').value;
        const qty = parseInt(document.getElementById('saleQty').value);
        const maxQty = parseInt(document.getElementById('saleMaxQty').value);
        const price = parseFloat(document.getElementById('salePrice').value);

        if (!cName || !cPhone || !sku || !qty || isNaN(price)) {
            app.showToast("Lütfen tüm alanları doldurun.", "error");
            return;
        }

        if (qty > maxQty) {
            app.showToast(`Stokta sadece ${maxQty} adet var. Fazla satış yapılamaz.`, "error");
            return;
        }

        const saleData = {
            customerName: cName,
            customerPhone: cPhone,
            sku: sku,
            warehouse: warehouse,
            qty: qty,
            price: price
        };

        const res = await MockAPI.addSale(saleData);
        if (res.success) {
            app.closeNewSaleModal();
            app.showToast("Satış başarıyla kaydedildi ve stok düşüldü.", "success");
            app.renderSalesPage(); // Refresh table
        }
    },

    applyPermissions: () => {
        const role = localStorage.getItem('role');
        const perms = JSON.parse(localStorage.getItem('permissions') || '[]');
        
        document.querySelectorAll('#nav-menu a').forEach(link => {
            const target = link.getAttribute('data-target');
            if (role === 'admin' || target === 'dashboard' || perms.includes(target) || perms.includes('all')) {
                link.parentElement.style.display = 'block';
            } else {
                link.parentElement.style.display = 'none';
            }
        });
        
        const adminLink = document.querySelector('[data-target="admin"]');
        if (role !== 'admin' && adminLink) {
            adminLink.parentElement.style.display = 'none';
        }
    },

    openPersonnelModal: () => {
        document.getElementById('p_modal_title').innerText = 'Yeni Personel Ekle';
        document.getElementById('p_submit_btn').innerText = 'Oluştur';
        document.getElementById('p_password_hint').style.display = 'none';
        document.getElementById('p_perms_group').style.display = 'block';
        document.getElementById('p_password').required = true;
        
        document.getElementById('p_id').value = '';
        document.getElementById('p_username').value = '';
        document.getElementById('p_password').value = '';
        document.querySelectorAll('input[name="p_perms"]').forEach(cb => cb.checked = false);
        document.getElementById('personnelModal').classList.add('active');
    },

    openEditPersonnelModal: (id, username, role, permsString) => {
        document.getElementById('p_modal_title').innerText = role === 'admin' ? 'Yönetici Düzenle' : 'Personel Düzenle';
        document.getElementById('p_submit_btn').innerText = 'Kaydet';
        document.getElementById('p_password_hint').style.display = 'inline';
        document.getElementById('p_password').required = false;

        document.getElementById('p_id').value = id;
        document.getElementById('p_username').value = username;
        document.getElementById('p_password').value = '';

        if (role === 'admin') {
            document.getElementById('p_perms_group').style.display = 'none';
        } else {
            document.getElementById('p_perms_group').style.display = 'block';
            let perms = [];
            try { perms = permsString ? JSON.parse(decodeURIComponent(permsString)) : []; } catch(e){}
            document.querySelectorAll('input[name="p_perms"]').forEach(cb => {
                cb.checked = perms.includes(cb.value);
            });
        }
        
        document.getElementById('personnelModal').classList.add('active');
    },

    closePersonnelModal: () => {
        document.getElementById('personnelModal').classList.remove('active');
    },

    handlePersonnelSubmit: async () => {
        const id = document.getElementById('p_id').value;
        const username = document.getElementById('p_username').value;
        const password = document.getElementById('p_password').value;
        const perms = Array.from(document.querySelectorAll('input[name="p_perms"]:checked')).map(cb => cb.value);
        
        if (!username) {
            app.showToast("Kullanıcı adı girmelisiniz.", "error");
            return;
        }

        if (!id && password.length < 5) {
            app.showToast("Yeni eklenen personel için en az 5 karakterli şifre girmelisiniz.", "error");
            return;
        }
        
        let res;
        if (id) {
            // Update
            res = await MockAPI.updateUser(id, username, password, perms);
        } else {
            // Create
            res = await MockAPI.addUser(username, password, perms);
        }

        if (res && res.success) {
            app.showToast(id ? "Kullanıcı güncellendi" : "Personel eklendi", "success");
            app.closePersonnelModal();
            app.loadPersonnelList();
        } else {
            app.showToast(res ? res.error : "Hata oluştu", "error");
        }
    },

    loadPersonnelList: async () => {
        const tbody = document.getElementById('admin-list-personnel');
        if (!tbody) return;
        
        const users = await MockAPI.getUsers();
        tbody.innerHTML = '';
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">Henüz eklenmiş personel yok.</td></tr>';
            return;
        }
        
        users.forEach(u => {
            const tr = document.createElement('tr');
            const permsText = u.permissions && u.permissions.length > 0 ? u.permissions.join(', ') : 'Yetki Yok';
            
            let actionButtons = `
                <button class="btn btn-outline btn-small" onclick="app.openEditPersonnelModal('${u.id}', '${u.username}', '${u.role}', '${encodeURIComponent(JSON.stringify(u.permissions))}')" style="margin-right:5px;"><i class='bx bx-edit' style="color:var(--primary)"></i></button>
            `;

            if (u.role !== 'admin') {
                actionButtons += `<button class="btn btn-outline btn-small" onclick="app.deletePersonnel('${u.id}')"><i class='bx bx-trash' style="color:var(--danger-text)"></i></button>`;
            }

            tr.innerHTML = `
                <td>${u.username}</td>
                <td><span class="status-badge" style="background:#e0f2fe;color:#0284c7;">${u.role}</span></td>
                <td style="font-size:12px; color:#666;">${u.role === 'admin' ? 'Tüm Yetkiler' : permsText}</td>
                <td style="text-align:right;">
                    ${actionButtons}
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    deletePersonnel: (id) => {
        app.showConfirm('Onay', 'Bu personeli silmek istediğinize emin misiniz?').then(async (confirmed) => {
            if (confirmed) {
                const success = await MockAPI.deleteUser(id);
                if (success) {
                    app.showToast("Personel silindi", "success");
                    app.loadPersonnelList();
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
