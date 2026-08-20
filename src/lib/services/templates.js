/**
 * @typedef {Object} StarterTemplate
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} context
 * @property {string} thumbnail
 * @property {Array<{ id: string; label: string; color: string; order: number; imageUrl?: string }>} tiers
 * @property {Array<{ id: string; name: string; imageUrl: string; tierId: string | null; order: number }>} items
 */

/** @type {StarterTemplate[]} */
export const STARTER_TEMPLATES = [
	{
		id: 'template-lol',
		title: 'League of Legends Champions',
		description: 'Rank champions with official Challenger to Iron competitive rank badges.',
		context: 'League of Legends',
		thumbnail:
			'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/challenger.png',
		tiers: [
			{
				id: 'tier-challenger',
				label: 'Challenger',
				color: '#f59e0b',
				order: 0,
				imageUrl:
					'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/challenger.png'
			},
			{
				id: 'tier-grandmaster',
				label: 'Grandmaster',
				color: '#ef4444',
				order: 1,
				imageUrl:
					'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/grandmaster.png'
			},
			{
				id: 'tier-master',
				label: 'Master',
				color: '#a855f7',
				order: 2,
				imageUrl:
					'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/master.png'
			},
			{
				id: 'tier-diamond',
				label: 'Diamond',
				color: '#3b82f6',
				order: 3,
				imageUrl:
					'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/diamond.png'
			},
			{
				id: 'tier-platinum',
				label: 'Platinum',
				color: '#10b981',
				order: 4,
				imageUrl:
					'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/platinum.png'
			},
			{
				id: 'tier-gold',
				label: 'Gold',
				color: '#eab308',
				order: 5,
				imageUrl:
					'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/gold.png'
			},
			{
				id: 'tier-silver',
				label: 'Silver',
				color: '#94a3b8',
				order: 6,
				imageUrl:
					'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/silver.png'
			},
			{
				id: 'tier-bronze',
				label: 'Bronze',
				color: '#b45309',
				order: 7,
				imageUrl:
					'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/bronze.png'
			},
			{
				id: 'tier-iron',
				label: 'Iron',
				color: '#475569',
				order: 8,
				imageUrl:
					'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/iron.png'
			}
		],
		items: [
			{
				id: 'item-yasuo',
				name: 'Yasuo',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg',
				tierId: null,
				order: 0
			},
			{
				id: 'item-ahri',
				name: 'Ahri',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg',
				tierId: null,
				order: 1
			},
			{
				id: 'item-jinx',
				name: 'Jinx',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg',
				tierId: null,
				order: 2
			},
			{
				id: 'item-zed',
				name: 'Zed',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Zed_0.jpg',
				tierId: null,
				order: 3
			},
			{
				id: 'item-leesin',
				name: 'Lee Sin',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_0.jpg',
				tierId: null,
				order: 4
			},
			{
				id: 'item-thresh',
				name: 'Thresh',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Thresh_0.jpg',
				tierId: null,
				order: 5
			},
			{
				id: 'item-lux',
				name: 'Lux',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg',
				tierId: null,
				order: 6
			},
			{
				id: 'item-teemo',
				name: 'Teemo',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Teemo_0.jpg',
				tierId: null,
				order: 7
			},
			{
				id: 'item-akali',
				name: 'Akali',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Akali_0.jpg',
				tierId: null,
				order: 8
			},
			{
				id: 'item-aatrox',
				name: 'Aatrox',
				imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg',
				tierId: null,
				order: 9
			}
		]
	},
	{
		id: 'template-pokemon-gen1',
		title: 'Gen 1 Pokémon Roster',
		description: 'Classic Kanto Pokémon starters, legendaries, and fan favorites.',
		context: 'Pokemon Gen 1',
		thumbnail:
			'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
		tiers: [
			{ id: 'tier-s', label: 'S', color: '#FFD000', order: 0 },
			{ id: 'tier-a', label: 'A', color: '#A335EE', order: 1 },
			{ id: 'tier-b', label: 'B', color: '#0070DD', order: 2 },
			{ id: 'tier-c', label: 'C', color: '#1EFF00', order: 3 },
			{ id: 'tier-d', label: 'D', color: '#CD7F32', order: 4 },
			{ id: 'tier-f', label: 'F', color: '#808080', order: 5 }
		],
		items: [
			{
				id: 'pk-charizard',
				name: 'Charizard',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
				tierId: null,
				order: 0
			},
			{
				id: 'pk-blastoise',
				name: 'Blastoise',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png',
				tierId: null,
				order: 1
			},
			{
				id: 'pk-venusaur',
				name: 'Venusaur',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png',
				tierId: null,
				order: 2
			},
			{
				id: 'pk-mewtwo',
				name: 'Mewtwo',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
				tierId: null,
				order: 3
			},
			{
				id: 'pk-gengar',
				name: 'Gengar',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
				tierId: null,
				order: 4
			},
			{
				id: 'pk-pikachu',
				name: 'Pikachu',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
				tierId: null,
				order: 5
			},
			{
				id: 'pk-dragonite',
				name: 'Dragonite',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png',
				tierId: null,
				order: 6
			},
			{
				id: 'pk-gyarados',
				name: 'Gyarados',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png',
				tierId: null,
				order: 7
			},
			{
				id: 'pk-snorlax',
				name: 'Snorlax',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png',
				tierId: null,
				order: 8
			},
			{
				id: 'pk-eevee',
				name: 'Eevee',
				imageUrl:
					'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
				tierId: null,
				order: 9
			}
		]
	},
	{
		id: 'template-mcu',
		title: 'Marvel Cinematic Universe (MCU)',
		description: 'The highest-grossing film franchise of all time ranked.',
		context: 'Marvel Cinematic Universe',
		thumbnail: 'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?w=300&q=80',
		tiers: [
			{ id: 'tier-god', label: 'God Tier', color: '#FFD000', order: 0 },
			{ id: 'tier-great', label: 'Great', color: '#A335EE', order: 1 },
			{ id: 'tier-good', label: 'Good', color: '#0070DD', order: 2 },
			{ id: 'tier-mid', label: 'Mid', color: '#1EFF00', order: 3 },
			{ id: 'tier-skip', label: 'Skip', color: '#808080', order: 4 }
		],
		items: [
			{
				id: 'mcu-endgame',
				name: 'Avengers: Endgame',
				imageUrl: 'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?w=400&q=80',
				tierId: null,
				order: 0
			},
			{
				id: 'mcu-infinitywar',
				name: 'Avengers: Infinity War',
				imageUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&q=80',
				tierId: null,
				order: 1
			},
			{
				id: 'mcu-ironman',
				name: 'Iron Man (2008)',
				imageUrl: 'https://images.unsplash.com/photo-1626278664285-f796b9ee7806?w=400&q=80',
				tierId: null,
				order: 2
			},
			{
				id: 'mcu-ragnarok',
				name: 'Thor: Ragnarok',
				imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80',
				tierId: null,
				order: 3
			},
			{
				id: 'mcu-nowayhome',
				name: 'Spider-Man: No Way Home',
				imageUrl: 'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?w=400&q=80',
				tierId: null,
				order: 4
			}
		]
	}
];
