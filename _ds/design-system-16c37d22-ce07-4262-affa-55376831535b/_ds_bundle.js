/* @ds-bundle: {"format":3,"namespace":"DesignSystem_16c37d","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"ICON_NAMES","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Textarea","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Accordion","sourcePath":"components/navigation/Accordion.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"3bd1076dc3fa","components/core/Badge.jsx":"03c597ef3a42","components/core/Button.jsx":"da6d6094a855","components/core/Card.jsx":"9a0ecef8dcfd","components/core/Icon.jsx":"6d41db1c1c68","components/core/IconButton.jsx":"7a1b11ef990a","components/core/Logo.jsx":"77c5ae29646f","components/forms/Checkbox.jsx":"075cc48fa65c","components/forms/Field.jsx":"f958a26075dc","components/forms/Input.jsx":"2c23f713994f","components/forms/Select.jsx":"b0be04ca8f40","components/navigation/Accordion.jsx":"4dadcfa4b045","components/navigation/Tabs.jsx":"d24914d43a41","ui_kits/website/Footer.jsx":"9d6a02b80b08","ui_kits/website/Header.jsx":"e8c242942f4a","ui_kits/website/sections/HeroSection.jsx":"0b69084066a2"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_16c37d = window.DesignSystem_16c37d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Fluxio Avatar — initials or image, calm circular. */
function Avatar({
  name = '',
  src = null,
  size = 44,
  tone = 'teal',
  style = {},
  ...rest
}) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const tones = {
    teal: {
      bg: 'var(--teal-100)',
      color: 'var(--teal-700)'
    },
    petrol: {
      bg: 'var(--petrol-700)',
      color: '#fff'
    },
    sand: {
      bg: 'var(--sand-300)',
      color: 'var(--petrol-800)'
    }
  };
  const t = tones[tone] || tones.teal;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      background: t.bg,
      color: t.color,
      flexShrink: 0,
      fontFamily: 'var(--font-text)',
      fontWeight: 600,
      fontSize: size * 0.38,
      letterSpacing: '-0.01em',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Fluxio Badge — small status/label pill. */
function Badge({
  children,
  variant = 'neutral',
  dot = false,
  style = {},
  ...rest
}) {
  const tones = {
    neutral: {
      bg: 'var(--neutral-100)',
      color: 'var(--text-body)',
      dot: 'var(--neutral-400)'
    },
    brand: {
      bg: 'var(--teal-100)',
      color: 'var(--teal-700)',
      dot: 'var(--teal-500)'
    },
    success: {
      bg: 'var(--green-100)',
      color: 'var(--green-600)',
      dot: 'var(--green-600)'
    },
    warning: {
      bg: 'var(--amber-100)',
      color: 'var(--amber-600)',
      dot: 'var(--amber-600)'
    },
    danger: {
      bg: 'var(--red-100)',
      color: 'var(--red-600)',
      dot: 'var(--red-600)'
    },
    outline: {
      bg: 'transparent',
      color: 'var(--text-muted)',
      dot: 'var(--neutral-400)',
      border: 'var(--border-default)'
    }
  };
  const t = tones[variant] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-text)',
      fontSize: 12.5,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: '-0.005em',
      padding: '5px 10px',
      borderRadius: 'var(--radius-pill)',
      background: t.bg,
      color: t.color,
      border: t.border ? `1px solid ${t.border}` : '1px solid transparent',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: t.dot
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * Fluxio Button — the primary action element.
 * Variants: primary (teal), secondary (outline), ghost, dark (on petrol).
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft = null,
  iconRight = null,
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const sizes = {
    sm: {
      fontSize: 13,
      padding: '8px 14px',
      gap: 7,
      radius: 'var(--radius-sm)',
      icon: 15
    },
    md: {
      fontSize: 15,
      padding: '11px 20px',
      gap: 9,
      radius: 'var(--radius-md)',
      icon: 17
    },
    lg: {
      fontSize: 17,
      padding: '15px 28px',
      gap: 10,
      radius: 'var(--radius-md)',
      icon: 19
    }
  };
  const s = sizes[size] || sizes.md;
  const palettes = {
    primary: {
      bg: 'var(--brand)',
      color: '#fff',
      border: 'transparent',
      bgHover: 'var(--brand-hover)',
      bgActive: 'var(--brand-active)',
      shadow: 'var(--shadow-teal)'
    },
    secondary: {
      bg: 'transparent',
      color: 'var(--text-strong)',
      border: 'var(--border-default)',
      bgHover: 'var(--sand-200)',
      bgActive: 'var(--neutral-200)',
      shadow: 'none'
    },
    ghost: {
      bg: 'transparent',
      color: 'var(--brand)',
      border: 'transparent',
      bgHover: 'var(--teal-50)',
      bgActive: 'var(--teal-100)',
      shadow: 'none'
    },
    dark: {
      bg: '#fff',
      color: 'var(--petrol-800)',
      border: 'transparent',
      bgHover: 'var(--sand-200)',
      bgActive: 'var(--sand-300)',
      shadow: 'var(--shadow-md)'
    }
  };
  const p = palettes[variant] || palettes.primary;
  const bg = disabled ? 'var(--neutral-200)' : active ? p.bgActive : hover ? p.bgHover : p.bg;
  const color = disabled ? 'var(--text-subtle)' : p.color;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      fontFamily: 'var(--font-text)',
      fontWeight: 600,
      fontSize: s.fontSize,
      letterSpacing: '-0.01em',
      lineHeight: 1,
      padding: s.padding,
      borderRadius: s.radius,
      border: `1px solid ${disabled ? 'transparent' : p.border}`,
      background: bg,
      color,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: hover && !disabled && variant === 'primary' ? p.shadow : variant === 'dark' && !disabled ? p.shadow : 'none',
      transform: active && !disabled ? 'translateY(1px)' : 'none',
      transition: 'background var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      fontSize: s.icon
    }
  }, iconLeft), children, iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      fontSize: s.icon
    }
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/**
 * Fluxio Card — soft, calm container. The default surface for content blocks.
 */
