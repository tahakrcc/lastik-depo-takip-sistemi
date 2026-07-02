/**
 * Real API Layer - Connected to Node.js Backend with JWT Auth
 */

const API_BASE = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const handleResponse = async (res) => {
    if (res.status === 401 || res.status === 403) {
        if (window.app && window.app.logout) {
            window.app.logout();
        }
        throw new Error('Yetkisiz erişim. Lütfen giriş yapın.');
    }
    return await res.json();
};

const MockAPI = {
    getStocks: async () => {
        try {
            const res = await fetch(`${API_BASE}/stocks`, { headers: getHeaders() });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error fetching stocks:", e);
            return [];
        }
    },

    updateStock: async (sku, warehouse, newDetails) => {
        try {
            const res = await fetch(`${API_BASE}/stocks`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ sku, warehouse, newDetails })
            });
            const data = await handleResponse(res);
            return data.success;
        } catch (e) {
            console.error("Error updating stock:", e);
            if(window.app && window.app.showToast) window.app.showToast(e.message || "Hata", "error");
            return false;
        }
    },

    deleteStock: async (sku, warehouse) => {
        try {
            const res = await fetch(`${API_BASE}/stocks`, {
                method: 'DELETE',
                headers: getHeaders(),
                body: JSON.stringify({ sku, warehouse })
            });
            const data = await handleResponse(res);
            return data.success;
        } catch (e) {
            console.error("Error deleting stock:", e);
            if(window.app && window.app.showToast) window.app.showToast(e.message || "Hata", "error");
            return false;
        }
    },

    getMetadata: async () => {
        try {
            const res = await fetch(`${API_BASE}/metadata`, { headers: getHeaders() });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error fetching metadata:", e);
            return { brands: [], models: [], sizes: [], seasons: [], warehouses: [] };
        }
    },

    addMetadataItem: async (category, item) => {
        try {
            const res = await fetch(`${API_BASE}/metadata`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ category, item })
            });
            const data = await handleResponse(res);
            return data.success;
        } catch (e) {
            console.error("Error adding metadata:", e);
            if(window.app && window.app.showToast) window.app.showToast(e.message || "Hata", "error");
            return false;
        }
    },

    removeMetadataItem: async (category, item) => {
        try {
            const res = await fetch(`${API_BASE}/metadata`, {
                method: 'DELETE',
                headers: getHeaders(),
                body: JSON.stringify({ category, item })
            });
            const data = await handleResponse(res);
            return data.success;
        } catch (e) {
            console.error("Error removing metadata:", e);
            if(window.app && window.app.showToast) window.app.showToast(e.message || "Hata", "error");
            return false;
        }
    },

    getMovements: async (type = 'ALL') => {
        try {
            const res = await fetch(`${API_BASE}/movements?type=${type}`, { headers: getHeaders() });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error fetching movements:", e);
            return [];
        }
    },

    processMovement: async (mov) => {
        try {
            const res = await fetch(`${API_BASE}/movements`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(mov)
            });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error processing movement:", e);
            return { success: false };
        }
    },

    bulkUpload: async (count) => {
        try {
            const res = await fetch(`${API_BASE}/bulkUpload`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ count })
            });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error processing bulk upload:", e);
            if(window.app && window.app.showToast) window.app.showToast(e.message || "Hata", "error");
            return { success: false };
        }
    },

    getSales: async () => {
        try {
            const res = await fetch(`${API_BASE}/sales`, { headers: getHeaders() });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error fetching sales:", e);
            return [];
        }
    },

    addSale: async (saleData) => {
        try {
            const res = await fetch(`${API_BASE}/sales`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(saleData)
            });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error adding sale:", e);
            return { success: false };
        }
    },

    getUsers: async () => {
        try {
            const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error fetching users:", e);
            return [];
        }
    },

    addUser: async (username, password, permissions) => {
        try {
            const res = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ username, password, permissions })
            });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error adding user:", e);
            if(window.app && window.app.showToast) window.app.showToast(e.message || "Hata", "error");
            return { success: false, error: e.message };
        }
    },

    updateUser: async (id, username, password, permissions) => {
        try {
            const res = await fetch(`${API_BASE}/users`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ id, username, password, permissions })
            });
            return await handleResponse(res);
        } catch (e) {
            console.error("Error updating user:", e);
            if(window.app && window.app.showToast) window.app.showToast(e.message || "Hata", "error");
            return { success: false, error: e.message };
        }
    },

    deleteUser: async (id) => {
        try {
            const res = await fetch(`${API_BASE}/users`, {
                method: 'DELETE',
                headers: getHeaders(),
                body: JSON.stringify({ id })
            });
            const data = await handleResponse(res);
            return data.success;
        } catch (e) {
            console.error("Error deleting user:", e);
            if(window.app && window.app.showToast) window.app.showToast(e.message || "Hata", "error");
            return false;
        }
    }
};
