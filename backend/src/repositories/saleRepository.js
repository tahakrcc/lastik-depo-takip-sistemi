const Sale = require('../models/Sale');

exports.getAll = async () => {
    return await Sale.find({}).sort({ _id: -1 });
};

exports.insert = async (saleData) => {
    const sale = new Sale(saleData);
    const savedSale = await sale.save();
    return savedSale.id;
};