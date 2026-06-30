const Movement = require('../models/Movement');

exports.getAll = async (type) => {
    let query = {};
    if (type && type !== 'ALL') {
        query.type = type;
    }
    return await Movement.find(query).sort({ _id: -1 });
};

exports.insert = async (mov) => {
    const movement = new Movement(mov);
    const savedMovement = await movement.save();
    return savedMovement.id;
};