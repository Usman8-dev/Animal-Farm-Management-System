import { validationResult } from 'express-validator';

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            errors: errors.array().map(err => err.msg)
        });
    }

    next();
};

export{validate}