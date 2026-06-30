const metadataRepository = require('../repositories/metadataRepository');

exports.getAllMetadata = async () => {
    const rows = await metadataRepository.getAll();
    const metadata = { brands: [], models: [], sizes: [], seasons: [], warehouses: [] };
    rows.forEach(r => {
        if (metadata[r.category]) metadata[r.category].push(r.value);
    });
    return metadata;
};

exports.addMetadataItem = async (category, item) => {
    return await metadataRepository.add(category, item);
};

exports.removeMetadataItem = async (category, item) => {
    await metadataRepository.remove(category, item);
};