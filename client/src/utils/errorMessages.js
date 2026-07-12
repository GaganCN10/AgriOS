export const FRIENDLY_ERRORS = {
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Unable to reach AgriOS servers. Please check your internet connection.',
    remedy: 'Check your network and try again.',
  },
  TIMEOUT: {
    title: 'Request Timed Out',
    message: 'The server took too long to respond.',
    remedy: 'Please retry in a moment. If it persists, the service may be under maintenance.',
  },
  AUTH_EXPIRED: {
    title: 'Session Expired',
    message: 'Your login session has expired.',
    remedy: 'Please log in again to continue.',
  },
  UNAUTHORIZED: {
    title: 'Access Denied',
    message: 'You do not have permission to perform this action.',
    remedy: 'Contact your administrator or try logging in with a different account.',
  },
  FORBIDDEN: {
    title: 'Premium Feature Locked',
    message: 'This feature requires an active premium subscription.',
    remedy: 'Go to Subscription tab and upgrade your plan to unlock.',
  },
  RATE_LIMIT: {
    title: 'Too Many Requests',
    message: 'You have exceeded your monthly API usage quota.',
    remedy: 'Upgrade your plan or wait until the next billing cycle.',
  },
  VALIDATION: {
    title: 'Invalid Input',
    message: 'Some fields contain invalid data.',
    remedy: 'Please review the highlighted fields and correct them.',
  },
  NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested resource was not found.',
    remedy: 'It may have been deleted or you may not have access to it.',
  },
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end.',
    remedy: 'Please try again in a few minutes. If the problem continues, contact support.',
  },
  ML_OFFLINE: {
    title: 'AI Service Unavailable',
    message: 'The analytics engine is currently offline.',
    remedy: 'Your farm data is safe. Please try again later or use basic features meanwhile.',
  },
  IMAGE_INVALID: {
    title: 'Invalid Image',
    message: 'The uploaded file is not a supported image format.',
    remedy: 'Please upload a JPG, PNG, or JPEG image under 8MB.',
  },
  IMAGE_TOO_LARGE: {
    title: 'Image Too Large',
    message: 'The uploaded image exceeds the 8MB size limit.',
    remedy: 'Compress the image or choose a smaller file.',
  },
  FARM_NAME_REQUIRED: {
    title: 'Farm Name Required',
    message: 'Please enter a name for your farm.',
    remedy: 'Enter at least 2 characters for the farm name.',
  },
  FARM_AREA_REQUIRED: {
    title: 'Boundary Required',
    message: 'Please map your farm boundary on the canvas.',
    remedy: 'Click on the map to draw at least 3 vertices forming a closed area.',
  },
  POLYGON_INVALID: {
    title: 'Invalid Boundary',
    message: 'The farm boundary polygon is invalid.',
    remedy: 'Ensure you close the ring with at least 4 points and avoid self-intersections.',
  },
  POLYGON_OVERLAP: {
    title: 'Boundary Overlap',
    message: 'This farm boundary overlaps with an existing farm.',
    remedy: 'Adjust the boundary to avoid overlapping with previously registered farms.',
  },
  PRICE_REQUIRED: {
    title: 'Price Required',
    message: 'Please enter a valid bid price.',
    remedy: 'Enter a numeric amount greater than zero.',
  },
  YIELD_REQUIRED: {
    title: 'Yield Required',
    message: 'Please enter a valid expected yield.',
    remedy: 'Enter a positive number in metric tons.',
  },
  TASK_TITLE_REQUIRED: {
    title: 'Task Title Required',
    message: 'Please enter a title for the task.',
    remedy: 'Enter at least 2 characters for the task title.',
  },
  INVENTORY_NAME_REQUIRED: {
    title: 'Item Name Required',
    message: 'Please enter a name for the inventory item.',
    remedy: 'Enter at least 2 characters for the item name.',
  },
  EQUIPMENT_NAME_REQUIRED: {
    title: 'Equipment Name Required',
    message: 'Please enter a name for the equipment.',
    remedy: 'Enter at least 2 characters for the equipment name.',
  },
  EMAIL_REQUIRED: {
    title: 'Email Required',
    message: 'Please enter your email address.',
    remedy: 'Enter a valid email format, e.g. farmer@example.com',
  },
  PASSWORD_MIN: {
    title: 'Password Too Short',
    message: 'Password must be at least 6 characters.',
    remedy: 'Use a stronger password with letters, numbers, and symbols.',
  },
  CREDENTIALS_INVALID: {
    title: 'Invalid Login',
    message: 'The email or password you entered is incorrect.',
    remedy: 'Double-check your credentials or use the "Forgot Password" option.',
  },
  EMAIL_EXISTS: {
    title: 'Email Already Registered',
    message: 'An account with this email already exists.',
    remedy: 'Try logging in instead, or use a different email address.',
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    message: 'We could not process your payment.',
    remedy: 'Check your card details and try again, or use a different payment method.',
  },
  PDF_ERROR: {
    title: 'PDF Generation Failed',
    message: 'Could not generate your document package.',
    remedy: 'Ensure you have farm data saved and try again.',
  },
};

