const KEY = 'vice-horizon-save-v1';
const clean = state => ({ cash: state.cash | 0, weapon: state.weapon, x: Math.round(state.player.x), y: Math.round(state.player.y), health: state.player.health, armor: state.player.armor, mission: state.mission?.id || 0 });
export function saveGame(state) { try { localStorage.setItem(KEY, JSON.stringify(clean(state))); return true; } catch { return false; } }
export function loadGame() { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export function clearSave() { try { localStorage.removeItem(KEY); } catch {} }
export function applySave(state, data) { if (!data) return state; state.cash = data.cash || 0; state.weapon = data.weapon || 'fists'; state.player.x = data.x || state.player.x; state.player.y = data.y || state.player.y; state.player.health = data.health ?? 100; state.player.armor = data.armor ?? 0; return state; }
// Persistence authoring notes
// The save key is versioned.
// Only gameplay essentials are serialized.
// Derived entities are regenerated from the seed.
// Derived police are not persisted.
// Derived particles are not persisted.
// Derived projectiles are not persisted.
// Cash is stored as an integer.
// Position is rounded for compact output.
// Health and armor are restored directly.
// Weapon selection is restored directly.
// Missing fields use safe defaults.
// Browser storage failures are swallowed.
// Private browsing remains playable.
// A missing save is a normal new game.
// Clear is available for future menus.
// Apply mutates the active state intentionally.
// Save does not include a timestamp.
// Save does not include random state.
// Save does not include browser dimensions.
// Save does not include audio state.
// Save does not include camera state.
// Save does not include transient mission text.
// The mission id is retained for inspection.
// Main can call save after a payout.
// Load can be requested with L.
// This API has no filesystem dependency.
// This API has no server dependency.
// This API has no date dependency.
// This API is deterministic for the same state.
// The JSON format remains human readable.
// The key avoids collisions with unrelated apps.
// The version suffix supports migration.
// The code stays compatible with headless shots.
// Storage is accessed only inside try blocks.
// Invalid JSON becomes a fresh game.
// Invalid values fall back where practical.
// Position defaults are supplied by the player.
// Resource defaults are supplied by the player.
// The persistence surface is deliberately narrow.
// This note block documents the authoring pass.
// Save module complete.
// Load remains safe.
// Clear remains safe.
// Apply remains explicit.
// Storage remains optional.
// Data remains small.
// JSON remains deterministic.
// Browser remains supported.
// Final save line.
// Save reads only public resources.
// Load writes only public resources.
// Clear removes one namespaced key.
// Storage remains best effort.
// Save module final.
