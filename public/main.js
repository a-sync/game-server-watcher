const id = s => document.getElementById(s);

let configEditor;
$(async () => {
    const gswFeatures = await fetchApi('GET', 'features');
    if (gswFeatures) {
        await setRandomBg().catch(() => { });
        setInterval(setRandomBg, 60000);

        let unsavedChanges = false;
        const confirmText = 'You have unsaved changes! Are you sure you want to ';
        $(window).on('beforeunload', e => {
            if (unsavedChanges) return confirmText + 'navigate away?';
        });
        $('#logout').click(e => {
            e.preventDefault();
            if (unsavedChanges && !confirm(confirmText + 'log out?')) return;
            logout();
        });

        activateMenu();
        $('body > nav > ul > li > a').click(e => {
            e.preventDefault();
            activateMenu(e.currentTarget);
        });

        $('#top-menu').removeClass('invisible');
        $('body > footer').removeClass('d-none');

        // Configuration
        const gswConfig = await fetchApi('GET', 'config');
        if (gswConfig && gswConfig.config) {
            configEditor = new JSONEditor(id('config-form'), {
                "theme": "bootstrap4",
                "iconlib": "fontawesome5",
                "object_layout": "normal",
                "template": "mustache",
                "show_errors": "always",
                "required_by_default": 0,
                "no_additional_properties": 1,
                "display_required_only": 0,
                "remove_empty_properties": 1,
                "keep_oneof_values": 0,
                "ajax": 0,
                "ajaxCredentials": 0,
                "show_opt_in": 1,
                "disable_edit_json": 0,
                "disable_collapse": 1,
                "disable_properties": 1,
                "disable_array_add": 0,
                "disable_array_reorder": 1,
                "disable_array_delete": 0,
                "enable_array_copy": 1,
                "array_controls_top": 0,
                "disable_array_delete_all_rows": 1,
                "disable_array_delete_last_row": 1,
                "prompt_before_delete": 1,
                "schema": {
                    "title": "Configuration",
                    "type": "array",
                    "default": [],
                    "minItems": 0,
                    "uniqueItems": true,
                    "format": "tabs-top",
                    "items": {
                        "title": "Game Server",
                        "type": "object",
                        "required": [
                            "name",
                            "type",
                            "host",
                            "port"
                        ],
                        "properties": {
                            "name": {
                                "title": "Name",
                                "type": "string",
                                "options": {
                                    "grid_columns": 12
                                }
                            },
                            "type": {
                                "title": "Gamedig type",
                                "description": "Look for the <i>GameDig Type ID</i> in the <a href=\"https://github.com/a-sync/node8-gamedig#games-list\">games list</a>.",
                                "type": "string",
                                "options": {
                                    "grid_columns": 6
                                }
                            },
                            "appId": {
                                "title": "Steam App ID",
                                "description": "Look for the <i>AppID</i> in the <a href=\"https://steamdb.info/apps/\">apps list</a>.",
                                "type": "integer",
                                "format": "number",
                                "options": {
                                    "grid_columns": 6
                                }
                            },
                            "host": {
                                "title": "Host name or IP",
                                "type": "string",
                                "options": {
                                    "grid_columns": 6
                                }
                            },
                            "port": {
                                "title": "Port number",
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 65535,
                                "format": "number",
                                "options": {
                                    "grid_columns": 6
                                }
                            },
                            "updateIntervalMinutes": {
                                "title": "Update interval (minutes) [NOT IMPLEMENTED]",
                                "type": "integer",
                                "default": 5,
                                "minimum": 1,
                                "maximum": 60,
                                "format": "range",
                                "options": {
                                    "grid_columns": 12
                                }
                            },
                            "graphHistoryHours": {
                                "title": "Graph history time span (hours)",
                                "type": "integer",
                                "default": 12,
                                "minimum": 1,
                                "maximum": 24,
                                "format": "range",
                                "options": {
                                    "grid_columns": 12
                                }
                            },
                            "timezoneOffset": {
                                "title": "Time zone offset of the server",
                                "default": 0,
                                "type": "number",
                                "minimum": -12,
                                "maximum": 14,
                                "format": "range",
                                "options": {
                                    "grid_columns": 6,
                                    "grid_break": true
                                }
                            },
                            "discord": {
                                "type": "array",
                                "title": "Discord channels",
                                "description": "The simplest way to get a discord channel ID is to enable developer mode in settings, then right clicking on the channel name will give you the <b>Copy ID</b> option.",
                                "minItems": 0,
                                "uniqueItems": true,
                                "items": {
                                    "type": "object",
                                    "title": "Channel",
                                    "required": [
                                        "channelId"
                                    ],
                                    "properties": {
                                        "channelId": {
                                            "title": "Channel ID",
                                            "type": "string"
                                        }
                                    }
                                },
                                "format": "table",
                                "options": {
                                    "grid_columns": 12
                                }
                            },
                            "telegram": {
                                "type": "array",
                                "title": "Telegram chats",
                                "description": "The simplest way to get a telegram chat ID is to invite <a target=\"_blank\" href=\"https://telegram.me/getidsbot\">@getidsbot</a> and use <code>/start</code> to make it post (among other data) the chat ID.",
                                "minItems": 0,
                                "uniqueItems": true,
                                "items": {
                                    "type": "object",
                                    "title": "Chat",
                                    "required": [
                                        "chatId"
                                    ],
                                    "properties": {
                                        "chatId": {
                                            "type": "string",
                                            "title": "Chat ID"
                                        }
                                    }
                                },
                                "format": "table",
                                "options": {
                                    "grid_columns": 12
                                }
                            }
                        },
                        "format": "grid",
                        "headerTemplate": "{{#self.name}}{{self.name}}{{/self.name}}{{^self.name}}{{self.type}}:{{self.host}}:{{self.port}}{{/self.name}}"
                    }
                },
                startval: gswConfig.config
            });

            configEditor.on('ready', () => {
                addExportButton();
                $('#config-form').submit(e => {
                    e.preventDefault();
                });
                $('#spinner').addClass('d-none');
                $('#protected-section').removeClass('d-none');

                let editorCurrVal = configEditor.getValue();
                let formCurrVal = actualFormValues();
                $('#config-form input, #config-form textarea').keyup(() => {
                    unsavedChanges = checkForChanges(formCurrVal);
                });
                configEditor.on('change', () => {
                    unsavedChanges = checkForChanges(formCurrVal);
                });

                $('#save-config-submit').click(async e => {
                    e.preventDefault();
                    if (!configEditor.isEnabled()) return;
                    configEditor.disable();
                    $(e.currentTarget).addClass('_btn');

                    const uerr = configEditor.validate();
                    if (uerr.length) {
                        notif('warning', 'Validation errors', uerr.map(err => err.path + ' ' + err.message).join('<br>'), undefined, 3 + uerr.length);
                    } else {
                        const res = await fetchApi('POST', 'config', configEditor.getValue());
                        if (res && res.message) {
                            editorCurrVal = configEditor.getValue();
                            formCurrVal = actualFormValues();
                            unsavedChanges = false;
                            dismissSaveConfig();
                            notif('success', '✔️ Changes saved successfully.', undefined, undefined, 3);
                        } else {
                            notif('danger', '⚠️ Error while saving config.', (res ? res.error : undefined), undefined, 3);
                        }
                    }

                    $(e.currentTarget).removeClass('_btn');
                    configEditor.enable();
                });

                $('#save-config-reset').click(e => {
                    e.preventDefault();
                    if (!configEditor.isEnabled()) return;
                    configEditor.setValue(editorCurrVal, true);
                    unsavedChanges = false;
                    dismissSaveConfig();
                    if (formCurrVal !== actualFormValues()) {
                        document.location.reload();
                    }
                });
            });
        } else {
            notif('danger', '⚠️ Error while loading config.');
        }

        // Flush data
        $('button[data-api]').click(async e => {
            e.preventDefault();
            const endpoint = e.currentTarget.dataset.api;

            if (confirm('Are you sure you want to call `' + endpoint + '`?')) {
                const res = await fetchApi('GET', endpoint);
                if (res && res.message) {
                    notif('success', res.message, undefined, undefined, 3);
                } else {
                    notif('danger', (res ? res.error : undefined), undefined, undefined, 3);
                }
            }
        });
    }
});

