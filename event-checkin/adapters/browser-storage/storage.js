/* Browser storage adapter. Interface: load() -> data|null, save(data) -> bool, loadSettings() -> {}, saveSettings(obj).
   Falls back to memory if the browser blocks storage (save() then returns false). */
(function (root) {
  'use strict';
  var KEY = 'eventCheckin.data.v1', SKEY = 'eventCheckin.settings.v1', mem = {};
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
  function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { mem[k] = v; return false; } }
  root.CheckinStorage = {
    name: 'browser',
    load: function () { var r = get(KEY); if (!r) return null; try { return root.Checkin.sanitize(JSON.parse(r)); } catch (e) { return null; } },
    save: function (d) { return set(KEY, JSON.stringify(d)); },
    loadSettings: function () { try { return JSON.parse(get(SKEY)) || {}; } catch (e) { return {}; } },
    saveSettings: function (s) { return set(SKEY, JSON.stringify(s)); }
  };
})(window);
