module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    VENDOR:      'vendor',
    CUSTOMER:    'customer',
  },

  PRODUCT_SLUGS: {
    SIGNAGE_3D:    '3d_signage',
    NAME_PLATE:    'name_plate',
    NEON_SIGN:     'neon_sign',
    WALLPAPER:     'wallpaper',
    ALUMINIUM_LED: 'aluminium_led',
    LOLLIPOP_SIGN: 'lollipop_sign',
    PYLON_SIGN:    'pylon_sign',
  },

  ELEMENT_TYPES: {
    BASE:       'BASE',
    WALLPAPER:  'WALLPAPER',
    FRAME:      'FRAME',
    ELEMENT:    'ELEMENT',
    PYLON_BASE: 'PYLON_BASE',
  },

  ORDER_STATUS: [
    'pending', 'confirmed', 'processing',
    'shipped', 'delivered', 'cancelled', 'refunded',
  ],

  PAYMENT_METHODS: ['phonepe', 'googlepay', 'paytm', 'card', 'netbanking', 'cod'],

  PAYMENT_STATUS: ['pending', 'paid', 'failed', 'refunded'],

  S3_FOLDERS: {
    MATERIALS:       'materials',
    ELEMENTS:        'elements',
    FONTS:           'fonts',
    IMAGE_ASSETS:    'image-assets',
    LISTED_PRODUCTS: 'listed-products',
    USER_UPLOADS:    'user-uploads',
    VENDOR_LOGOS:    'vendor-logos',
    PREVIEWS:        'previews',
  },
};
