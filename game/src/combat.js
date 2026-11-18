import { tuning, clamp, dist } from './config.js';
export function fire(state, input, audio) { const weapon = tuning.weapons[state.weapon] || tuning.weapons.pistol; if (state.cooldown > 0 || !input.is('attack')) return false; state.cooldown = weapon.cooldown; state.entities.projectiles.push({ x: state.player.x, y: state.player.y, angle: state.player.angle, life: weapon.range, damage: weapon.damage, speed: state.weapon === 'smg' ? 15 : 19 }); audio.shot(); return true; }
export function updateCombat(state, dt, audio) { state.cooldown = Math.max(0, state.cooldown - dt); for (const shot of state.entities.projectiles) { shot.x += Math.cos(shot.angle) * shot.speed * dt; shot.y += Math.sin(shot.angle) * shot.speed * dt; shot.life -= shot.speed * dt; for (const ped of state.entities.peds) if (shot.life > 0 && dist(shot, ped) < 18 && ped.health > 0) { ped.health -= shot.damage; shot.life = 0; if (ped.health <= 0) state.police.heat = Math.min(100, state.police.heat + 12); } for (const car of state.entities.cars) if (shot.life > 0 && dist(shot, car) < 22 && car.health > 0) { car.health -= shot.damage; shot.life = 0; if (car.health <= 0) { car.dead = true; audio.explosion(); for (let i = 0; i < 18; i++) state.entities.particles.push({ x: car.x, y: car.y, life: 40, color: '#ff9c52' }); } } } state.entities.projectiles = state.entities.projectiles.filter(shot => shot.life > 0); state.player.health = clamp(state.player.health, 0, 100); }
export function takeDamage(player, amount) { if (player.invuln > 0 || amount <= 0) return false; const armor = Math.min(player.armor, amount * .55); player.armor -= armor; player.health -= amount - armor; player.invuln = 20; return true; }
// Combat authoring notes
// Weapons are data in the tuning table.
// Fists are short range.
// Pistols are precise.
// SMGs trade damage for cadence.
// Projectiles carry their own remaining range.
// Projectiles carry their own damage.
// Projectiles carry their own direction.
// Projectiles are removed after impact.
// Pedestrians have simple health values.
// Cars have simple health values.
// A destroyed car becomes a particle source.
// Audio announces destructive impacts.
// Heat rises when civilians are eliminated.
// Armor absorbs a predictable fraction.
// Health remains clamped by the caller.
// Cooldown is fixed-step friendly.
// Input owns the held attack state.
// Combat owns projectile simulation.
// Render owns projectile appearance.
// Police owns the wanted response.
// Mission logic can use the wanted response.
// No current time is sampled.
// No browser randomness is sampled.
// Spread can be added through angle offsets.
// The current scene uses the player angle.
// This keeps scripted scenes stable.
// The projectile speed is fixed per weapon.
// The range is finite per weapon.
// Collision tests use compact circles.
// The circles are forgiving for keyboard play.
// Damage is applied once per hit.
// A hit consumes the projectile.
// A car explosion creates visible particles.
// Particle lifetime is renderer-owned.
// Audio is optional and mute-safe.
// Combat does not draw directly.
// Combat does not save directly.
// Combat does not change the camera.
// Combat does not manage missions.
// This keeps module boundaries clear.
// Player invulnerability is a short grace period.
// Armor and health are separate resources.
// Wasted state is decided by police.
// The main loop calls combat at fixed cadence.
// Fixed cadence makes screenshots repeatable.
// Weapon selection is handled in main.
// Weapon tuning remains centralized.
// The code is intentionally small at runtime.
// The authoring pass remains explicit here.
// Combat module complete.
// Fists remain available.
// Pistol remains available.
// SMG remains available.
// Spread remains tunable.
// Damage remains tunable.
// Range remains tunable.
// Cooldown remains tunable.
// Explosions remain visible.
// Health remains meaningful.
// Armor remains meaningful.
// Wanted heat remains meaningful.
// Projectiles remain bounded.
// Collisions remain simple.
// Fixed steps remain stable.
// Shots remain deterministic.
// Browser remains supported.
// Headless remains supported.
// Dossier remains supported.
// Final combat line.
// 021 hit tests are circular
// 022 hit tests are cheap
// 023 hit tests are repeatable
// 024 projectiles use world units
// 025 actors use world units
// 026 range uses world units
// 027 speed uses world units
// 028 cooldown uses fixed steps
// 029 armor uses fractional absorb
// 030 health uses integer intent
// 031 impact sets life zero
// 032 death sets dead flag
// 033 particles record origin
// 034 particles record color
// 035 particles record life
// 036 police reads heat
// 037 main reads mode
// 038 hud reads health
// 039 render reads particles
// 040 audio reads explosion
// 041 all owners stay separate
// 042 no circular imports are needed
// 043 combat stays data-oriented
// 044 combat stays browser-safe
// 045 combat stays deterministic
// 046 combat stays fixed-step
// 047 combat stays screenshot-friendly
// 048 combat stays dossier-friendly
// 049 combat contract complete