function Card({
  children,
  elevation = 'sm',
  padding = 'md',
  interactive = false,
  tone = 'default',
  style = {},
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const pads = {
    none: 0,
    sm: 'var(--space-4)',
    md: 'var(--space-5)',
    lg: 'var(--space-6)'
  };
  const elevations = {
    none: 'none',
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)'
  };
  const tones = {
    default: {
      bg: 'var(--surface-card)',
      border: 'var(--border-subtle)',
      color: 'var(--text-body)'
    },
    cream: {
      bg: 'var(--surface-cream)',
      border: 'transparent',
      color: 'var(--text-body)'
    },
    petrol: {
      bg: 'var(--petrol-800)',
      border: 'transparent',
      color: 'var(--text-on-dark)'
    },
    teal: {
      bg: 'var(--teal-600)',
      border: 'transparent',
      color: '#fff'
    }
  };
  const t = tones[tone] || tones.default;
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: t.bg,
      color: t.color,
      border: `1px solid ${t.border}`,
      borderRadius: 'var(--radius-lg)',
      padding: pads[padding] ?? pads.md,
      boxShadow: interactive && hover ? 'var(--shadow-md)' : elevations[elevation] ?? elevations.sm,
      transform: interactive && hover ? 'translateY(-3px)' : 'none',
      transition: 'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
      cursor: interactive ? 'pointer' : 'default',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Fluxio Icon — curated line-icon set (Lucide-style: 24px grid, 2px stroke,
 * round caps/joins). Self-contained so the design system has no CDN dependency.
 */
const PATHS = {
  'arrow-right': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 6l6 6-6 6"
  })),
  'arrow-up-right': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M7 17 17 7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 7h9v9"
  })),
  check: /*#__PURE__*/React.createElement("path", {
    d: "M5 12.5 10 17.5 19.5 7"
  }),
  'check-circle': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 12.5 11 15l4.5-5"
  })),
  plus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  })),
  minus: /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }),
  x: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 6 18 18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18"
  })),
  menu: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 7h16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 12h16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 17h16"
  })),
  'chevron-down': /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  }),
  'chevron-right': /*#__PURE__*/React.createElement("path", {
    d: "M9 6l6 6-6 6"
  }),
  phone: /*#__PURE__*/React.createElement("path", {
    d: "M6.5 4h3l1.5 4.5L9 10.5a12 12 0 0 0 4.5 4.5l2-2 4.5 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 5 6.6 1.5 1.5 0 0 1 6.5 4Z"
  }),
  mail: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "5",
    width: "18",
    height: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3.5 7 8.5 6 8.5-6"
  })),
  'map-pin': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 21s-6.5-5.5-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.5-6.5 11-6.5 11Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "2.4"
  })),
  calendar: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "5",
    width: "16",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 9h16M9 3v4M15 3v4"
  })),
  clock: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7.5V12l3 2"
  })),
  'file-text': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 3v5h5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 13h6M9 17h6"
  })),
  calculator: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "3",
    width: "14",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 7h8M8.5 12h0M12 12h0M15.5 12h0M8.5 16h0M12 16h0M15.5 16h.01"
  })),
  shield: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 12l2 2 4-4"
  })),
  lock: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "11",
    width: "14",
    height: "9",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 11V8a4 4 0 0 1 8 0v3"
  })),
  user: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "3.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 20a7 7 0 0 1 14 0"
  })),
  users: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "8",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 20a6 6 0 0 1 12 0"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 5.5a3 3 0 0 1 0 5.8M21 20a6 6 0 0 0-4-5.6"
  })),
  'message-circle': /*#__PURE__*/React.createElement("path", {
    d: "M21 11.5a8 8 0 0 1-11.5 7.2L4 20l1.3-5.2A8 8 0 1 1 21 11.5Z"
  }),
  star: /*#__PURE__*/React.createElement("path", {
    d: "m12 4 2.3 4.9 5.2.6-3.9 3.6 1.1 5.2L12 16.2 7.3 18.9l1.1-5.2L4.5 10l5.2-.6Z"
  }),
  sparkles: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"
  })),
  'trending-up': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 16l5-5 4 4 7-7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 8h4v4"
  })),
  'pie-chart': /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 3a9 9 0 1 0 9 9h-9Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 3v9h9A9 9 0 0 0 12 3Z",
    opacity: ".4"
  })),
  briefcase: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "7",
    width: "18",
    height: "13",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"
  })),
  heart: /*#__PURE__*/React.createElement("path", {
    d: "M12 20s-7-4.6-7-9.6A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7-2.6c0 5-7 9.6-7 9.6Z"
  }),
  quote: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M9 7H5v5h4v-2c0 2-1 3-3 3v2c3 0 5-2 5-5V7Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M20 7h-4v5h4v-2c0 2-1 3-3 3v2c3 0 5-2 5-5V7Z"
  }))
};
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
  style = {},
  ...rest
}) {
  const inner = PATHS[name];
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: 'inline-block',
      flexShrink: 0,
      verticalAlign: 'middle',
      ...style
    },
    "aria-hidden": "true"
  }, rest), inner || null);
}
const ICON_NAMES = Object.keys(PATHS);
Object.assign(__ds_scope, { Icon, ICON_NAMES });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Fluxio IconButton — square, icon-only action. */
function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  label,
  onClick,
  style = {},
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const dims = {
    sm: 32,
    md: 40,
    lg: 48
  };
  const d = dims[size] || dims.md;
  const palettes = {
    ghost: {
      bg: 'transparent',
      color: 'var(--text-body)',
      bgHover: 'var(--sand-200)'
    },
    solid: {
      bg: 'var(--brand)',
      color: '#fff',
      bgHover: 'var(--brand-hover)'
    },
    outline: {
      bg: 'transparent',
      color: 'var(--text-strong)',
      bgHover: 'var(--sand-200)',
      border: 'var(--border-default)'
    },
    dark: {
      bg: 'rgba(255,255,255,0.08)',
      color: '#fff',
      bgHover: 'rgba(255,255,255,0.16)'
    }
  };
  const p = palettes[variant] || palettes.ghost;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: d,
      height: d,
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${p.border || 'transparent'}`,
      background: disabled ? 'var(--neutral-100)' : hover ? p.bgHover : p.bg,
      color: disabled ? 'var(--text-subtle)' : p.color,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background var(--dur-fast) var(--ease-out)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Fluxio Logo — mark + wordmark lockup. Use `tone="light"` on dark backgrounds.
 */
function Logo({
  tone = 'dark',
  showSlogan = false,
  size = 'md',
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      mark: 30,
      word: 22,
      slogan: 11,
      gap: 9
    },
    md: {
      mark: 42,
      word: 31,
      slogan: 13,
      gap: 12
    },
    lg: {
      mark: 56,
      word: 42,
      slogan: 15,
      gap: 15
    }
  };
  const s = sizes[size] || sizes.md;
  const onDark = tone === 'light';
  const tile = onDark ? '#FAF7F0' : '#0F2A3F';
  const strokes = onDark ? ['#1B6E7E', '#3FA7A0', '#0F2A3F'] : ['#3FA7A0', '#79C5BD', '#FFFFFF'];
  const wordColor = onDark ? '#FFFFFF' : 'var(--petrol-800)';
  const sloganColor = onDark ? 'var(--teal-200)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: s.mark,
    height: s.mark,
    viewBox: "0 0 48 48",
    fill: "none",
    "aria-label": "Fluxio",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("rect", {
    width: "48",
    height: "48",
    rx: "13",
    fill: tile
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 18c4-4.4 8-4.4 12 0s8 4.4 12 0",
    stroke: strokes[0],
    strokeWidth: "2.6",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 24c4-4.4 8-4.4 12 0s8 4.4 12 0",
    stroke: strokes[1],
    strokeWidth: "2.6",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 30c4-4.4 8-4.4 12 0s8 4.4 12 0",
    stroke: strokes[2],
    strokeWidth: "2.6",
    strokeLinecap: "round",
    strokeOpacity: "0.9"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: s.word,
      letterSpacing: '-0.035em',
      color: wordColor
    }
  }, "Fluxio"), showSlogan && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: s.slogan,
      color: sloganColor,
      marginTop: 4,
      letterSpacing: '-0.005em'
    }
  }, "Vos imp\xF4ts, en toute fluidit\xE9")));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Fluxio Checkbox — square check with teal fill when on. */
function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-text)',
      fontSize: 15,
      color: 'var(--text-body)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flexShrink: 0,
      borderRadius: 'var(--radius-xs)',
      border: `1.5px solid ${checked ? 'var(--brand)' : 'var(--border-strong)'}`,
      background: checked ? 'var(--brand)' : 'var(--neutral-0)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
      opacity: disabled ? 0.5 : 1
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "3.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12.5 10 17.5 19.5 7"
  }))), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Fluxio Field — label + hint/error wrapper for any form control. */
function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      width: '100%',
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-strong)',
      letterSpacing: '-0.005em'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--red-600)',
      marginLeft: 3
    }
  }, "*")), children, error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 13,
      color: 'var(--red-600)'
    }
  }, error) : hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, hint));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Fluxio Input — text field with calm focus state. */
function Input({
  type = 'text',
  size = 'md',
  invalid = false,
  disabled = false,
  iconLeft = null,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const sizes = {
    sm: {
      h: 38,
      fs: 14,
      px: 12
    },
    md: {
      h: 46,
      fs: 15,
      px: 14
    },
    lg: {
      h: 54,
      fs: 16,
      px: 16
    }
  };
  const s = sizes[size] || sizes.md;
  const borderColor = invalid ? 'var(--red-600)' : focus ? 'var(--brand)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      width: '100%'
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: s.px,
      display: 'inline-flex',
      color: 'var(--text-muted)',
      pointerEvents: 'none'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      height: s.h,
      boxSizing: 'border-box',
      padding: iconLeft ? `0 ${s.px}px 0 ${s.px + 26}px` : `0 ${s.px}px`,
      fontFamily: 'var(--font-text)',
      fontSize: s.fs,
      color: 'var(--text-strong)',
      background: disabled ? 'var(--neutral-100)' : 'var(--neutral-0)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      boxShadow: focus && !invalid ? `0 0 0 4px var(--focus-ring)` : invalid ? `0 0 0 4px var(--red-100)` : 'none',
      transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
      ...style
    }
  }, rest)));
}

/** Multi-line text area, same visual language as Input. */
function Textarea({
  rows = 4,
  invalid = false,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const borderColor = invalid ? 'var(--red-600)' : focus ? 'var(--brand)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '12px 14px',
      resize: 'vertical',
      fontFamily: 'var(--font-text)',
      fontSize: 15,
      lineHeight: 1.55,
      color: 'var(--text-strong)',
      background: disabled ? 'var(--neutral-100)' : 'var(--neutral-0)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      boxShadow: focus && !invalid ? `0 0 0 4px var(--focus-ring)` : 'none',
      transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Input, Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Fluxio Select — native select with brand styling and chevron. */
function Select({
  size = 'md',
  invalid = false,
  disabled = false,
  children,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const sizes = {
    sm: {
      h: 38,
      fs: 14,
      px: 12
    },
    md: {
      h: 46,
      fs: 15,
      px: 14
    },
    lg: {
      h: 54,
      fs: 16,
      px: 16
    }
  };
  const s = sizes[size] || sizes.md;
  const borderColor = invalid ? 'var(--red-600)' : focus ? 'var(--brand)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      height: s.h,
      boxSizing: 'border-box',
      padding: `0 ${s.px + 26}px 0 ${s.px}px`,
      fontFamily: 'var(--font-text)',
      fontSize: s.fs,
      color: 'var(--text-strong)',
      background: disabled ? 'var(--neutral-100)' : 'var(--neutral-0)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      appearance: 'none',
      WebkitAppearance: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: focus && !invalid ? `0 0 0 4px var(--focus-ring)` : 'none',
      transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
      ...style
    }
  }, rest), children), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: s.px,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--text-muted)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Accordion.jsx
try { (() => {
const {
  useState
} = React;
/** Fluxio Accordion — calm expandable rows. Ideal for FAQ. */
function Accordion({
  items = [],
  allowMultiple = false,
  defaultOpen = [],
  style = {}
}) {
  const [open, setOpen] = useState(new Set(defaultOpen));
  const toggle = id => {
    setOpen(prev => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(id)) next.delete(id);else next.add(id);
      return next;
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, items.map(it => {
    const on = open.has(it.id);
    return /*#__PURE__*/React.createElement("div", {
      key: it.id,
      style: {
        borderBottom: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => toggle(it.id),
      "aria-expanded": on,
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '20px 4px',
        textAlign: 'left',
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--text-strong)',
        letterSpacing: '-0.01em'
      }
    }, it.question, /*#__PURE__*/React.createElement("span", {
      style: {
        flexShrink: 0,
        color: 'var(--brand)',
        transform: on ? 'rotate(45deg)' : 'none',
        transition: 'transform var(--dur-base) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M12 5v14M5 12h14"
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateRows: on ? '1fr' : '0fr',
        transition: 'grid-template-rows var(--dur-base) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 4px 22px',
        fontFamily: 'var(--font-text)',
        fontSize: 15.5,
        lineHeight: 1.65,
        color: 'var(--text-body)',
        maxWidth: 640
      }
    }, it.answer))));
  }));
}
Object.assign(__ds_scope, { Accordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const {
  useState
} = React;
/** Fluxio Tabs — underline style, controlled or uncontrolled. */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  style = {}
}) {
  const [internal, setInternal] = useState(defaultValue ?? (items[0] && items[0].id));
  const active = value !== undefined ? value : internal;
  const select = id => {
    if (value === undefined) setInternal(id);
    onChange && onChange(id);
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-subtle)',
      ...style
    }
  }, items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      role: "tab",
      "aria-selected": on,
      onClick: () => select(it.id),
      style: {
        position: 'relative',
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        padding: '11px 14px',
        cursor: 'pointer',
        fontFamily: 'var(--font-text)',
        fontSize: 15,
        fontWeight: on ? 600 : 500,
        color: on ? 'var(--text-strong)' : 'var(--text-muted)',
        letterSpacing: '-0.005em',
        transition: 'color var(--dur-fast) var(--ease-out)'
      }
    }, it.label, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: -1,
        height: 2.5,
        borderRadius: 2,
        background: 'var(--brand)',
        transform: on ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'center',
        transition: 'transform var(--dur-base) var(--ease-out)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Footer.jsx
try { (() => {
/* Fluxio website — Footer */
function SiteFooter({
  onNavigate
}) {
  const {
    Logo,
    Icon
  } = window.DesignSystem_16c37d;
  const col = (title, items) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--teal-300)'
    }
  }, title), items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it,
    onClick: () => onNavigate && onNavigate('contact'),
    style: {
      cursor: 'pointer',
      fontSize: 14.5,
      color: 'rgba(234,241,240,0.78)',
      textDecoration: 'none'
    }
  }, it)));
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--petrol-800)',
      color: 'var(--text-on-dark)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-8) var(--gutter) var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
      gap: 40,
      paddingBottom: 'var(--space-7)'
    },
    className: "fx-footer-grid"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 300
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    tone: "light",
    size: "md"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 16,
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'rgba(234,241,240,0.72)'
    }
  }, "Fiduciaire \xE0 taille humaine pour les particuliers de Suisse romande. Vos imp\xF4ts, en toute fluidit\xE9.")), col('Services', ['Déclaration d\u2019impôts', 'Conseil fiscal', 'Optimisation', 'Indépendants']), col('Cabinet', ['À propos', 'Notre équipe', 'Tarifs', 'Contact']), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--teal-300)'
    }
  }, "Contact"), /*#__PURE__*/React.createElement("a", {
    href: "tel:+41220000000",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 14.5,
      color: 'rgba(234,241,240,0.78)',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "phone",
    size: 16
  }), " 022 000 00 00"), /*#__PURE__*/React.createElement("a", {
    href: "mailto:hello@fluxio.ch",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 14.5,
      color: 'rgba(234,241,240,0.78)',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail",
    size: 16
  }), " hello@fluxio.ch"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 14.5,
      color: 'rgba(234,241,240,0.78)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 16
  }), " Rue du Rh\xF4ne 12, 1204 Gen\xE8ve"))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-ondark)',
      paddingTop: 22,
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      fontSize: 13,
      color: 'rgba(234,241,240,0.55)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Fluxio S\xE0rl \u2014 Tous droits r\xE9serv\xE9s"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("a", {
    style: {
      color: 'inherit',
      textDecoration: 'none',
      cursor: 'pointer'
    }
  }, "Mentions l\xE9gales"), /*#__PURE__*/React.createElement("a", {
    style: {
      color: 'inherit',
      textDecoration: 'none',
      cursor: 'pointer'
    }
  }, "Confidentialit\xE9")))));
}
window.SiteFooter = SiteFooter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Header.jsx
try { (() => {
/* Fluxio website — Header / top navigation */
const DS = window.DesignSystem_16c37d;
function SiteHeader({
  current,
  onNavigate
}) {
  const {
    Button,
    Logo,
    Icon,
    IconButton
  } = DS;
  const [open, setOpen] = React.useState(false);
  const links = [{
    id: 'home',
    label: 'Accueil'
  }, {
    id: 'services',
    label: 'Services'
  }, {
    id: 'tarifs',
    label: 'Tarifs'
  }, {
    id: 'contact',
    label: 'Contact'
  }];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(250,247,240,0.82)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter)',
      height: 74,
      display: 'flex',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => onNavigate('home'),
    style: {
      cursor: 'pointer',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: "sm"
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 4,
      marginLeft: 'auto'
    },
    className: "fx-desktop-nav"
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.id,
    onClick: () => onNavigate(l.id),
    style: {
      cursor: 'pointer',
      padding: '9px 14px',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-text)',
      fontSize: 15,
      fontWeight: current === l.id ? 600 : 500,
      color: current === l.id ? 'var(--text-strong)' : 'var(--text-muted)',
      transition: 'color var(--dur-fast) var(--ease-out)'
    }
  }, l.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    },
    className: "fx-desktop-nav"
  }, /*#__PURE__*/React.createElement("a", {
    href: "tel:+41220000000",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      color: 'var(--text-strong)',
      fontSize: 14.5,
      fontWeight: 600,
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "phone",
    size: 16,
    color: "var(--brand)"
  }), " 022 000 00 00"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: () => onNavigate('contact')
  }, "Prendre rendez-vous")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'none'
    },
    className: "fx-mobile-nav"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Menu",
    variant: "ghost",
    onClick: () => setOpen(v => !v)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: open ? 'x' : 'menu'
  })))), open && /*#__PURE__*/React.createElement("div", {
    className: "fx-mobile-nav",
    style: {
      borderTop: '1px solid var(--border-subtle)',
      padding: '12px var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.id,
    onClick: () => {
      onNavigate(l.id);
      setOpen(false);
    },
    style: {
      cursor: 'pointer',
      padding: '12px 8px',
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--text-strong)'
    }
  }, l.label)), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    style: {
      marginTop: 8
    },
    onClick: () => {
      onNavigate('contact');
      setOpen(false);
    }
  }, "Prendre rendez-vous")));
}
window.SiteHeader = SiteHeader;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/sections/HeroSection.jsx
try { (() => {
/* Fluxio website — Home page sections */
const FX = () => window.DesignSystem_16c37d;

/* ---------- Hero ---------- */
function Hero({
  onNavigate
}) {
  const {
    Button,
    Badge,
    Icon,
    Card
  } = FX();
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'linear-gradient(180deg, var(--sand-200) 0%, var(--sand-100) 100%)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-9) var(--gutter) var(--space-8)',
      display: 'grid',
      gridTemplateColumns: '1.05fr 0.95fr',
      gap: 56,
      alignItems: 'center'
    },
    className: "fx-hero-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "fx-eyebrow",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 14
  }), " Fiduciaire \xB7 Suisse romande"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'clamp(40px, 5.4vw, 68px)',
      fontWeight: 800,
      letterSpacing: '-0.035em',
      lineHeight: 1.02,
      margin: '18px 0 0'
    }
  }, "Vos imp\xF4ts,", /*#__PURE__*/React.createElement("br", null), "en toute ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, "fluidit\xE9"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'clamp(17px, 1.5vw, 20px)',
      lineHeight: 1.6,
      color: 'var(--text-body)',
      maxWidth: 480,
      margin: '22px 0 0'
    }
  }, "Une fiduciaire \xE0 taille humaine qui prend en charge votre d\xE9claration d'imp\xF4ts du d\xE9but \xE0 la fin \u2014 avec un conseil clair, sans jargon."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 32,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 19
    }),
    onClick: () => onNavigate('contact')
  }, "Commencer ma d\xE9claration"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "phone",
      size: 18
    }),
    onClick: () => onNavigate('contact')
  }, "Prendre rendez-vous")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 26,
      color: 'var(--text-muted)',
      fontSize: 14.5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle",
    size: 18,
    color: "var(--green-600)"
  }), "Premier entretien offert \xB7 R\xE9ponse sous 24 h")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '-12% -8% -12% 6%',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--petrol-800)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(WaveField, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '34px 8px'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    elevation: "lg",
    padding: "lg",
    style: {
      maxWidth: 380,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-eyebrow"
  }, "D\xE9claration 2025"), /*#__PURE__*/React.createElement(Badge, {
    variant: "success",
    dot: true
  }, "En cours")), /*#__PURE__*/React.createElement("div", {
    className: "fx-figure",
    style: {
      fontSize: 38,
      fontWeight: 500,
      color: 'var(--text-strong)',
      margin: '14px 0 2px'
    }
  }, "CHF 2'480"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, "\xC9conomie estim\xE9e vs. l'an dernier"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border-subtle)',
      margin: '20px 0'
    }
  }), [['Documents reçus', true], ['Optimisation en cours', true], ['Validation client', false]].map(([t, done], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: done ? 'var(--teal-100)' : 'var(--neutral-100)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    color: done ? 'var(--brand)' : 'var(--neutral-400)'
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: done ? 'var(--text-strong)' : 'var(--text-muted)',
      fontWeight: done ? 500 : 400
    }
  }, t))))))));
}

/* Decorative flowing wave field for dark panels */
function WaveField({
  opacity = 1
}) {
  const rows = [];
  for (let i = 0; i < 9; i++) {
    const colors = ['#3FA7A0', '#79C5BD', 'rgba(255,255,255,0.5)'];
    rows.push(/*#__PURE__*/React.createElement("path", {
      key: i,
      d: `M-10 ${20 + i * 28}c40-26 80-26 120 0s80 26 120 0 80-26 120 0 80 26 120 0`,
      stroke: colors[i % 3],
      strokeWidth: "2",
      fill: "none",
      strokeLinecap: "round",
      opacity: 0.55
    }));
  }
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 460 280",
    preserveAspectRatio: "xMidYMid slice",
    style: {
      width: '100%',
      height: '100%',
      opacity
    }
  }, rows);
}
window.Hero = Hero;
window.WaveField = WaveField;

/* ---------- Trust strip ---------- */
function TrustStrip() {
  const stats = [['1\u2009200+', 'déclarations déposées'], ['4,9/5', 'satisfaction client'], ['2008', 'au service des Romands'], ['24 h', 'délai de réponse']];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-6) var(--gutter)',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 24
    },
    className: "fx-stats-grid"
  }, stats.map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-figure",
    style: {
      fontSize: 34,
      fontWeight: 600,
      color: 'var(--petrol-800)',
      letterSpacing: '-0.02em'
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, l)))));
}
window.TrustStrip = TrustStrip;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/sections/HeroSection.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
