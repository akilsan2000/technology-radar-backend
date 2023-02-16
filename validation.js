const { check } = require('express-validator');

exports.technologyValidation = [
    check('name', 'Name is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('ring', 'Ring is required').if((value, { req }) => req.body.isPublished).not().isEmpty(),
    check('technologyDescription', 'Technology description is required').not().isEmpty(),
    check('classificationDescription', 'Classification description is required').if((value, { req }) => req.body.isPublished).not().isEmpty()
];

exports.technologyPatchValidation = [
    check('ring', 'Ring is required').not().isEmpty(),
    check('classificationDescription', 'Classification description is required').not().isEmpty()
];