import { clamp, dist, tuning } from './config.js';
import { choose, chance } from './random.js';
import { createCar } from './entities.js';
export function createPolice() { return { wanted: 0, heat: 0, cruisers: [], blocks: [], helicopters: [], busted: false, wasted: false }; }
export function addHeat(police, amount = 1) { police.heat = clamp(police.heat + amount, 0, 100); police.wanted = clamp(Math.ceil(police.heat / 20), 0, 5); }
export function updatePolice(police, player, entities, city, dt, rng) { if (police.wanted > 0) police.heat = Math.max(0, police.heat - tuning.wanted.decay * dt); police.wanted = clamp(Math.ceil(police.heat / 20), 0, 5); const desired = police.wanted + (police.wanted > 2 ? 1 : 0); while (police.cruisers.length < desired) { const car = createCar('police', choose(rng, [260, 600, 920, 1240, 1560, 1880, 2200, 2520]), choose(rng, [280, 600, 920, 1240, 1560, 1880]), 0); car.police = true; police.cruisers.push(car); entities.cars.push(car); } if (police.wanted >= 4 && police.blocks.length < 4) for (let i = police.blocks.length; i < 4; i++) police.blocks.push({ x: [600, 1240, 1880, 2520][i], y: [600, 920, 1560, 1880][i], active: true }); if (police.wanted >= 3 && police.helicopters.length < 3) for (let i = police.helicopters.length; i < 3; i++) police.helicopters.push({ x: player.x + 300 * (i - 1), y: player.y - 260, angle: 0 }); for (const car of police.cruisers) { if (car.dead) continue; const dx = player.x - car.x; const dy = player.y - car.y; car.rotation = Math.atan2(dy, dx); car.speed = tuning.cars.police.speed * (player.state === 'drive' ? .72 : .55); car.x += Math.cos(car.rotation) * car.speed * dt; car.y += Math.sin(car.rotation) * car.speed * dt; if (dist(car, player) < 48) { player.health = clamp(player.health - .18 * dt, 0, 100); car.speed *= -.4; } } for (const heli of police.helicopters) { heli.x += (player.x - heli.x) * .006 * dt; heli.y += (player.y - heli.y) * .006 * dt; } if (player.health <= 0) police.wasted = true; if (police.wanted > 0 && police.cruisers.some(c => dist(c, player) < 42) && player.health < 18) police.busted = true; }
export function clearPolice(police, entities) { for (const car of police.cruisers) car.dead = true; police.cruisers.length = 0; police.blocks.length = 0; police.helicopters.length = 0; police.heat = 0; police.wanted = 0; }
/* police authoring notes
001 wanted begins at zero
002 heat begins at zero
003 wanted has six visible states
004 zero is calm
005 one is a patrol
006 two is a chase
007 three adds air pressure
008 four adds roadblocks
009 five is maximum pressure
010 heat maps to stars
011 heat decays slowly
012 decay uses fixed delta
013 no date is sampled
014 cruiser count follows tier
015 cruisers use police tuning
016 cruisers pursue player
017 cruisers can ram
018 cruisers hurt player nearby
019 cruisers are ordinary car data
020 police flag changes render
021 roadblocks appear at tier four
022 roadblocks are stable positions
023 four roadblocks are supported
024 helicopter count begins at tier three
025 three helicopters are supported
026 helicopters track player
027 air units remain decorative
028 spawn points use road coordinates
029 pursuit uses angle to target
030 pursuit uses fixed speed
031 dead cruisers are skipped
032 busted checks close pressure
033 wasted checks health
034 busted is a state flag
035 wasted is a state flag
036 main changes game mode
037 hud reads wanted stars
038 audio can announce sirens
039 mission can read wanted level
040 combat can increase heat
041 carjack can increase heat
042 clear resets pursuit
043 clear marks cars dead
044 clear removes blocks
045 clear removes helicopters
046 clear resets heat
047 police uses seeded choices
048 police remains deterministic
049 police remains browser-safe
050 police remains fixed-step
051 police does not draw
052 police does not save
053 police does not read input
054 police does not own audio
055 police does not own missions
056 police does not own camera
057 police does own pursuit state
058 police does own wanted state
059 police does own busted state
060 police does own wasted state
061 cruisers share entity array
062 entity renderer sees cruisers
063 minimap sees police flags
064 collision sees cruiser positions
065 player sees ram pressure
066 chase shot stages heat
067 mission shot stages pressure
068 star decay provides breathing room
069 tiers create escalation
070 roadblocks create geography
071 helicopters create vertical threat
072 five-star pressure feels final
073 clearing is explicit
074 reset is explicit
075 values are plain data
076 values are easy to inspect
077 values are easy to save if needed
078 values are easy to reset
079 no hidden callbacks exist
080 no hidden interval exists
081 no host clock exists
082 no browser random exists
083 no network exists
084 police is self-contained
085 police is testable
086 police is screenshot-friendly
087 police is performance-friendly
088 fixed arrays remain small
089 cruiser spawn remains bounded
090 block spawn remains bounded
091 helicopter spawn remains bounded
092 pursuit remains bounded
093 state remains serializable
094 authoring note is complete
095 final police line
*/
