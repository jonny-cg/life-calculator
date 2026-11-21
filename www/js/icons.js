/* 라인 아이콘 (자체 제작 SVG) */
(function () {
  const P = {
    back: '<path d="M15 18l-6-6 6-6"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5M12 7.7v.1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 4v4.5h4.5"/><path d="M12 7.5V12l3 2"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    backspace: '<path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4.5V11h-6.5"/>',
    swap: '<path d="M7 4v16M7 20l-3.5-3.5M7 20l3.5-3.5M17 20V4M17 4l-3.5 3.5M17 4l3.5 3.5"/>',
    exchange: '<circle cx="12" cy="12" r="9"/><path d="M8.5 9.5h7l-2.2-2.2M15.5 14.5h-7l2.2 2.2"/>',
    stock: '<path d="M3.5 20.5h17"/><path d="M4.5 16l5-5.5 3.5 3.5 6.5-7.5"/><path d="M15 6.5h4.5V11"/>',
    gold: '<path d="M3 19.5l2.2-5.5h5.6l2.2 5.5z"/><path d="M11 19.5l2.2-5.5h5.6L21 19.5z"/><path d="M7 13l2.2-5.5h5.6L17 13"/><path d="M12 2.5v1.8M7.6 4.2l1 1.2M16.4 4.2l-1 1.2"/>',
    age: '<path d="M4 20.5h16M5.5 20.5v-6.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6.5"/><path d="M5.5 16c1.1.9 2.1.9 3.2 0s2.1-.9 3.3 0 2.1.9 3.3 0 2.1-.9 3.2 0"/><path d="M12 12V8.5"/><path d="M12 6.2c1-.9 1-2 0-3-1 1-1 2.1 0 3z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16 16"/>',
    calorie: '<path d="M12 21.5c-3.9 0-7-2.8-7-6.7 0-4.4 4.3-6.6 4.6-11.3 2.9 1.6 4.4 4.3 4.4 6.7.9-.6 1.5-1.6 1.7-2.8 1.8 1.7 3.3 4.2 3.3 7.4 0 3.9-3.1 6.7-7 6.7z"/><path d="M12 21.5c-1.7 0-3-1.2-3-2.9 0-2 2-3 2.2-5 1.9 1.2 3.8 2.6 3.8 5 0 1.7-1.3 2.9-3 2.9z"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
    gift: '<rect x="4" y="9.5" width="16" height="10.5" rx="1.8"/><path d="M3 9.5h18M12 9.5V20M12 9.5C10.8 6 7 5.2 7 7.4c0 1.6 2.4 2.1 5 2.1zM12 9.5c1.2-3.5 5-4.3 5-2.1 0 1.6-2.4 2.1-5 2.1z"/>',
    flag: '<path d="M5.5 21V4M5.5 4.5h11.5l-2.2 4 2.2 4H5.5"/>',
    plane: '<path d="M10.2 13.8L3.5 11.6l1.3-1.6 7.4.9 4.6-4.7c.9-.9 2.3-1.2 2.8-.7s.2 1.9-.7 2.8l-4.7 4.6.9 7.4-1.6 1.3-2.2-6.7-3.4 3.3.2 2.5-1.2 1-1.4-3.3-3.3-1.4 1-1.2 2.5.2z"/>',
    star: '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
    book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
    work: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17"/>',
    health: '<path d="M9.5 3.8h5v5.7h5.7v5h-5.7v5.7h-5v-5.7H3.8v-5h5.7z"/>',
    doc: '<path d="M7 3.5h7l4.5 4.5v11A1.5 1.5 0 0 1 17 20.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h6"/>',

    tabCalc: '<rect x="5" y="2.5" width="14" height="19" rx="3"/><rect x="8" y="5.5" width="8" height="4" rx="1"/><path stroke-width="2.4" d="M8.6 13.4h.01M12 13.4h.01M15.4 13.4h.01M8.6 17.2h.01M12 17.2h.01M15.4 17.2h.01"/>',
    tabTools: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    tabSettings: '<path d="M4 7h9M18.5 7H20M4 17h3.5M12.5 17H20"/><circle cx="15.8" cy="7" r="2.4"/><circle cx="10" cy="17" r="2.4"/>',

    area: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 12H11v8.5M11 3.5V8M15 12h5.5"/>',
    length: '<path d="M3.3 15.8L15.8 3.3a1 1 0 0 1 1.4 0l3.5 3.5a1 1 0 0 1 0 1.4L8.2 20.7a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 0 1 0-1.4z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/>',
    discount: '<path d="M3 12.6V4.5A1.5 1.5 0 0 1 4.5 3h8.1a1.5 1.5 0 0 1 1.06.44l7 7a1.5 1.5 0 0 1 0 2.12l-8.1 8.1a1.5 1.5 0 0 1-2.12 0l-7-7A1.5 1.5 0 0 1 3 12.6z"/><circle cx="7.6" cy="7.6" r="1.2"/><path d="M15.2 10.6l-4.6 4.6"/><circle cx="11" cy="11" r=".9"/><circle cx="14.8" cy="14.8" r=".9"/>',
    dday: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path stroke-width="2.4" d="M8 14h.01M12 14h.01M16 14h.01M8 17.3h.01M12 17.3h.01"/>',
    lunar: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    loan: '<path d="M3 9.5L12 4l9 5.5"/><path d="M5 10.5v7.5M9.7 10.5v7.5M14.3 10.5v7.5M19 10.5v7.5"/><path d="M3 20.5h18"/>',
    savings: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4"/>',
    speed: '<path d="M4.2 17.5a9 9 0 1 1 15.6 0"/><path d="M12 14l4.2-4.8"/><circle cx="12" cy="14" r="1.5"/>',
    bmi: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M7.5 10a6.2 6.2 0 0 1 9 0"/><path d="M12 12l1.6-2.6"/>',
    bodyfat: '<path d="M12 3.5s6 6.4 6 10.7a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/><path d="M9.3 14.3a2.7 2.7 0 0 0 2.7 2.7"/>'
  };

  function icon(name, opts) {
    opts = opts || {};
    const sw = opts.sw || 2;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }

  LC.icon = icon;
})();
