const { Router } = require('express');
const { contactValidation } = require('../validation/contact');
const { validate } = require('../middleware/validate');
const { sendContactEmail } = require('../services/email');

const router = Router();

router.post('/', contactValidation, validate, async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    await sendContactEmail({ name, email, subject, message });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully. We will get back to you shortly.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