function dismissSaveConfig() {
    $('#save-config').addClass('animate__fadeOutDown');
    setTimeout(() => {
        if ($('#save-config').hasClass('animate__fadeOutDown')) {
            $('#save-config').addClass('d-none');
        }
    }, 500);
}

// NOTE: sadly configEditor.getValue() can not be trusted when the 
//       change event originates from a keypress event
function actualFormValues() {
    const formItems = $('#config-form .tab-pane:not([style*="display: none"]) input:enabled, #config-form .tab-pane:not([style*="display: none"]) textarea:enabled, #config-form .tab-pane:not([style*="display: none"]) select:enabled').toArray();
    return JSON.stringify(formItems.map(e => {
        if (e.type === 'checkbox') {
            return e.checked ? e.value : undefined;
        }
        return e.value;
    }));
}

function checkForChanges(formCurrVal) {
    if (formCurrVal !== actualFormValues()) {
        $('#save-config').removeClass('d-none');
        $('#save-config').removeClass('animate__fadeOutDown');
        return true;
    } else {
        dismissSaveConfig();
        return false;
    }
};

function addExportButton() {
    const button_holder = configEditor.root.theme.getHeaderButtonHolder();
    const exportBtn = configEditor.root.getButton('Export', 'save', 'Export As JSON File');
    button_holder.appendChild(exportBtn);
    configEditor.root.header.parentNode.insertBefore(button_holder, configEditor.root.header.nextSibling);

    exportBtn.addEventListener('click', e => {
        e.preventDefault();
        const dt = (new Date()).toISOString().slice(0, 19).replace(/\D/g, '');
        const filename = dt + '-gsw.config.json';
        const blob = new Blob([JSON.stringify(configEditor.getValue(), null, 2)], {
            type: 'application/json;charset=utf-8'
        });

        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            const a = document.createElement('a');
            a.download = filename;
            a.href = URL.createObjectURL(blob);
            a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');

            a.dispatchEvent(new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': false
            }));
        }
    }, false);
}

