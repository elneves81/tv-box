"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/', (req, res) => {
    res.json({ message: 'Upload route' });
});
exports.default = router;
//# sourceMappingURL=upload.js.map