const saleRepository = require('../repositories/saleRepository');
const stockRepository = require('../repositories/stockRepository');
const movementRepository = require('../repositories/movementRepository');

const getDateStr = () => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2,'0')}.${(now.getMonth()+1).toString().padStart(2,'0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
};

exports.getAllSales = async () => {
    return await saleRepository.getAll();
};

exports.processSale = async (s) => {
    const dateStr = getDateStr();
    const stock = await stockRepository.findBySkuAndWarehouse(s.sku, s.warehouse);
    const brand = stock ? stock.brand : 'Bilinmiyor';
    const model = stock ? stock.model : '-';

    s.brand = brand;
    s.model = model;
    s.date = dateStr;

    await saleRepository.insert(s);

    await movementRepository.insert({
        type: 'OUT', sku: s.sku, brand, model, warehouse: s.warehouse, qty: s.qty, date: dateStr
    });

    if (stock) {
        const newQty = Math.max(0, stock.qty - s.qty);
        await stockRepository.updateQuantity(stock.id, newQty);
    }
};