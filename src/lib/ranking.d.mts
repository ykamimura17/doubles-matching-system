import type {State,Player} from './types';
export type RankedPlayer=Player&{gamesWon:number;rank:number};
export function rankPlayers(state:State):RankedPlayer[];
