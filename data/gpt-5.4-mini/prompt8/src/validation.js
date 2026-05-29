const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateContactPayload(input) {
  const errors = {};

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      ok: false,
      errors: {
        body: ['Request body must be a JSON object.']
      },
      value: null
    };
  }

  const name = normalizeString(input.name);
  const email = normalizeString(input.email);
  const subject = normalizeString(input.subject);
  const message = normalizeString(input.message);

  if (name.length < 2) {
    errors.name = ['Name must be at least 2 characters.'];
  } else if (name.length > 100) {
    errors.name = ['Name must be 100 characters or fewer.'];
  }

  if (!EMAIL_RE.test(email)) {
    errors.email = ['Email must be a valid address.'];
  }

  if (subject && subject.length > 150) {
    errors.subject = ['Subject must be 150 characters or fewer.'];
  }

  if (message.length < 10) {
    errors.message = ['Message must be at least 10 characters.'];
  } else if (message.length > 5000) {
    errors.message = ['Message must be 5000 characters or fewer.'];
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      name,
      email,
      subject,
      message
    }
  };
}

module.exports = {
  validateContactPayload
};
