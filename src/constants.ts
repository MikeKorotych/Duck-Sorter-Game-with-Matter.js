export const LERP_SPEED = 0.1; // the higher value - the faster player moves

export const GAME_SIZE = 800;
export const SPAWN_RADIUS = 70;

export const FEAR_RADIUS = 150; // The distance at which ducks start to flee
export const FEAR_FORCE = 0.00035; // The maximum force applied to a duck

export const BOUNDS_FORCE = 0.008; // The force that pushes ducks back into the play area
export const BOUNDS_BUFFER = 20; // The buffer zone outside the play area where nothing happens

export const GROUPING_FORCE = 0.0000002; // The gentle force pulling ducks together

export const COMFORT_RADIUS = 20; // Ducks' personal space radius
export const COMFORT_FORCE = 0.00005; // Force to push ducks apart

export const SORTING_RADIUS = 40; // Radius to check for foreign ducks

export const DUCK_SIZE = 8;
export const DUCK_GROUP_SIZE = 4;
export const DUCK_GROUP_COUNT = 3;

export const FRICTION_AIR = 0.1;

export const STARTING_PLAYER_POSITION = { x: 295, y: 500 };
export const BASE_COLORS = [
  '#1a1c2c',
  '#5d275d',
  '#b13e53',
  '#ef7d57',
  '#ffcd75',
  '#a7f070',
  '#38b764',
  '#257179',
  '#29366f',
  '#3b5dc9',
  '#41a6f6',
  '#73eff7',
  '#94b0c2',
  '#566c86',
  '#333c57',
];

export const GROUP_OPTIONS = [2, 3, 4];
export const DUCKS_OPTIONS = [2, 3, 4];

// @ts-ignore
export enum GameState {
  START = 'start',
  PLAYING = 'playing',
  WON = 'won',
}
