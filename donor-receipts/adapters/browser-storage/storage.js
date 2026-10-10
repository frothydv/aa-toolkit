/* Browser storage adapter: load() -> data|null, save(data) -> bool, loadSettings(), saveSettings(obj). Data never leaves this device. */
(function (root) {
  'use strict';
  var KEY = 'donorReceipts.data.v1', SKEY = 'donorReceipts.settings.v1', mem = {};
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
  function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { mem[k] = v; return false; } }
  root.DonorStorage = {
    name: 'browser',
    load: function () { var r = get(KEY); if (!r) return null; try { return root.Donors.sanitize(JSON.parse(r)); } catch (e) { return null; } },
    save: function (d) { return set(KEY, JSON.stringify(d)); },
    loadSettings: function () { try { return JSON.parse(get(SKEY)) || {}; } catch (e) { return {}; } },
    saveSettings: function (s) { return set(SKEY, JSON.stringify(s)); }
  };
})(window);
