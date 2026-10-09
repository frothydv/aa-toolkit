/* Browser storage adapter. Same interface a Google Sheet adapter will implement:
   load() -> data, save(data), loadSettings() -> {}, saveSettings(obj). Falls back to memory if storage is blocked. */
(function (root) {
  'use strict';
  var KEY = 'volunteerShifts.data.v1', SKEY = 'volunteerShifts.settings.v1', mem = {};
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
  function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { mem[k] = v; return false; } }
  root.VolunteerStorage = {
    name: 'browser',
    load: function () { var r = get(KEY); if (!r) return null; try { return root.VolunteerShifts.sanitize(JSON.parse(r)); } catch (e) { return null; } },
    save: function (d) { return set(KEY, JSON.stringify(d)); },
    loadSettings: function () { try { return JSON.parse(get(SKEY)) || {}; } catch (e) { return {}; } },
    saveSettings: function (s) { return set(SKEY, JSON.stringify(s)); }
  };
})(window);
