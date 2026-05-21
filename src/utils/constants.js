module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    VENDOR:      'vendor',
    CUSTOMER:    'customer',
  },

  /** Wallpaper catalog tier (stored on `wallpapers.wallpaper_type`; not a separate master table). */
  WALLPAPER_TYPES: ['regular', 'premium', 'prestige'],

  /** Fixed product_type.id for lollipop_sign in this project. */
  LOLLIPOP_PRODUCT_TYPE_ID: 6,

  BORDER_SHAPES: ['circle', 'oval', 'square'],
  BORDER_SIZES: ['small', 'medium', 'large'],

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

  /** Static CMS pages (slug → GET /api/common/pages/:slug). */
  CMS_PAGE_SLUGS: ['terms-conditions', 'about-us', 'privacy-policy'],

  /** Allowed listed-product size tier names (product may have one or more, not necessarily all three). */
  LISTED_PRODUCT_SIZES: ['regular', 'medium', 'large'],

  S3_FOLDERS: {
    MATERIALS:       'materials',
    BASES:           'bases',
    THICKNESSES:     'thicknesses',
    ELEMENTS:        'elements',
    FONTS:           'fonts',
    IMAGE_ASSETS:    'image-assets',
    LISTED_PRODUCTS: 'listed-products',
    USER_UPLOADS:    'user-uploads',
    CUSTOMER_PROFILES: 'customer-profiles',
    VENDOR_LOGOS:    'vendor-logos',
    PREVIEWS:        'previews',
    ILLUMINATION:    'illumination',
    FRAMES:          'frames',
    WALLPAPERS:      'wallpapers',
    ADD_BORDERS:     'add-borders',
    LOLLIPOP_ELEMENTS: 'lollipop-elements',
    PYLONS:          'pylons',
  },
};
