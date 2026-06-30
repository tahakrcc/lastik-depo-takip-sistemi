const stockRepository = require('../repositories/stockRepository');
const movementRepository = require('../repositories/movementRepository');

const getDateStr = () => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2,'0')}.${(now.getMonth()+1).toString().padStart(2,'0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
};

exports.getAllStocks = async () => {
    return await stockRepository.getAll();
};

exports.updateStockDetails = async (sku, warehouse, newDetails) => {
    await stockRepository.updateDetails(sku, warehouse, newDetails);
    
    // Log EDIT movement
    await movementRepository.insert({
        type: 'EDIT', sku, brand: newDetails.brand, model: newDetails.model, 
        warehouse, qty: newDetails.qty, date: getDateStr()
    });
};

exports.deleteStock = async (sku, warehouse) => {
    await stockRepository.remove(sku, warehouse);
};

exports.processMovement = async (mov) => {
    mov.brand = mov.brand || 'Bilinmiyor';
    mov.model = mov.model || '-';
    mov.date = getDateStr();

    await movementRepository.insert(mov);
    const existing = await stockRepository.findBySkuAndWarehouse(mov.sku, mov.warehouse);

    if (mov.type === 'IN') {
        if (existing) {
            const newQty = existing.qty + parseInt(mov.qty);
            await stockRepository.updateQuantity(existing.id, newQty, mov.dot || null);
        } else {
            await stockRepository.insert({
                sku: mov.sku, brand: mov.brand, model: mov.model, size: mov.size, 
                season: mov.season, dot: mov.dot, minQty: mov.minQty || 10, 
                warehouse: mov.warehouse, location: mov.location, qty: mov.qty
            });
        }
    } else if (mov.type === 'OUT') {
        if (existing) {
            const newQty = Math.max(0, existing.qty - parseInt(mov.qty));
            await stockRepository.updateQuantity(existing.id, newQty);
        } else {
            await stockRepository.insert({
                sku: mov.sku, brand: mov.brand, model: mov.model, size: '-', 
                season: '-', dot: '-', minQty: 10, 
                warehouse: mov.warehouse, location: mov.location || '-', qty: 0
            });
        }
    }
};

exports.bulkUpload = async (count) => {
    for(let i=0; i<count; i++) {
        const reqBody = {
            type: 'IN', sku: `BLK-00${i+1}`, brand: 'Falken', model: 'Azenis', size: '235/45 R18',
            season: 'Yaz', dot: '1224', minQty: 10, warehouse: 'TK 1', location: `Bulk-Raf-${i}`, qty: 20
        };
        await this.processMovement(reqBody);
    }
};