export function getFriendlyError(err) {
  if (!err) return FRIENDLY_ERRORS.SERVER_ERROR;

  const msg = (err.message || err.error || err.msg || '').toLowerCase();
  const raw = err.error || err.msg || err.message || '';

  if (msg.includes('invalid credentials') || msg.includes('incorrect password') || msg.includes('wrong password')) return FRIENDLY_ERRORS.CREDENTIALS_INVALID;
  if (msg.includes('jwt') || msg.includes('token') || msg.includes('unauthorized') || msg.includes('authentication') || msg.includes('401')) return FRIENDLY_ERRORS.AUTH_EXPIRED;
  if (msg.includes('forbidden') || msg.includes('premium') || msg.includes('403')) return FRIENDLY_ERRORS.FORBIDDEN;
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota') || msg.includes('compute limit') || msg.includes('exhausted')) return FRIENDLY_ERRORS.RATE_LIMIT;
  if (msg.includes('validation') || msg.includes('required')) return FRIENDLY_ERRORS.VALIDATION;
  if (msg.includes('invalid')) return FRIENDLY_ERRORS.VALIDATION;
  if (msg.includes('not found') || msg.includes('404')) return FRIENDLY_ERRORS.NOT_FOUND;
  if (msg.includes('ml service') || msg.includes('analytics sidecar')) return FRIENDLY_ERRORS.ML_OFFLINE;
  if (msg.includes('image') && msg.includes('invalid')) return FRIENDLY_ERRORS.IMAGE_INVALID;
  if (msg.includes('image') && msg.includes('size')) return FRIENDLY_ERRORS.IMAGE_TOO_LARGE;
  if (msg.includes('email already') || msg.includes('already exists')) return FRIENDLY_ERRORS.EMAIL_EXISTS;
  if (msg.includes('payment') || msg.includes('card')) return FRIENDLY_ERRORS.PAYMENT_FAILED;
  if (msg.includes('pdf')) return FRIENDLY_ERRORS.PDF_ERROR;
  if (msg.includes('insufficient role permissions') || msg.includes('insufficient permissions')) return FRIENDLY_ERRORS.UNAUTHORIZED;
  if (msg.includes('only') && msg.includes('can')) return FRIENDLY_ERRORS.FORBIDDEN;
  if (msg.includes('no image file uploaded') || msg.includes('no image')) return FRIENDLY_ERRORS.IMAGE_INVALID;
  if (msg.includes('image exceeds')) return FRIENDLY_ERRORS.IMAGE_TOO_LARGE;
  if (msg.includes('failed to') || msg.includes('failure')) return FRIENDLY_ERRORS.SERVER_ERROR;

  return FRIENDLY_ERRORS.SERVER_ERROR;
}
