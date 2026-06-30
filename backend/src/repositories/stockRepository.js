const Stock = require('../models/Stock');

exports.getAll = async () => {
    return await Stock.find({});
};

exports.findBySkuAndWarehouse = async (sku, warehouse) => {
    return await Stock.findOne({ sku, warehouse });
};

exports.updateQuantity = async (id, newQty, dot = null) => {
    const updateData = { qty: newQty };
    if (dot !== null) {
        updateData.dot = dot;
    }
    await Stock.updateOne({ _id: id }, { $set: updateData });
};

exports.insert = async (stockData) => {
    const stock = new Stock(stockData);
    const savedStock = await stock.save();
    return savedStock.id;
};

exports.updateDetails = async (sku, warehouse, details) => {
    await Stock.updateOne(
        { sku, warehouse },
        { $set: details }
    );
};

exports.remove = async (sku, warehouse) => {
    await Stock.deleteOne({ sku, warehouse });
};