function logout() {
    $(window).off('beforeunload');
    $('#save-config').addClass('d-none');
    $('#top-menu').addClass('invisible');
    $('#protected-section').addClass('d-none');
    $('#spinner').addClass('d-none');
    $('#bye').removeClass('d-none');
    $('body > footer').addClass('d-none');
    if (configEditor) configEditor.destroy();
    window.localStorage.removeItem('btoken');
}

function notif(type, html1, html2, html3, dismissable) {
    let closeTimeout = 0;
    if (typeof dismissable === 'number') {
        closeTimeout = dismissable;
        dismissable = true;
    }

    const el = $('<div/>', { class: 'alert alert-dismissible fade show shadow alert-' + type, role: 'alert' });
    el.attr('role', 'alert');
    if (html2) {
        const h4 = $('<h4/>', { class: 'alert-heading', html: html1 });
        el.append(h4);

        const p1 = $('<p/>', { html: html2 });
        el.append(p1);
        if (html3) {
            el.append($('<hr/>'));
            const p2 = $('<p/>', { class: 'mb-0', html: html3 });
            el.append(p2);
        }
    } else {
        el.html(html1);
    }

    if (dismissable !== false) {
        const button = $('<button/>', { class: 'close', type: 'button', 'data-dismiss': 'alert', 'aria-label': 'Close' });

        const span = $('<span/>', { 'aria-hidden': 'true', html: '&times;' });
        button.append(span);
        el.append(button);
    }

    el.alert();

    if (closeTimeout > 0) {
        const a = $(el);
        const timer = setTimeout(a => {
            a.alert('close');
        }, 1000 * closeTimeout, a);
        a.on('close.bs.alert', function () {
            clearTimeout(timer);
        })
    }

    $('#notif-container').append(el);

    return el;
}

function activateMenu(target) {
    if (!target) {
        target = id('top-menu-configuration');
        if (document.location.hash.length > 1) {
            const hashTargetMenu = id('top-menu-' + document.location.hash.slice(1));
            if (hashTargetMenu) {
                target = hashTargetMenu;
            }
        } else if (window.localStorage.getItem('active.menu')) {
            const stateTargetMenu = id('top-menu-' + window.localStorage.getItem('active.menu').slice(1));
            if (stateTargetMenu) {
                target = stateTargetMenu;
            }
        }
    }

    const menu = target.getAttribute('href');
    const menuItems = document.querySelectorAll('#top-menu > ul > li > a');
    for (const a of menuItems) {
        const at = a.getAttribute('href');
        if (at === menu) {
            $(at).removeClass('d-none');
            $(a).addClass('active');

            window.history.replaceState(null, null, document.location.pathname + menu);
            window.localStorage.setItem('active.menu', menu);

            const titleArr = document.title.split(' #');
            if (titleArr.length < 2) {
                titleArr.push(menu.slice(1));
            } else {
                titleArr[titleArr.length - 1] = menu.slice(1);
            }

            document.title = titleArr.join(' #');
        } else {
            $(at).addClass('d-none');
            $(a).removeClass('active');
        }
    }
}

async function fetchApi(method, endpoint, body) {
    let re = null;
    let errMsg = '';
    const retries = 2;

    try {
        for (let i = 1; i <= retries; i++) {
            errMsg = '';
            const btoken = await getBearerToken();
            if (btoken) {
                const res = await fetch('/' + endpoint, {
                    method,
                    body: (body ? JSON.stringify(body) : undefined),
                    cache: 'no-cache',
                    headers: {
                        'x-btoken': btoken,
                        'content-type': 'application/json'
                    }
                });

                if (res.status === 401) {
                    re = false;
                    window.localStorage.removeItem('btoken');
                    errMsg = 'Invalid token.';
                } else if (res.status === 200) {
                    re = await res.json();
                    break;
                } else errMsg = 'Unexpected API status.';
            } else {
                re = false;
                errMsg = 'Authentication error.';
            }
            if (errMsg !== '') console.error(errMsg + ' method, endpoint', method, endpoint);
        }
    } catch (err) {
        re = null;
        errMsg = 'Unexpected error.';
        console.error('fetchApi: method, endpoint, err, re', method, endpoint, err, re);
    }

    if (!re) {
        logout();
        notif('danger', '⚠️ ' + errMsg, undefined, undefined, 3);
    }

    return re;
}

async function getBearerToken() {
    const bt = window.localStorage.getItem('btoken');
    if (bt) {
        const salt = bt.slice(0, bt.length - 141);
        const valid = bt.slice(-141, -128);
        const hash = bt.slice(-128);
        if (salt.length > 24
            && /^\d{13}$/.test(valid)
            && /^[0-9a-f]{128}$/.test(hash)
            && Date.now() < Number(valid)) {
            return bt;
        }
    }

    // TODO: use modalDialog
    // if (typeof window.showModalDialog === 'function') {} else
    if (typeof HTMLDialogElement === 'function') {
        const ans = await prompt('Admin secret');

        if (ans) window.localStorage.setItem('btoken', await generateBearerToken(ans));
        else window.localStorage.removeItem('btoken');
    } else {
        notif('primary', '⚠️ Close the tab to re-enable dialog boxes.');
    }

    return window.localStorage.getItem('btoken');
}

async function generateBearerToken(secret) {
    const valid = String(Date.now() + 3600000 * 12);
    const salt = Array.from({ length: 3 }).map(() => Math.random().toString(36).slice(2)).join('');

    let hash;
    if (crypto.subtle) {
        const buff = await crypto.subtle.digest('SHA-512', new TextEncoder('utf-8').encode(salt + valid + secret));
        hash = Array.from(new Uint8Array(buff)).map(x => ('00' + x.toString(16)).slice(-2)).join('');
    } else {
        const md = forge.md.sha512.create();
        md.update(salt + valid + secret);
        hash = md.digest().toHex();
    }

    return salt + valid + hash;
}

function setRandomBg() {
    const bgs = [
        'https://i.imgur.com/bDzhwG5.png',
        'https://i.imgur.com/rA8JXuI.png',
        'https://i.imgur.com/pstAPIw.png',
        'https://i.imgur.com/gQD3xfo.png',
        'https://i.imgur.com/iKTfM8z.png'
    ];

    const bgImg = new Image();
    bgImg.src = bgs[Math.floor(Math.random() * bgs.length)];

    return new Promise((resolve, reject) => {
        bgImg.onload = () => {
            document.body.style.backgroundAttachment = 'scroll';
            document.body.style.backgroundRepeat = 'repeat';
            document.body.style.backgroundSize = 'auto';
            document.body.style.backgroundImage = 'url(' + bgImg.src + ')';
            return resolve(bgImg);
        };

        bgImg.onerror = () => {
            return reject(bgImg);
        };
    });
}
